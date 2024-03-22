import * as prettier from 'prettier';
import { test } from 'tap';
import { Project, QuoteKind } from 'ts-morph';
import {
  AuthorityMap,
  AuthorityTypeMap,
  StateToAuthorityTypeMap,
  StateToGeoGroupMap,
  createProgramsContent,
  maybeUpdateProgramsTsFile,
  sortMapByKey,
  updateAuthorities,
  updateGeoGroups,
} from '../../scripts/lib/authority-and-program-updater';

const unorderedFixture: StateToAuthorityTypeMap = {
  CT: {
    state: {
      'ct-deep': {
        name: 'CT Department of Energy & Environmental Protection',
      },
    },
    utility: {
      'ct-eversource': {
        name: 'Eversource',
      },
      'ct-other-source': {
        name: 'Othersource',
      },
    },
  },
  AZ: {
    state: {},
    utility: {
      'az-mohave-electric-cooperative': {
        name: 'Mohave Electric Cooperative',
      },
      'az-salt-river-project': {
        name: 'Salt River Project',
      },
      'az-sulphur-springs-valley-electric-cooperative': {
        name: 'Sulphur Springs Valley Electric Cooperative',
      },
      'az-tucson-electric-power': {
        name: 'Tucson Electric Power',
      },
      'az-uni-source-energy-services': {
        name: 'UniSource Energy Services',
      },
    },
  },
  VA: {
    state: {},
    utility: {
      'va-appalachian-power': {
        name: 'Appalachian Power',
      },
      'va-dominion-energy': {
        name: 'Dominion Energy',
      },
    },
  },
};

const baseSourceFile = `import SomeClass from './some_file';
import CT_PROGRAMS from './programs/ct_programs';
import NY_PROGRAMS from './programs/ny_programs';
import OtherClass from './other_file';

const var = 'foo';

const all_programs = {
  ...ira_programs,
  ...CT_PROGRAMS,
  ...NY_PROGRAMS,
} as const;
`;

test('correctly sort state authority information by state', tap => {
  const ordered_json: StateToAuthorityTypeMap = {
    AZ: {
      state: {},
      utility: {
        'az-mohave-electric-cooperative': {
          name: 'Mohave Electric Cooperative',
        },
        'az-salt-river-project': {
          name: 'Salt River Project',
        },
        'az-sulphur-springs-valley-electric-cooperative': {
          name: 'Sulphur Springs Valley Electric Cooperative',
        },
        'az-tucson-electric-power': {
          name: 'Tucson Electric Power',
        },
        'az-uni-source-energy-services': {
          name: 'UniSource Energy Services',
        },
      },
    },
    CT: {
      state: {
        'ct-deep': {
          name: 'CT Department of Energy & Environmental Protection',
        },
      },
      utility: {
        'ct-eversource': {
          name: 'Eversource',
        },
        'ct-other-source': {
          name: 'Othersource',
        },
      },
    },
    VA: {
      state: {},
      utility: {
        'va-appalachian-power': {
          name: 'Appalachian Power',
        },
        'va-dominion-energy': {
          name: 'Dominion Energy',
        },
      },
    },
  };
  tap.matchOnly(ordered_json, sortMapByKey(unorderedFixture));
  tap.end();
});

test('replace existing state', tap => {
  const initial: AuthorityTypeMap = {
    state: {
      'ct-deep': {
        name: 'CT Department of Energy & Environmental Protection',
      },
    },
    city: {
      'ct-city': {
        name: 'City',
      },
      'ct-town': {
        name: 'Town',
      },
    },
    utility: {
      'ct-utility': {
        name: 'Utility',
      },
      'ct-other-utility': {
        name: 'Other utility',
      },
    },
  };
  const authorityMap: AuthorityMap = {
    // Same as before
    'ct-deep': {
      name: 'CT Department of Energy & Environmental Protection',
      authority_type: 'state',
      programs: {},
    },
    // Updated
    'ct-metropolis': {
      name: 'Metropolis',
      authority_type: 'city',
      programs: {},
    },
    // Utility has different name from existing
    'ct-utility': {
      name: 'New name for existing utility',
      authority_type: 'utility',
      programs: {},
    },
  };

  const expected: AuthorityTypeMap = {
    state: {
      'ct-deep': {
        name: 'CT Department of Energy & Environmental Protection',
      },
    },
    city: {
      'ct-metropolis': {
        name: 'Metropolis',
      },
    },
    utility: {
      // AuthorityMap had a different name for this, but original is kept
      'ct-utility': {
        name: 'Utility',
      },
      // This utility is still here even though it's not in authorityMap
      'ct-other-utility': {
        name: 'Other utility',
      },
    },
  };
  tap.matchOnly(updateAuthorities(initial, authorityMap), expected);
  tap.end();
});

test('error on utility not in authorities', tap => {
  const authorityMap: AuthorityMap = {
    'ct-new-utility': {
      name: 'New Utility',
      authority_type: 'utility',
      programs: {},
    },
  };

  tap.throws(
    () => updateAuthorities(unorderedFixture.CT, authorityMap),
    /Utility ct-new-utility is in spreadsheet but not in authorities/,
  );
  tap.end();
});

