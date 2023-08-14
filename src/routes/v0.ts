import calculateIncentives from '../lib/incentives-calculation';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip';
import { t } from '../lib/i18n';
import _ from 'lodash';
import { IRA_INCENTIVES } from '../data/ira_incentives';
import { IRA_STATE_SAVINGS } from '../data/ira_state_savings';
import { InvalidInputError } from '../lib/error';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite';
import {
  WEBSITE_INCENTIVE_SCHEMA,
  WebsiteIncentive,
} from '../schemas/v0/incentive';
import { WEBSITE_CALCULATOR_REQUEST_SCHEMA } from '../schemas/v0/calculator-request';
import {
  WEBSITE_CALCULATOR_RESPONSE_SCHEMA,
  WebsiteCalculatorResponse,
} from '../schemas/v0/calculator-response';
import { APIIncentiveMinusItemUrl } from '../schemas/v1/incentive';
import { AuthorityType } from '../data/authorities';
import { isCompleteIncomeInfo } from '../lib/income-info';

IRA_INCENTIVES.forEach(incentive => Object.freeze(incentive));

function translateIncentives(
  incentives: APIIncentiveMinusItemUrl[],
): WebsiteIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,
    item_es: t('items', incentive.item, 'es'),
    item: t('items', incentive.item, 'en'),
    program_es: t('programs', incentive.program, 'es'),
    program: t('programs', incentive.program, 'en'),
    // strip domain from v0 links:
    more_info_url_es: t('urls', incentive.item, 'es').replace(
      'https://www.rewiringamerica.org',
      '',
    ),
    more_info_url: t('urls', incentive.item, 'en').replace(
      'https://www.rewiringamerica.org',
      '',
    ),

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
  querystring: {
    $ref: 'WebsiteCalculatorRequest',
  },
  response: {
    200: {
      description: 'Successful response',
      $ref: 'WebsiteCalculatorResponse',
    },
    400: {
      description: 'Bad request',
      $ref: 'Error',
    },
    404: {
      description: 'Resource not found',
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
        typeof WEBSITE_CALCULATOR_REQUEST_SCHEMA,
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
        throw fastify.httpErrors.createError(404, "Zip code doesn't exist.", {
          field: 'zip',
        });
      }
      if (!isCompleteIncomeInfo(incomeInfo)) {
        throw fastify.httpErrors.createError(
          404,
          "We currently don't have data for this location.",
          { field: 'zip' },
        );
      }

      try {
        const result = calculateIncentives(incomeInfo, {
          ...request.query,
        });

        const translated: WebsiteCalculatorResponse = {
          ...result,

          // Website Calculator backwards compatiblity from v1 data:

          // 1) Add annual savings from pregenerated model
          estimated_annual_savings:
            IRA_STATE_SAVINGS[incomeInfo.location.state_id]
              .estimated_savings_heat_pump_ev,

          // 2) Populate the expected English and Spanish strings
          pos_rebate_incentives: translateIncentives(
            result.pos_rebate_incentives,
          ),
          tax_credit_incentives: translateIncentives(
            result.tax_credit_incentives,
          ),
        };

        // 3.1) Overwrite solar_tax_credit amount with representative_amount:
        const solarTaxCredit = translated.tax_credit_incentives.find(
          incentive => incentive.item_type === 'solar_tax_credit',
        );

        if (solarTaxCredit) {
          solarTaxCredit.amount = solarTaxCredit.representative_amount!;
          solarTaxCredit.representative_amount = 0;

          // 3.2) Re-sort incentives per https://app.asana.com/0/0/1204275945510481/f
          // HACK: temporarily override the amount_type as dollars:
          solarTaxCredit.amount_type = 'dollar_amount';
          translated.tax_credit_incentives = _.orderBy(
            translated.tax_credit_incentives,
            [i => i.amount_type, i => i.amount],
            ['desc', 'desc'],
          );

          // 3.3)
          // set the amount_type to what the calculator would expect:
          solarTaxCredit.amount_type = 'solar';
        }

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
      const incentives = translateIncentives(
        IRA_INCENTIVES.map(incentive => ({
          ...incentive,
          authority_type: AuthorityType.Federal,
          authority_name: null,
        })),
      );
      return reply.status(200).type('application/json').send({ incentives });
    },
  );
}
