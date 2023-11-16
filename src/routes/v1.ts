import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite';
import { LOCALES } from '../data/locale';
import { PROGRAMS } from '../data/programs';
import { InvalidInputError, UnexpectedInputError } from '../lib/error';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip';
import { t, tr } from '../lib/i18n';
import calculateIncentives, {
  CalculatedIncentive,
} from '../lib/incentives-calculation';
import { IncomeInfo, isCompleteIncomeInfo } from '../lib/income-info';
import { getUtilitiesForLocation } from '../lib/utilities-for-location';
import { ERROR_SCHEMA } from '../schemas/error';
import {
  API_CALCULATOR_REQUEST_SCHEMA,
  API_CALCULATOR_RESPONSE_SCHEMA,
  API_CALCULATOR_SCHEMA,
} from '../schemas/v1/calculator-endpoint';
import { APIIncentive, API_INCENTIVE_SCHEMA } from '../schemas/v1/incentive';
import { APIRequestLocation } from '../schemas/v1/location';
import { API_UTILITIES_SCHEMA } from '../schemas/v1/utilities-endpoint';

function transformIncentives(
  incentives: CalculatedIncentive[],
  language: keyof typeof LOCALES,
): APIIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,

    // Localize localizable fields
    item: {
      type: incentive.item,
      name: t('items', incentive.item, language),
      url: t('urls', incentive.item, language),
    },
    program: tr(PROGRAMS[incentive.program].name, language),
    program_url: PROGRAMS[incentive.program].url
      ? tr(PROGRAMS[incentive.program].url!, language)
      : undefined,
    short_description: tr(incentive.short_description, language),
  }));
}

export default async function (
  fastify: FastifyInstance & { sqlite: Database },
) {
  async function fetchAMIsForLocation(
    location: APIRequestLocation,
  ): Promise<IncomeInfo | null> {
    if (location.address) {
      // TODO: make sure bad addresses are handled here, and don't return anything
      return await fetchAMIsForAddress(fastify.sqlite, location.address);
    } else if (location.zip) {
      return await fetchAMIsForZip(fastify.sqlite, location.zip);
    } else {
      // NOTE: this should never happen, APICalculatorSchema should block it:
      throw new UnexpectedInputError(
        'location.address or location.zip required',
      );
    }
  }

  // Add any schemas that are referred to by $id
  const server = fastify.withTypeProvider<
    JsonSchemaToTsProvider<{
      references: [
        typeof ERROR_SCHEMA,
        typeof API_INCENTIVE_SCHEMA,
        typeof API_CALCULATOR_REQUEST_SCHEMA,
        typeof API_CALCULATOR_RESPONSE_SCHEMA,
      ];
    }>
  >();

  server.get(
    '/api/v1/calculator',
    { schema: API_CALCULATOR_SCHEMA },
    async (request, reply) => {
      const language = request.query.language ?? 'en';
      const incomeInfo = await fetchAMIsForLocation(request.query.location);

      if (!incomeInfo) {
        throw fastify.httpErrors.createError(
          404,
          t('errors', 'cannot_locate_address', language),
          { field: 'location' },
        );
      }

      if (!isCompleteIncomeInfo(incomeInfo)) {
        throw fastify.httpErrors.createError(
          404,
          t('errors', 'no_data_for_location', language),
          { field: 'location' },
        );
      }

      try {
        const result = calculateIncentives(incomeInfo, { ...request.query });
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
  // This endpoint currently just returns all utilities in the state of the
  // given location. We could be smarter about it.
  //
  server.get(
    '/api/v1/utilities',
    { schema: API_UTILITIES_SCHEMA },
    async (request, reply) => {
      const language = request.query.language ?? 'en';
      const location = (await fetchAMIsForLocation(request.query.location))
        ?.location;

      if (!location) {
        throw fastify.httpErrors.createError(
          404,
          t('errors', 'cannot_locate_address', language),
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
            location: { state: location.state_id },
            utilities: getUtilitiesForLocation(location),
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
}
