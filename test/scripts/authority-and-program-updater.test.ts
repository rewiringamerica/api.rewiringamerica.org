import { test } from 'tap';
import {
  AuthorityMap,
  sortJsonAlphabeticallyByStateKey,
  StateToAuthorityTypeMap,
  updateAuthorities,
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
  tap.matchOnly(
    ordered_json,
    sortJsonAlphabeticallyByStateKey(unorderedFixture),
  );
  tap.end();
});

test('replace existing state', tap => {
  const initial: StateToAuthorityTypeMap = {
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
  };
  const authorityMap: AuthorityMap = {
    // Same as before
    'ct-deep': {
      name: 'CT Department of Energy & Environmental Protection',
      authority_type: 'state',
      programs: {},
    },
    // Updated
    'ct-new-utility': {
      name: 'New Utilities Inc',
      authority_type: 'utility',
      programs: {},
    },
  };

  const expected: StateToAuthorityTypeMap = {
    CT: {
      state: {
        'ct-deep': {
          name: 'CT Department of Energy & Environmental Protection',
        },
      },
      utility: {
        'ct-new-utility': {
          name: 'New Utilities Inc',
        },
      },
    },
  };
  tap.matchOnly(expected, updateAuthorities(initial, 'CT', authorityMap));
  tap.end();
});

test('add and alpha-sort new state', tap => {
  const authorityMap: AuthorityMap = {
    // Same as before
    'de-state': {
      name: 'Delaware State Energy',
      authority_type: 'state',
      programs: {},
    },
    // Updated
    'de-utility': {
      name: 'Delaware Utility',
      authority_type: 'utility',
      programs: {},
    },
  };

  const expected: StateToAuthorityTypeMap = {
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
    DE: {
      state: {
        'de-state': {
          name: 'Delaware State Energy',
        },
      },
      utility: {
        'de-utility': {
          name: 'Delaware Utility',
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
  tap.matchOnly(
    expected,
    updateAuthorities(unorderedFixture, 'DE', authorityMap),
  );
  tap.end();
});
