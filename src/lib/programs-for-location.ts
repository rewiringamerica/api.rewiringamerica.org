import {
  AUTHORITIES_BY_STATE,
  AuthoritiesById,
  AuthorityType,
} from '../data/authorities';
import { parseProgramJSON } from '../data/programs';
import {
  APIProgramsRequest,
  APIProgramsResponse,
} from '../schemas/v1/programs';
import { InvalidInputError } from './error';
import { tr } from './i18n';
import { ResolvedLocation } from './location';

export default function getProgramsForLocation(
  location: ResolvedLocation,
  request: APIProgramsRequest,
): APIProgramsResponse {
  const { utility, authority_types, language } = request;
  // Throw an error if the request specifically asks for utility programs and
  // doesn't include a utility.
  if (authority_types?.includes(AuthorityType.Utility) && !utility) {
    throw new InvalidInputError(
      'Must include the "utility" field when requesting utility programs.',
      'utility',
    );
  }

  // Default all to true if authority_types is undefined
  const includeCity = authority_types?.includes(AuthorityType.City) ?? true;
  const includeState = authority_types?.includes(AuthorityType.State) ?? true;
  const includeCounty = authority_types?.includes(AuthorityType.County) ?? true;
  const includeUtility =
    authority_types?.includes(AuthorityType.Utility) ?? true;

  const authorities = AUTHORITIES_BY_STATE[location.state];
  const programs = parseProgramJSON(location.state);
  const programsForLocation = Object.fromEntries(
    Object.entries(programs)
      // Filter programs based on authority_types request param, location, and utility
      .filter(([, program]) => {
        const authority_id = program.authority!;
        if (includeCity && program.authority_type === AuthorityType.City) {
          const authority = authorities.city![authority_id];
          return (
            authority.city === location.city &&
            authority.county_fips === location.county_fips
          );
        }
        if (includeCounty && program.authority_type === AuthorityType.County) {
          const authority = authorities.county![authority_id];
          return authority.county_fips === location.county_fips;
        }

        if (
          utility &&
          includeUtility &&
          program.authority_type === AuthorityType.Utility
        ) {
          return program.authority === utility;
        }

        return includeState && program.authority_type === AuthorityType.State;
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
