import {
  AuthoritiesById,
  AuthoritiesByType,
  AuthorityType,
  NO_GAS_UTILITY,
} from '../data/authorities';
import { Programs } from '../data/programs';
import {
  APIProgramsRequest,
  APIProgramsResponse,
} from '../schemas/v1/programs';
import { InvalidInputError } from './error';
import { tr } from './i18n';
import { ResolvedLocation } from './location';

function validateRequestParams(
  state_id: string,
  request: APIProgramsRequest,
  authorities: AuthoritiesByType,
) {
  const { utility, authority_types, gas_utility } = request;

  if (authority_types?.includes(AuthorityType.Utility) && !utility) {
    throw new InvalidInputError(
      'Must include the "utility" field when requesting utility programs.',
      'utility',
    );
  }

  if (
    authority_types &&
    authority_types.includes(AuthorityType.GasUtility) &&
    (!gas_utility || gas_utility === NO_GAS_UTILITY)
  ) {
    throw new InvalidInputError(
      `Must include the "gas_utility" field, with a value other than \
"${NO_GAS_UTILITY}", when requesting gas utility incentives.`,
      'gas_utility',
    );
  }

  if (utility) {
    if (!authorities) {
      throw new InvalidInputError(
        `We do not yet have information about the utilities in ${state_id}.`,
        'utility',
      );
    }

    if (!authorities.utility[utility]) {
      throw new InvalidInputError(`Invalid utility: "${utility}".`, 'utility');
    }
  }

  if (gas_utility && gas_utility !== NO_GAS_UTILITY) {
    if (!authorities.gas_utility) {
      throw new InvalidInputError(
        `We do not yet have information about gas utilities in ${state_id}.`,
        'gas_utility',
      );
    }
    if (!authorities.gas_utility[gas_utility]) {
      throw new InvalidInputError(
        `Invalid gas utility: "${gas_utility}.`,
        'gas_utility',
      );
    }
  }
}

export default function getProgramsForLocation(
  location: ResolvedLocation,
  request: APIProgramsRequest,
  authorities: AuthoritiesByType,
  programs: Programs,
): APIProgramsResponse {
  validateRequestParams(location.state, request, authorities);
  const { utility, gas_utility, authority_types, language } = request;

  // Default all to true if authority_types is undefined
  const includeCity = authority_types?.includes(AuthorityType.City) ?? true;
  const includeState = authority_types?.includes(AuthorityType.State) ?? true;
  const includeCounty = authority_types?.includes(AuthorityType.County) ?? true;
  const includeUtility =
    authority_types?.includes(AuthorityType.Utility) ?? true;
  const includeGasUtility =
    authority_types?.includes(AuthorityType.GasUtility) ?? true;

  const programsForLocation = Object.fromEntries(
    Object.entries(programs)
      // Filter programs based on authority_types request param, location, and utility
      .filter(([, program]) => {
        if (
          (!includeState && program.authority_type === AuthorityType.State) ||
          (!includeCity && program.authority_type === AuthorityType.City) ||
          (!includeCounty && program.authority_type === AuthorityType.County) ||
          (!includeUtility &&
            program.authority_type === AuthorityType.Utility) ||
          (!includeGasUtility &&
            program.authority_type === AuthorityType.GasUtility)
        ) {
          return false;
        }

        if (utility && program.authority_type === AuthorityType.Utility) {
          return program.authority === utility;
        }

        if (
          gas_utility &&
          program.authority_type === AuthorityType.GasUtility
        ) {
          return program.authority === gas_utility;
        }

        const authority =
          authorities[program.authority_type][program.authority!];

        // This excludes programs from authorities that don't have a geography.
        if (
          authority.geography_id &&
          location.geographies.some(geo => geo.id === authority.geography_id)
        ) {
          return true;
        }

        return false;
      })
      // Transform programs to match schema
      .map(([key, program]) => {
        const name = tr(program.name, language);
        const url = tr(program.url, language);
        const authority = program.authority ?? undefined;
        return [
          key,
          { ...program, name, url, authority },
        ];
      }),
  );

  // Get collection of associated authorities
  const programAuthorities: AuthoritiesById = {};
  Object.values(programsForLocation).forEach(program => {
    if (
      !program.authority ||
      program.authority_type === AuthorityType.Federal
    ) {
      return;
    }
    programAuthorities[program.authority] =
      authorities[program.authority_type]![program.authority];
  });

  const coverage = {
    state: location.state,
    utility: utility ?? null,
  };

  return {
    authorities: programAuthorities,
    coverage,
    location,
    programs: programsForLocation,
  };
}
