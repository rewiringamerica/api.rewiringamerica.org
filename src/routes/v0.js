import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import { t } from '../lib/i18n.js';
import _ from 'lodash';
import { IRA_INCENTIVES } from '../data/ira_incentives.js';
import { IRA_STATE_SAVINGS } from '../data/ira_state_savings.js';

IRA_INCENTIVES.forEach(incentive => Object.freeze(incentive));

function translateIncentives(incentives) {
  return incentives.map(incentive => {
    let item = { ...incentive };
    item.item_es = t('items', incentive.item, 'es');
    item.item = t('items', incentive.item, 'en');
    item.program_es = t('programs', incentive.program, 'es');
    item.program = t('programs', incentive.program, 'en');
    // strip domain from v0 links:
    item.more_info_url_es = t('urls', incentive.item, 'es').replace(
      'https://www.rewiringamerica.org',
      '',
    );
    item.more_info_url = t('urls', incentive.item, 'en').replace(
      'https://www.rewiringamerica.org',
      '',
    );
    return item;
  });
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
};

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

export default async function (fastify) {
  fastify.get(
    '/api/v0/calculator',
    { schema: CalculatorSchema },
    async (request, reply) => {
      // TODO: refactor as a plugin like fastify.amis.getForZip(zip)?
      const amisForZip = await fetchAMIsForZip(
        fastify.sqlite,
        request.query.zip,
      );
      if (!amisForZip) {
        throw fastify.httpErrors.createError(404, "Zip code doesn't exist.", {
          field: 'zip',
        });
      }
      if (
        !amisForZip.location.state_id ||
        !amisForZip.ami ||
        !amisForZip.calculations
      ) {
        throw fastify.httpErrors.createError(
          404,
          "We currently don't have data for this location.",
          { field: 'zip' },
        );
      }

      const result = calculateIncentives(amisForZip, {
        ...request.query,
      });

      // Website Calculator backwards compatiblity from v1 data:

      // 1) Add nnnual savings from pregenerated model
      result.estimated_annual_savings =
        IRA_STATE_SAVINGS[
          amisForZip.location.state_id
        ].estimated_savings_heat_pump_ev;

      // 2.1) Overwrite solar_tax_credit amount with representative_amount:
      const solarTaxCredit = result.tax_credit_incentives.find(
        incentive => incentive.item_type === 'solar_tax_credit',
      );
      solarTaxCredit.amount = solarTaxCredit.representative_amount;
      solarTaxCredit.representative_amount = 0;

      // 2.2) Re-sort incentives per https://app.asana.com/0/0/1204275945510481/f
      // HACK: temporarily override the amount_type as dollars:
      solarTaxCredit.amount_type = 'dollar_amount';
      result.tax_credit_incentives = _.orderBy(
        result.tax_credit_incentives,
        ['amount_type', 'amount'],
        ['desc', 'desc'],
      );

      // 2.3)
      // set the amount_type to what the calculator would expect:
      solarTaxCredit.amount_type = 'solar';

      // 3) Populate the expected English and Spanish strings
      result.pos_rebate_incentives = translateIncentives(
        result.pos_rebate_incentives,
      );
      result.tax_credit_incentives = translateIncentives(
        result.tax_credit_incentives,
      );

      return reply.status(200).type('application/json').send(result);
    },
  );

  fastify.get(
    '/api/v0/incentives',
    { schema: IncentivesSchema },
    async (request, reply) => {
      const incentives = translateIncentives(IRA_INCENTIVES);
      return reply.status(200).type('application/json').send({ incentives });
    },
  );
}
