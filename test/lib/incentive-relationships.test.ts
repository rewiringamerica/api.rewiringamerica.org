import { test } from 'tap';
import { AuthorityType } from '../../src/data/authorities';
import { FilingStatus } from '../../src/data/tax_brackets';
import { OwnerStatus } from '../../src/data/types/owner-status';
import { buildRelationshipGraph } from '../../src/lib/incentive-relationship-calculation';
import { ResolvedLocation } from '../../src/lib/location';
import { calculateStateIncentives } from '../../src/lib/state-incentives-calculation';
import { incentiveRelationshipsContainCycle } from '../data/cycles';
import {
  TEST_INCENTIVE_RELATIONSHIPS,
  TEST_INCENTIVE_RELATIONSHIPS_2,
  TEST_INCENTIVE_RELATIONSHIPS_3,
  TEST_INVALID_INCENTIVE_RELATIONSHIPS,
  TEST_NESTED_INCENTIVE_RELATIONSHIPS,
} from '../mocks/state-incentive-relationships';
import {
  TEST_AUTHORITIES,
  TEST_INCENTIVES,
  TEST_PROGRAMS,
} from '../mocks/state-incentives';

const LOCATION: ResolvedLocation = {
  state: 'RI',
  zcta: '02903',
  geographies: [],
};

const AMIS = {
  computedAMI80: 89900,
  computedAMI150: 168600,
  evCreditEligible: false,
};

// This is a basic test to set up supplying test data to the calculator logic.
// This checks incentive eligibility with no relationship logic included.
test('basic test for supplying test incentive data to calculation logic', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Homeowner,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: false,
    },
    TEST_INCENTIVES,
    {},
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  // This user is eligible for all of the incentives.
  t.equal(data.stateIncentives.length, 6);
});

test('test calculation with no incentives', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Homeowner,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    [],
    TEST_INCENTIVE_RELATIONSHIPS,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  t.equal(data.stateIncentives.length, 0);
});

// This user is a renter. Based on this, they are eligible for incentives
// A, B, C, E, and F.
// However, eligibility for several incentives is affected by relationships:
// 1) Since A and E are mutually exclusive and A supersedes E, they are not
//    eligible for E after checking relationships.
// 2) Since D is a prerequisite for C and they are not eligible for D, they are
//    not eligible for C either.
// 3) C and F and mutually exclusive and C supersedes F, but since the user is
//    not eligible for C, they can still be eligible for F.
test('test incentive relationship logic', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Renter,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  // Check that the user is only eligible for A, B, and F.
  t.strictSame(
    data.stateIncentives.map(i => i.id),
    ['A', 'B', 'F'],
  );
});

// This user is a renter. Based on this, they are eligible for incentives
// A, B, C, E, and F.
// However, eligibility for several incentives is affected by relationships:
// 1) D is a prereq for C, so they are not eligible for C.
// 2) C is a prereq for B, so they are not eligible for B.
// 3) B is a prereq for A, so they are not eligible for A.
// 4) A supersedes E, so they are still eligible for E.
// 5) E supersedes F, so they are not eligible for F.
test('test more complex incentive relationship logic', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Renter,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS_2,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  // Check that the user is only eligible for E.
  t.strictSame(
    data.stateIncentives.map(i => i.id),
    ['E'],
  );
});

// This user is a renter. Based on this, they are eligible for incentives
// A, B, C, E, and F.
// However, eligibility for several incentives is affected by relationships:
// 1) Since E and C are mutually exclusive and E supersedes C, they are not
//    eligible for C after checking relationships.
// 2) Since C is a prerequisite for A and they are not eligible for C, they are
//    not eligible for A either.
// 3) A and B and mutually exclusive and A supersedes B, but since the user is
//    not eligible for A, they can still be eligible for B.
// 4) F is not affected by the relationships, so they are eligible for F.
test('test incentive relationship and combined max value logic', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Renter,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS_3,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  t.strictSame(
    data.stateIncentives.map(i => i.id),
    ['E', 'F', 'B'],
  );
});

// Same as above except for income.
// This user is a renter with an income of 140k. Based on this, they are
// eligible for incentives A, C, E, and F (their income is too high for B).
// However, eligibility for several incentives is affected by relationships:
// 1) Since E and C are mutually exclusive and E supersedes C, they are not
//    eligible for C after checking relationships.
// 2) Since C is a prerequisite for A and they are not eligible for C, they are
//    not eligible for A either.
// 3) A and B and mutually exclusive and A supersedes B, but the user is not
//    eligible for A. However, despite this, they cannot become eligible for B
//    because their income was too high.
// 4) F is not affected by the relationships, so they are eligible for F.
test('test incentive relationship and permanent ineligibility criteria', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Renter,
      household_income: 140000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS_3,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );

  t.ok(data);
  t.strictSame(
    data.stateIncentives.map(i => i.id),
    ['E', 'F'],
  );
});

// This user is a renter. Based on this, they are eligible for incentives
// A, B, C, E, and F.
// However, eligibility for several incentives is affected by relationships:
// 1) Since A requires either C or D and the user is eligible for C, they are
//    also eligible for A.
// 2) Since B requires BOTH C and D and the user is not eligible for D, they
//    are not eligible for B.
// 3) E requires either A and C or B and D. Since the user is eligible for both
//    A and C, they will remain eligible for E.
test('test nested incentive relationship logic', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Renter,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_NESTED_INCENTIVE_RELATIONSHIPS,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  const eligibleIds = data.stateIncentives.map(i => i.id).sort();
  t.strictSame(eligibleIds, ['A', 'C', 'E', 'F']);
});

// This user is eligible for incentives B, E, and F. These incentives are each
// worth $100 and belong to a group with a maximum value of $200, so the final
// savings value is $200.
test('test combined maximum savings logic', async t => {
  const data = calculateStateIncentives(
    LOCATION,
    {
      owner_status: OwnerStatus.Renter,
      household_income: 30000,
      tax_filing: FilingStatus.Single,
      household_size: 1,
      authority_types: [AuthorityType.Utility],
      utility: 'ri-pascoag-utility-district',
      include_beta_states: true,
    },
    TEST_INCENTIVES,
    TEST_INCENTIVE_RELATIONSHIPS_3,
    TEST_AUTHORITIES,
    TEST_PROGRAMS,
    AMIS,
  );
  t.ok(data);
  // Check that the user is eligible for B, E, and F.
  const eligibleIds = data.stateIncentives.map(i => i.id).sort();
  t.strictSame(eligibleIds, ['B', 'E', 'F']);
});

test('test incentive relationships contain no circular dependencies', async tap => {
  // Check that there are no circular dependencies in the relationships.
  let relationshipGraph = buildRelationshipGraph(TEST_INCENTIVE_RELATIONSHIPS);
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), false);
  relationshipGraph = buildRelationshipGraph(TEST_INCENTIVE_RELATIONSHIPS_2);
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), false);
  relationshipGraph = buildRelationshipGraph(TEST_INCENTIVE_RELATIONSHIPS_3);
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), false);
  relationshipGraph = buildRelationshipGraph(
    TEST_NESTED_INCENTIVE_RELATIONSHIPS,
  );
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), false);
});

test('test cycle detection in invalid incentive relationships', async tap => {
  // Check that the circular dependency in the invalid relationships is
  // detected.
  const relationshipGraph = buildRelationshipGraph(
    TEST_INVALID_INCENTIVE_RELATIONSHIPS,
  );
  tap.equal(incentiveRelationshipsContainCycle(relationshipGraph), true);
});
