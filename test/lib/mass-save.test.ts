import { test } from 'tap';
import {
  AUTHORITIES_BY_STATE,
  AuthorityType,
  NO_GAS_UTILITY,
} from '../../src/data/authorities';
import { Program } from '../../src/data/types/program';
import {
  EXCEPTION_ELECTRIC_UTILITIES,
  isEligibleUnderMassSaveRule,
} from '../../src/lib/mass-save';

const MASS_SAVE_PROGRAM: Program = {
  authority_type: AuthorityType.Other,
  authority: 'ma-massSave',
  name: { en: '' },
  url: { en: '' },
};

const MLP_PROGRAM: Program = {
  authority_type: AuthorityType.Utility,
  authority: 'ma-some-muni',
  name: { en: '' },
  url: { en: '' },
};

const CASES = {
  msElectricGasUnknown: ['ma-eversource', undefined],
  msElectricNoGas: ['ma-eversource', NO_GAS_UTILITY],
  msElectricMuniGas: ['ma-eversource', 'ma-wakefield-gas-and-electric'],
  msElectricMsGas: ['ma-eversource', 'ma-national-grid-gas'],

  // An MLP that does NOT allow Mass Save customers to claim
  muniElectricGasUnknown: ['ma-town-of-wellesley', undefined],
  muniElectricNoGas: ['ma-town-of-wellesley', NO_GAS_UTILITY],
  muniElectricMuniGas: [
    'ma-town-of-wellesley',
    'ma-wakefield-gas-and-electric',
  ],
  muniElectricMsGas: ['ma-town-of-wellesley', 'ma-national-grid-gas'],

  // An MLP that DOES allow Mass Save customers to claim
  excElectricGasUnknown: ['ma-braintree-electric-light-department', undefined],
  excElectricNoGas: ['ma-braintree-electric-light-department', NO_GAS_UTILITY],
  excElectricMuniGas: [
    'ma-braintree-electric-light-department',
    'ma-wakefield-gas-and-electric',
  ],
  excElectricMsGas: [
    'ma-braintree-electric-light-department',
    'ma-national-grid-gas',
  ],

  electricUnknownGasUnknown: [undefined, undefined],
  electricUnknownNoGas: [undefined, NO_GAS_UTILITY],
  electricUnknownMuniGas: [undefined, 'ma-wakefield-gas-and-electric'],
  electricUnknownMsGas: [undefined, 'ma-national-grid-gas'],
} as const;

test('correct for mass save incentive', async t => {
  t.ok(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.msElectricGasUnknown,
    ),
  );
  t.ok(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.msElectricNoGas),
  );
  t.ok(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.msElectricMuniGas),
  );
  t.ok(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.msElectricMsGas),
  );

  // In this case we do NOT assume you have Mass Save via gas utility
  t.notOk(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.muniElectricGasUnknown,
    ),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.muniElectricNoGas),
  );
  t.ok(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.muniElectricMsGas),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.muniElectricMuniGas,
    ),
  );

  t.notOk(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.excElectricGasUnknown,
    ),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.excElectricNoGas),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.excElectricMuniGas),
  );
  t.ok(
    isEligibleUnderMassSaveRule(MASS_SAVE_PROGRAM, ...CASES.excElectricMsGas),
  );

  // If electric is unknown, only eligible if definitely on Mass Save gas
  t.notOk(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.electricUnknownGasUnknown,
    ),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.electricUnknownNoGas,
    ),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.electricUnknownMuniGas,
    ),
  );
  t.ok(
    isEligibleUnderMassSaveRule(
      MASS_SAVE_PROGRAM,
      ...CASES.electricUnknownMsGas,
    ),
  );
});

test('correct for non-MS utility incentive', async t => {
  t.notOk(
    isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.msElectricGasUnknown),
  );
  t.notOk(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.msElectricNoGas));
  t.notOk(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.msElectricMuniGas));
  t.notOk(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.msElectricMsGas));

  // In this case we conservatively assume you may have Mass Save via gas
  t.notOk(
    isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.muniElectricGasUnknown),
  );
  t.ok(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.muniElectricNoGas));
  t.notOk(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.muniElectricMsGas));
  t.ok(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.muniElectricMuniGas));

  // Even if the unknown gas utility is Mass Save, that's OK
  t.ok(
    isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.excElectricGasUnknown),
  );
  t.ok(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.excElectricNoGas));
  t.ok(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.excElectricMuniGas));
  t.ok(isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.excElectricMsGas));

  // All these are ineligible because your electric may be Mass Save
  t.notOk(
    isEligibleUnderMassSaveRule(
      MLP_PROGRAM,
      ...CASES.electricUnknownGasUnknown,
    ),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.electricUnknownNoGas),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.electricUnknownMuniGas),
  );
  t.notOk(
    isEligibleUnderMassSaveRule(MLP_PROGRAM, ...CASES.electricUnknownMsGas),
  );
});

test('all hardcoded authorities are real', async t => {
  for (const auth of EXCEPTION_ELECTRIC_UTILITIES) {
    t.ok(
      auth in AUTHORITIES_BY_STATE['MA'].utility,
      `${auth} not in MA utilities`,
    );
  }
});
