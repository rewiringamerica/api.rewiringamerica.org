import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite';
import { LOCALES } from '../data/locale';
import { InvalidInputError, UnexpectedInputError } from '../lib/error';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip';
import { t } from '../lib/i18n';
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
    program: t('programs', incentive.program, language),
    program_url: t('program_urls', incentive.program, language),
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
      const incomeInfo = await fetchAMIsForLocation(request.query.location);

      if (!incomeInfo) {
        throw fastify.httpErrors.createError(
          404,
          'Cannot find location of this address.',
          { field: 'location' },
        );
      }

      if (!isCompleteIncomeInfo(incomeInfo)) {
        throw fastify.httpErrors.createError(
          404,
          "We currently don't have data for this location.",
          { field: 'location' },
        );
      }

      try {
        const result = calculateIncentives(incomeInfo, { ...request.query });
        const language = request.query.language ?? 'en';
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
      const location = (await fetchAMIsForLocation(request.query.location))
        ?.location;

      if (!location) {
        throw fastify.httpErrors.createError(404, "Zip code doesn't exist.", {
          field: 'location',
        });
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
