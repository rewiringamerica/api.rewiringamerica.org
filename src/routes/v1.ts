import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite';
import { LOCALES } from '../data/locale';
import { PROGRAMS, Programs } from '../data/programs';
import { computeAMIAndEVCreditEligibility } from '../lib/ami-evcredit-calculation';
import { InvalidInputError } from '../lib/error';
import { t, tr } from '../lib/i18n';
import calculateIncentives, {
  CalculatedIncentive,
} from '../lib/incentives-calculation';
import { resolveLocation } from '../lib/location';
import { statesWithStatus } from '../lib/states';
import { getUtilitiesForLocation } from '../lib/utilities-for-location';
import { ERROR_SCHEMA } from '../schemas/error';
import {
  API_CALCULATOR_RESPONSE_SCHEMA,
  API_CALCULATOR_SCHEMA,
} from '../schemas/v1/calculator-endpoint';
import { APIIncentive, API_INCENTIVE_SCHEMA } from '../schemas/v1/incentive';
import { API_STATES_SCHEMA } from '../schemas/v1/states-endpoint';
import { API_UTILITIES_SCHEMA } from '../schemas/v1/utilities-endpoint';

function transformIncentives(
  incentives: CalculatedIncentive[],
  language: keyof typeof LOCALES,
): APIIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,

    // Synthesize multi-valued items field
    items: [incentive.item],

    // Localize localizable fields
    item: {
      type: incentive.item,
      name: t('items', incentive.item, language),
    },
    program: tr(PROGRAMS[incentive.program as keyof Programs].name, language),
    program_url: tr(
      PROGRAMS[incentive.program as keyof Programs].url,
      language,
    ),
    more_info_url: incentive.more_info_url
      ? tr(incentive.more_info_url, language)
      : undefined,
    short_description: tr(incentive.short_description, language),
  }));
}

export default async function (
  fastify: FastifyInstance & { sqlite: Database },
) {
  // Add any schemas that are referred to by $id
  const server = fastify.withTypeProvider<
    JsonSchemaToTsProvider<{
      references: [
        typeof ERROR_SCHEMA,
        typeof API_INCENTIVE_SCHEMA,
        typeof API_CALCULATOR_RESPONSE_SCHEMA,
      ];
    }>
  >();

  server.get(
    '/api/v1/calculator',
    { schema: API_CALCULATOR_SCHEMA },
    async (request, reply) => {
      const language = request.query.language ?? 'en';
      const location = await resolveLocation(fastify.sqlite, request.query);

      if (!location) {
        throw fastify.httpErrors.createError(
          404,
          request.query.zip
            ? t('errors', 'zip_code_doesnt_exist', language)
            : t('errors', 'cannot_locate_address', language),
          { field: 'location' },
        );
      }

      const amiAndEvCreditEligibility = await computeAMIAndEVCreditEligibility(
        fastify.sqlite,
        location,
        request.query.household_size,
      );
      if (!amiAndEvCreditEligibility) {
        throw fastify.httpErrors.createError(
          404,
          t('errors', 'no_data_for_location', language),
          { field: 'location' },
        );
      }

      try {
        const result = calculateIncentives(
          location,
          amiAndEvCreditEligibility,
          { ...request.query },
        );
        const translated = {
          ...result,
          incentives: transformIncentives(result.incentives, language),
        };

        reply.status(200).type('application/json').send(translated);
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

  //
  // Returns the utilities that might serve the given location.
  //
  server.get(
    '/api/v1/utilities',
    { schema: API_UTILITIES_SCHEMA },
    async (request, reply) => {
      const language = request.query.language ?? 'en';
      const location = await resolveLocation(fastify.sqlite, request.query);

      if (!location) {
        throw fastify.httpErrors.createError(
          404,
          request.query.zip
            ? t('errors', 'zip_code_doesnt_exist', language)
            : t('errors', 'cannot_locate_address', language),
          {
            field: 'location',
          },
        );
      }

      try {
        reply
          .status(200)
          .type('application/json')
          .send({
            location: { state: location.state },
            utilities: await getUtilitiesForLocation(fastify.sqlite, location),
          });
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

  //
  // Returns a list of states and DC with their status.
  //
  server.get(
    '/api/v1/states',
    { schema: API_STATES_SCHEMA },
    async (request, reply) => {
      reply.status(200).type('application/json').send(statesWithStatus);
    },
  );
}
