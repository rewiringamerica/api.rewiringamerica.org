import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import _ from 'lodash';
import { Database } from 'sqlite';
import { IRA_INCENTIVES, IRAIncentive } from '../data/ira_incentives';
import { IRA_STATE_SAVINGS } from '../data/ira_state_savings';
import { PROGRAMS } from '../data/programs';
import { AmountType } from '../data/types/amount';
import { PaymentMethod } from '../data/types/incentive-types';
import { InvalidInputError } from '../lib/error';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip';
import { t, tr } from '../lib/i18n';
import calculateIncentives from '../lib/incentives-calculation';
import { isCompleteIncomeInfo } from '../lib/income-info';
import { WEBSITE_CALCULATOR_REQUEST_SCHEMA } from '../schemas/v0/calculator-request';
import {
  WEBSITE_CALCULATOR_RESPONSE_SCHEMA,
  WebsiteCalculatorResponse,
} from '../schemas/v0/calculator-response';
import {
  WEBSITE_INCENTIVE_SCHEMA,
  WebsiteIncentive,
} from '../schemas/v0/incentive';

IRA_INCENTIVES.forEach(incentive => Object.freeze(incentive));

function translateIncentives(incentives: IRAIncentive[]): WebsiteIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,
    item_es: t('items', incentive.item, 'es'),
    item: t('items', incentive.item, 'en'),
    program_es: tr(PROGRAMS[incentive.program].name, 'es'),
    program: tr(PROGRAMS[incentive.program].name, 'en'),
    // strip domain from v0 links:
    more_info_url_es: t('urls', incentive.item, 'es').replace(
      'https://www.rewiringamerica.org',
      '',
    ),
    more_info_url: t('urls', incentive.item, 'en').replace(
      'https://www.rewiringamerica.org',
      '',
    ),
    short_description: tr(incentive.short_description, 'en'),

    type:
      incentive.type === PaymentMethod.PerformanceRebate
        ? PaymentMethod.PosRebate
        : incentive.type,

    // Reconstruct item_type
    item_type:
      incentive.item === 'rooftop_solar_installation'
        ? 'solar_tax_credit'
        : incentive.item === 'electric_vehicle_charger'
        ? 'ev_charger_credit'
        : incentive.type,

    // Transform amounts from v1 to v0 format
    amount: incentive.amount.number,
    amount_type: incentive.amount.type as 'dollar_amount' | 'percent',
    representative_amount: incentive.amount.representative ?? 0,

    // agi_max_limit is not nullable
    agi_max_limit: incentive.agi_max_limit ?? 0,
  }));
}

const CalculatorSchema = {
  description: 'How much money will you get with the Inflation Reduction Act?',
  querystring: WEBSITE_CALCULATOR_REQUEST_SCHEMA,
  response: {
    200: {
      $ref: 'WebsiteCalculatorResponse',
    },
    400: {
      $ref: 'Error',
    },
    404: {
      $ref: 'Error',
    },
  },
} as const;

const IncentivesSchema = {
  description: 'What are all the incentives from the Inflation Reduction Act?',
  response: {
    200: {
      description: 'Successful response',
      type: 'object',
      required: ['incentives'],
      properties: {
        incentives: {
          type: 'array',
          items: {
            $ref: 'WebsiteIncentive',
          },
        },
      },
    },
  },
};

export default async function (
  fastify: FastifyInstance & { sqlite: Database },
) {
  // Add any schemas that are referred to by $id
  const server = fastify.withTypeProvider<
    JsonSchemaToTsProvider<{
      references: [
        typeof WEBSITE_INCENTIVE_SCHEMA,
        typeof WEBSITE_CALCULATOR_RESPONSE_SCHEMA,
      ];
    }>
  >();

  server.get(
    '/api/v0/calculator',
    { schema: CalculatorSchema },
    async (request, reply) => {
      // TODO: refactor as a plugin like fastify.amis.getForZip(zip)?
      const incomeInfo = await fetchAMIsForZip(
        fastify.sqlite,
        request.query.zip,
      );
      if (!incomeInfo) {
        throw fastify.httpErrors.createError(
          404,
          t('errors', 'zip_code_doesnt_exist'),
          {
            field: 'zip',
          },
        );
      }
      if (!isCompleteIncomeInfo(incomeInfo)) {
        throw fastify.httpErrors.createError(
          404,
          t('errors', 'no_data_for_location'),
          { field: 'zip' },
        );
      }

      try {
        const result = calculateIncentives(incomeInfo, {
          ...request.query,
        });

        const pos_rebate_incentives = result.incentives.filter(
          i =>
            i.type === PaymentMethod.PosRebate ||
            i.type === PaymentMethod.PerformanceRebate,
        ) as IRAIncentive[];
        let tax_credit_incentives = result.incentives.filter(
          i => i.type === PaymentMethod.TaxCredit,
        ) as IRAIncentive[];

        // Website Calculator backwards compatiblity from v1 data:

        // 1.1) Overwrite solar tax credit amount with representative_amount:
        const solarTaxCredit = tax_credit_incentives.find(
          incentive => incentive.item === 'rooftop_solar_installation',
        );

        if (solarTaxCredit) {
          solarTaxCredit.amount.number = solarTaxCredit.amount.representative!;
          delete solarTaxCredit.amount.representative;

          // 1.2) Re-sort incentives per https://app.asana.com/0/0/1204275945510481/f
          // HACK: temporarily override the amount_type as dollars:
          solarTaxCredit.amount.type = AmountType.DollarAmount;
          tax_credit_incentives = _.orderBy(
            tax_credit_incentives,
            [i => i.amount.type, i => i.amount.number],
            ['desc', 'desc'],
          );

          // 1.3)
          // set the amount_type to what the calculator expects:
          solarTaxCredit.amount.type = 'solar' as AmountType;
        }

        const translated: WebsiteCalculatorResponse = {
          ...result,

          pos_savings: result.savings.pos_rebate,
          tax_savings: result.savings.tax_credit,
          performance_rebate_savings: result.savings.performance_rebate,

          // 2) Add annual savings from pregenerated model
          estimated_annual_savings:
            IRA_STATE_SAVINGS[incomeInfo.location.state_id]
              .estimated_savings_heat_pump_ev,

          // 3) Populate the expected English and Spanish strings
          pos_rebate_incentives: translateIncentives(pos_rebate_incentives),
          tax_credit_incentives: translateIncentives(tax_credit_incentives),
        };

        return reply.status(200).type('application/json').send(translated);
      } catch (error) {
        if (error instanceof InvalidInputError) {
          throw fastify.httpErrors.createError(400, error.message, {
            field: error.field,
          });
        } else {
          throw error;
        }
      }
    },
  );

  server.get(
    '/api/v0/incentives',
    { schema: IncentivesSchema },
    async (request, reply) => {
      const incentives = translateIncentives(IRA_INCENTIVES);
      return reply.status(200).type('application/json').send({ incentives });
    },
  );
}