test('generate state program content', async tap => {
  const authorityMap: AuthorityMap = {
    'de-state': {
      name: 'Delaware State Energy',
      authority_type: 'state',
      programs: {
        de_delawareStateEnergy_foo: {
          url: 'foo.com',
          name: 'foo',
        },
        de_delawareStateEnergy_bar: {
          url: 'bar.com',
          name: 'bar',
        },
      },
    },
    'de-utility': {
      name: 'Delaware Utility',
      authority_type: 'utility',
      programs: {
        de_delawareUtility_baz: {
          url: 'baz.com',
          name: 'baz',
        },
        de_delawareUtility_qux: {
          url: 'qux.com',
          name: 'qux',
        },
      },
    },
  };

  const expected = `export const DE_PROGRAMS = {
  de_delawareStateEnergy_foo: {
    name: {
      en: 'foo',
    },
    url: {
      en: 'foo.com',
    },
  },
  de_delawareStateEnergy_bar: {
    name: {
      en: 'bar',
    },
    url: {
      en: 'bar.com',
    },
  },
  de_delawareUtility_baz: {
    name: {
      en: 'baz',
    },
    url: {
      en: 'baz.com',
    },
  },
  de_delawareUtility_qux: {
    name: {
      en: 'qux',
    },
    url: {
      en: 'qux.com',
    },
  },
} as const;
`;

  const filepath = 'src/data/programs/de_programs.ts';
  const formatOptions = await prettier.resolveConfig(filepath);
  if (!formatOptions) {
    tap.fail('No prettier options retrieved');
    return;
  }
  formatOptions.filepath = filepath;
  tap.matchOnly(
    await createProgramsContent('DE', authorityMap, formatOptions),
    expected,
  );
});

test('update .ts source file with first program', async tap => {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });
  const unusedPath = 'test/unused.ts';
  project.createSourceFile(unusedPath, baseSourceFile);

  const expected = `import SomeClass from './some_file';
import AZ_PROGRAMS from './programs/az_programs';
import CT_PROGRAMS from './programs/ct_programs';
import NY_PROGRAMS from './programs/ny_programs';
import OtherClass from './other_file';

const var = 'foo';

const all_programs = {
  ...ira_programs,
  ...AZ_PROGRAMS,
  ...CT_PROGRAMS,
  ...NY_PROGRAMS,
} as const;
`;

  maybeUpdateProgramsTsFile(
    'AZ',
    project.getSourceFileOrThrow(unusedPath),
    false,
  );

  tap.matchOnly(project.getSourceFileOrThrow(unusedPath).getText(), expected);
});

test('update .ts source file with middle program', async tap => {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });
  const unusedPath = 'test/unused.ts';
  project.createSourceFile(unusedPath, baseSourceFile);

  const expected = `import SomeClass from './some_file';
import CT_PROGRAMS from './programs/ct_programs';
import IL_PROGRAMS from './programs/il_programs';
import NY_PROGRAMS from './programs/ny_programs';
import OtherClass from './other_file';

const var = 'foo';

const all_programs = {
  ...ira_programs,
  ...CT_PROGRAMS,
  ...IL_PROGRAMS,
  ...NY_PROGRAMS,
} as const;
`;

  maybeUpdateProgramsTsFile(
    'IL',
    project.getSourceFileOrThrow(unusedPath),
    false,
  );

  tap.matchOnly(project.getSourceFileOrThrow(unusedPath).getText(), expected);
});

test('update .ts source file with final program', async tap => {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });
  const unusedPath = 'test/unused.ts';
  project.createSourceFile(unusedPath, baseSourceFile);

  const expected = `import SomeClass from './some_file';
import CT_PROGRAMS from './programs/ct_programs';
import NY_PROGRAMS from './programs/ny_programs';
import WA_PROGRAMS from './programs/wa_programs';
import OtherClass from './other_file';

const var = 'foo';

const all_programs = {
  ...ira_programs,
  ...CT_PROGRAMS,
  ...NY_PROGRAMS,
  ...WA_PROGRAMS,
} as const;
`;

  maybeUpdateProgramsTsFile(
    'WA',
    project.getSourceFileOrThrow(unusedPath),
    false,
  );

  tap.matchOnly(project.getSourceFileOrThrow(unusedPath).getText(), expected);
});

test('add geo groups for new state', async tap => {
  const original: StateToGeoGroupMap = {
    CO: {
      'co-group-something': {
        utilities: ['co-some-utility'],
        incentives: [],
      },
    },
  };
  const authorityMap: AuthorityMap = {
    // Should not be turned into a geo group
    'ca-state-auth': {
      name: 'State authority',
      authority_type: 'state',
      programs: {},
    },
    'ca-other-auth': {
      name: 'Other authority',
      authority_type: 'other',
      programs: {},
    },
  };

  tap.matchOnly(updateGeoGroups(original, 'CA', authorityMap), {
    CA: {
      'ca-group-other-auth': {
        utilities: [],
        cities: [],
        counties: [],
        incentives: [],
      },
    },
    CO: {
      'co-group-something': {
        utilities: ['co-some-utility'],
        incentives: [],
      },
    },
  });
});

test('add geo groups to existing state', async tap => {
  const original: StateToGeoGroupMap = {
    CO: {
      'co-group-something': {
        utilities: ['co-some-utility'],
        incentives: [],
      },
    },
  };
  const authorityMap: AuthorityMap = {
    // The existing group should not be modified
    'co-something': {
      name: 'Authority with existing group',
      authority_type: 'other',
      programs: {},
    },
    'co-other-auth': {
      name: 'Other authority',
      authority_type: 'other',
      programs: {},
    },
  };

  tap.matchOnly(updateGeoGroups(original, 'CO', authorityMap), {
    CO: {
      'co-group-other-auth': {
        utilities: [],
        cities: [],
        counties: [],
        incentives: [],
      },
      'co-group-something': {
        utilities: ['co-some-utility'],
        incentives: [],
      },
    },
  });
});
