import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import { t } from '../lib/i18n.js';
import { IRA_INCENTIVES } from '../data/ira_incentives.js';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { API_CALCULATOR_SCHEMA } from '../schemas/v1/calculator-endpoint.js';
import { API_INCENTIVES_SCHEMA } from '../schemas/v1/incentives-endpoint.js';
import {
  APIIncentive,
  APIIncentiveMinusItemUrl,
} from '../schemas/v1/incentive.js';
import { APILocation } from '../schemas/v1/location.js';
import { LOCALES } from '../data/locale.js';
import { Database } from 'sqlite';
import { IncomeInfo } from '../lib/income-info.js';
import { API_UTILITIES_SCHEMA } from '../schemas/v1/utilities-endpoint.js';
import { AUTHORITIES_BY_STATE, AuthorityType } from '../data/authorities.js';

function transformIncentives(
  incentives: APIIncentiveMinusItemUrl[],
  language: keyof typeof LOCALES,
): APIIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,

    // Localize localizable fields
    item: t('items', incentive.item, language),
    program: t('programs', incentive.program, language),
    item_url: t('urls', incentive.item, language),
  }));
}

export default async function (
  fastify: FastifyInstance & { sqlite: Database },
) {
  async function fetchAMIsForLocation(
    location: APILocation,
  ): Promise<IncomeInfo | null> {
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

      try {
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
      } catch (error) {
        throw fastify.httpErrors.badRequest((error as Error).message);
      }
    },
  );

  server.get(
    '/api/v1/incentives',
    { schema: API_INCENTIVES_SCHEMA },
    async (request, reply) => {
      const incentives = transformIncentives(
        IRA_INCENTIVES.map(incentive => ({
          ...incentive,
          authority_type: AuthorityType.Federal,
          authority_name: null,
        })),
        request.query.language ?? 'en',
      );
      return reply.status(200).type('application/json').send({ incentives });
    },
  );

  //
  // This endpoint currently just returns all utilities in the state of the
  // given location. We could be smarter about it.
  //
  server.get(
    '/api/v1/utilities',
    { schema: API_UTILITIES_SCHEMA },
    async (request, reply) => {
      const stateId = (await fetchAMIsForLocation(request.query.location))
        ?.location?.state_id;

      if (!stateId) {
        throw fastify.httpErrors.createError(404, "Zip code doesn't exist.", {
          field: 'location',
        });
      }

      const authorities = AUTHORITIES_BY_STATE[stateId];
      if (!authorities) {
        throw fastify.httpErrors.createError(
          404,
          'We currently do not have coverage for that location.',
          { field: 'location' },
        );
      }

      reply.status(200).type('application/json').send(authorities.utility);
    },
  );
}
