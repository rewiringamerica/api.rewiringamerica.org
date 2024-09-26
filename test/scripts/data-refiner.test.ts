import _ from 'lodash';
import { test } from 'tap';
import { DataRefiner } from '../../scripts/lib/data-refiner';
import { AuthorityType } from '../../src/data/authorities';
import { GeoGroupsByState } from '../../src/data/geo_groups';
import { LowIncomeThresholdsMap } from '../../src/data/low_income_thresholds';
import { CollectedIncentive } from '../../src/data/state_incentives';
import { AmountType } from '../../src/data/types/amount';

test('correctly associates low-income thresholds with record', tap => {
  const thresholds: LowIncomeThresholdsMap = {
    CT: {
      'ct-low-income-program': {
        type: 'hhsize',
        incentives: ['CT-1'],
        source_url: 'foo.com',
        thresholds: {},
      },
    },
  };

  const refiner = new DataRefiner(thresholds);
  const input: CollectedIncentive = {
    id: 'CT-1',
    data_urls: [],
    authority_type: AuthorityType.State,
    authority_name: 'The Power Company',
    program_title: 'Bar',
    program_url: 'bar.com',
    items: ['other'],
    short_description: { en: 'An incentive' },
    status: '',
    payment_methods: [],
    rebate_value: '',
    amount: { type: AmountType.DollarAmount, number: 100 },
    owner_status: [],
    income_restrictions: 'Some free text about the CT low income program.',
  };

  // Normal case – association is made.
  const output = refiner.refineCollectedData('CT', input);
  tap.equal(output.low_income, 'ct-low-income-program');

  // Error case – if config references the ID, but the record
  // has no data in the free-text field.
  const noIncomeRestrictions = _.omit(input, 'income_restrictions');
  tap.throws(
    () => refiner.refineCollectedData('CT', noIncomeRestrictions),
    new Error('Incentive CT-1 has a low-income program configured'),
  );
  tap.end();
});

test('correctly associate geo groups with record', tap => {
  const geoGroups: GeoGroupsByState = {
    CT: {
      'ct-group-of-note': {
        incentives: ['CT-1'],
        counties: [],
      },
    },
  };

  const refiner = new DataRefiner(null, geoGroups);
  const input: CollectedIncentive = {
    id: 'CT-1',
    data_urls: [],
    authority_type: AuthorityType.State,
    authority_name: 'The Power Company',
    geo_eligibility: 'Some free text about the geo group',
    program_title: 'Bar',
    program_url: 'bar.com',
    items: ['other'],
    short_description: { en: 'An incentive' },
    status: '',
    payment_methods: [],
    rebate_value: '',
    amount: { type: AmountType.DollarAmount, number: 100 },
    owner_status: [],
  };

  // Normal case – association is made.
  const output = refiner.refineCollectedData('CT', input);
  tap.equal(output.eligible_geo_group, 'ct-group-of-note');

  // Error case – if config references the ID, but the record
  // has no data in the free-text field.
  const noGeoEligibility = _.omit(input, 'geo_eligibility');
  tap.throws(
    () => refiner.refineCollectedData('CT', noGeoEligibility),
    new Error('Incentive CT-1 has a geo group configured'),
  );
  tap.end();
});
