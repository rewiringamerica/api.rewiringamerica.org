import { test } from 'tap';
import { AuthoritiesByType, AuthorityType } from '../../src/data/authorities';
import { Programs } from '../../src/data/programs';
import { GeographyType, ResolvedLocation } from '../../src/lib/location';
import getProgramsForLocation from '../../src/lib/programs-for-location';
import { APIProgramsResponse } from '../../src/schemas/v1/programs';

const mockPrograms: Programs = {
  ny_cityProgram: {
    name: { en: 'en-name', es: 'es-name' },
    url: { en: 'en-url', es: 'es-url' },
    authority: 'mock-city-authority',
    authority_type: AuthorityType.City,
    items: ['other_heat_pump'],
  },
  ny_stateProgram: {
    name: { en: '' },
    url: { en: '' },
    authority: 'mock-state-authority',
    authority_type: AuthorityType.State,
    items: ['other_heat_pump'],
  },
  ny_countyProgram: {
    name: { en: '' },
    url: { en: '' },
    authority: 'mock-county-authority',
    authority_type: AuthorityType.County,
    items: ['other_heat_pump'],
  },
  ny_utilityProgram: {
    name: { en: '' },
    url: { en: '' },
    authority: 'mock-utility-authority',
    authority_type: AuthorityType.Utility,
    items: ['other_heat_pump'],
  },
  ny_gasUtilityProgram: {
    name: { en: '' },
    url: { en: '' },
    authority: 'mock-gas-utility-authority',
    authority_type: AuthorityType.GasUtility,
  },
};
const mockAuthorities: AuthoritiesByType = {
  state: {
    'mock-state-authority': {
      name: 'Test',
      geography_id: 1,
    },
  },
  city: {
    'mock-city-authority': {
      name: 'Test',
      geography_id: 2,
    },
  },
  county: {
    'mock-county-authority': {
      name: 'Test',
      geography_id: 3,
    },
  },
  utility: {
    'mock-utility-authority': {
      name: 'Test',
    },
  },
  gas_utility: {
    'mock-gas-utility-authority': {
      name: 'Test',
    },
  },
};

const location: ResolvedLocation = {
  state: 'NY',
  zcta: '12604',
  geographies: [
    {
      id: 1,
      type: GeographyType.State,
      name: 'Test',
      state: 'NY',
      county_fips: null,
      intersection_proportion: 1.0,
    },
    {
      id: 2,
      type: GeographyType.Custom,
      name: 'City',
      state: 'NY',
      county_fips: null,
      intersection_proportion: 1.0,
    },
    {
      id: 3,
      type: GeographyType.County,
      name: 'County',
      state: 'NY',
      county_fips: '00000',
      intersection_proportion: 1.0,
    },
  ],
};

test('get all programs for location', async t => {
  const request = {
    utility: 'mock-utility-authority',
    gas_utility: 'mock-gas-utility-authority',
    zip: '12604',
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 5);
  t.equal(Object.entries(resp.authorities).length, 5);
});

test('get all program with authority types', async t => {
  const authorityTypes = [
    AuthorityType.Utility,
    AuthorityType.State,
    AuthorityType.City,
    AuthorityType.County,
    AuthorityType.GasUtility,
  ];
  const request = {
    utility: 'mock-utility-authority',
    gas_utility: 'mock-gas-utility-authority',
    zip: '12604',
    authorityTypes,
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 5);
  t.equal(Object.entries(resp.authorities).length, 5);
});

test('get city programs for location', async t => {
  const request = {
    authority_types: [AuthorityType.City],
    zip: '12604',
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 1);
  t.equal(Object.entries(resp.authorities).length, 1);
  t.equal(resp.programs['ny_cityProgram'].authority_type, AuthorityType.City);
});

test('get state programs for location', async t => {
  const request = {
    authority_types: [AuthorityType.State],
    zip: '12604',
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 1);
  t.equal(Object.entries(resp.authorities).length, 1);
  t.equal(resp.programs['ny_stateProgram'].authority_type, AuthorityType.State);
});

test('get county programs for location', async t => {
  const request = {
    authority_types: [AuthorityType.County],
    zip: '12604',
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 1);
  t.equal(Object.entries(resp.authorities).length, 1);
  t.equal(
    resp.programs['ny_countyProgram'].authority_type,
    AuthorityType.County,
  );
});

test('get electric utility programs for location', async t => {
  const request = {
    zip: '12604',
    utility: 'mock-utility-authority',
    authority_types: [AuthorityType.Utility],
  };

  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 1);
  t.equal(Object.entries(resp.authorities).length, 1);
  t.equal(
    resp.programs['ny_utilityProgram'].authority_type,
    AuthorityType.Utility,
  );
});

test('get gas utility programs for location', async t => {
  const request = {
    zip: '12604',
    gas_utility: 'mock-gas-utility-authority',
    authority_types: [AuthorityType.GasUtility],
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(Object.entries(resp.programs).length, 1);
  t.equal(Object.entries(resp.authorities).length, 1);
  t.equal(
    resp.programs['ny_gasUtilityProgram'].authority_type,
    AuthorityType.GasUtility,
  );
});

test('returns translated strings', async t => {
  const request = {
    authority_types: [AuthorityType.City],
    zip: '12604',
    language: 'es' as const,
  };
  const resp: APIProgramsResponse = getProgramsForLocation(
    location,
    request,
    mockAuthorities,
    mockPrograms,
  );
  t.ok(resp);

  t.equal(resp.programs['ny_cityProgram'].url, 'es-url');
  t.equal(resp.programs['ny_cityProgram'].name, 'es-name');
});

test('fails when utility param missing', async t => {
  const request = {
    zip: '12604',
    authority_types: [AuthorityType.Utility],
    utility: undefined,
  };
  t.throws(() =>
    getProgramsForLocation(location, request, mockAuthorities, mockPrograms),
  );
});

test('fails when gas utility param missing', async t => {
  const request = {
    zip: '12604',
    authority_types: [AuthorityType.GasUtility],
    gas_utility: undefined,
  };
  t.throws(() =>
    getProgramsForLocation(location, request, mockAuthorities, mockPrograms),
  );
});
