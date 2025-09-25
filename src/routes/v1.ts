import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { Database } from 'better-sqlite3';
import { FastifyInstance } from 'fastify';
import { AUTHORITIES_BY_STATE } from '../data/authorities';
import { parseLoanProgramJSON } from '../data/loan_programs';
import { LOCALES } from '../data/locale';
import { parseProgramJSON, PROGRAMS } from '../data/programs';
import { StateIncentive } from '../data/state_incentives';
import { computeAMIAndEVCreditEligibility } from '../lib/ami-evcredit-calculation';
import { InvalidInputError } from '../lib/error';
import { t, tr } from '../lib/i18n';
import calculateIncentives from '../lib/incentives-calculation';
import getLoanProgramsForLocation from '../lib/loan-programs-for-location';
import { resolveLocation } from '../lib/location';
import getProgramsForLocation from '../lib/programs-for-location';
import { statesWithStatus } from '../lib/states';
import {
  canGasUtilityAffectEligibility,
  getElectricUtilitiesForLocation,
  getGasUtilitiesForLocation,
} from '../lib/utilities-for-location';
import { ERROR_SCHEMA } from '../schemas/error';
import {
  API_CALCULATOR_RESPONSE_SCHEMA,
  API_CALCULATOR_SCHEMA,
} from '../schemas/v1/calculator-endpoint';
import { API_INCENTIVE_SCHEMA, APIIncentive } from '../schemas/v1/incentive';
import {
  API_LOAN_PROGRAMS_ENDPOINT_SCHEMA,
  API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
  APILoanProgramsResponse,
} from '../schemas/v1/loan-programs';
import {
  API_PROGRAMS_REQUEST_SCHEMA,
  API_PROGRAMS_RESPONSE_SCHEMA,
  APIProgramsResponse,
} from '../schemas/v1/programs';
import { API_STATES_SCHEMA } from '../schemas/v1/states-endpoint';
import { API_UTILITIES_SCHEMA } from '../schemas/v1/utilities-endpoint';

function transformIncentives(
  incentives: StateIncentive[],
  language: keyof typeof LOCALES,
): APIIncentive[] {
  return incentives.map(incentive => ({
    ...incentive,

    // Transfer authority fields from program
    authority: PROGRAMS[incentive.program].authority ?? undefined,
    authority_type: PROGRAMS[incentive.program].authority_type,

    // Localize localizable fields
    program: tr(PROGRAMS[incentive.program].name, language),
    program_url: tr(incentive.url, language),
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
        typeof API_PROGRAMS_RESPONSE_SCHEMA,
        typeof API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
      ];
    }>
  >();

  server.get(
    '/api/v1/calculator',
    { schema: API_CALCULATOR_SCHEMA },
    async (request, reply) => {
      try {
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

        const amiAndEvCreditEligibility =
          await computeAMIAndEVCreditEligibility(
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
      try {
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

        const gas_utilities = await getGasUtilitiesForLocation(
          fastify.sqlite,
          location,
        );
        const gas_utility_affects_incentives = gas_utilities
          ? canGasUtilityAffectEligibility(location)
          : undefined;

        reply
          .status(200)
          .type('application/json')
          .send({
            location,
            utilities: await getElectricUtilitiesForLocation(
              fastify.sqlite,
              location,
            ),
            gas_utilities,
            gas_utility_affects_incentives,
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

  server.get(
    '/api/v1/incentives/programs',
    { schema: API_PROGRAMS_REQUEST_SCHEMA },
    async (request, reply) => {
      try {
        const location = await resolveLocation(fastify.sqlite, request.query);
        const language = request.query.language ?? 'en';

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
        const programs = parseProgramJSON(location.state);
        const payload: APIProgramsResponse = getProgramsForLocation(
          location,
          request.query,
          AUTHORITIES_BY_STATE[location.state],
          programs,
        );
        reply.status(200).type('application/json').send(payload);
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

  // Return a list of available Loan Programs.
  server.get(
    '/api/v1/finance/loan-programs',
    { schema: API_LOAN_PROGRAMS_ENDPOINT_SCHEMA },
    async (request, reply) => {
      const location = await resolveLocation(fastify.sqlite, request.query);
      const language = request.query.language ?? 'en';
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
        const loanPrograms = parseLoanProgramJSON();
        const payload: APILoanProgramsResponse = getLoanProgramsForLocation(
          location,
          loanPrograms,
        );

        reply.status(200).type('application/json').send(payload);
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
