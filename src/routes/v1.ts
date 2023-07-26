import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import { t } from '../lib/i18n.js';
import { IRA_INCENTIVES, Incentive } from '../data/ira_incentives.js';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { API_CALCULATOR_SCHEMA } from '../schemas/v1/calculator-endpoint.js';
import { API_INCENTIVES_SCHEMA } from '../schemas/v1/incentives-endpoint.js';
import { APIIncentive } from '../schemas/v1/incentive.js';
import { APILocation } from '../schemas/v1/location.js';
import { LOCALES } from '../data/locale.js';

function transformIncentives(
  incentives: Incentive[],
  language: keyof typeof LOCALES,
): APIIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,

    // Transform amount from separate fields into single object
    amount: {
      type: incentive.amount_type,
      number: incentive.amount,
      // If representative_amount is null, don't include it in output
      representative: incentive.representative_amount ?? undefined,
    },
    amount_type: undefined,
    representative_amount: undefined,

    // Localize localizable fields
    item: t('items', incentive.item, language),
    program: t('programs', incentive.program, language),
    item_url: t('urls', incentive.item, language),
  }));
}

export default async function (fastify: FastifyInstance & { sqlite: unknown }) {
  async function fetchAMIsForLocation(location: APILocation) {
    if (location.address) {
      // TODO: make sure bad addresses are handled here, and don't return anything
      return await fetchAMIsForAddress(fastify.sqlite, location.address);
    } else if (location.zip) {
      return await fetchAMIsForZip(fastify.sqlite, location.zip);
    } else {
      // NOTE: this should never happen, APICalculatorSchema should block it:
      throw new Error('location.address or location.zip required');
    }
  }

  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>();

  server.get(
    '/api/v1/calculator',
    { schema: API_CALCULATOR_SCHEMA },
    async (request, reply) => {
      const amis = await fetchAMIsForLocation(request.query.location);

      if (!amis) {
        throw fastify.httpErrors.notFound();
      }

      const result = calculateIncentives(amis, { ...request.query });
      const language = request.query.language ?? 'en';
      const translated = {
        ...result,
        tax_credit_incentives: transformIncentives(
          result.tax_credit_incentives,
          language,
        ),
        pos_rebate_incentives: transformIncentives(
          result.pos_rebate_incentives,
          language,
        ),
      };

      reply.status(200).type('application/json').send(translated);
    },
  );

  server.get(
    '/api/v1/incentives',
    { schema: API_INCENTIVES_SCHEMA },
    async (request, reply) => {
      const incentives = transformIncentives(
        IRA_INCENTIVES,
        request.query.language ?? 'en',
      );
      return reply.status(200).type('application/json').send({ incentives });
    },
  );
}
