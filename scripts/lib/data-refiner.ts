import _ from 'lodash';
import { GeoGroupsByState } from '../../src/data/geo_groups';
import { LowIncomeThresholdsMap } from '../../src/data/low_income_thresholds';
import {
  CollectedIncentive,
  FIELD_ORDER,
  LowIncomeAuthority,
  PASS_THROUGH_FIELDS,
  StateIncentive,
} from '../../src/data/state_incentives';
import {
  createAuthorityName,
  createProgramName,
} from './authority-and-program-updater';

type IncentiveToIdentifierMap = {
  [index: string]: string;
};

export class DataRefiner {
  private incentiveToLowIncomeThresholdMap: IncentiveToIdentifierMap | null;
  private incentiveToGeoGroupIdentifier: IncentiveToIdentifierMap | null;
  /**
   * @param lowIncomeThresholds: state-segmented income thresholds. If empty, the script won't try to associate records with low-income programs.
   * @param geoGroups: state-segmented geo groups. If empty, the script won't try to associate records with eligible geo groups.
   */
  constructor(
    lowIncomeThresholds: LowIncomeThresholdsMap | null = null,
    geoGroups: GeoGroupsByState | null = null,
  ) {
    this.incentiveToLowIncomeThresholdMap = lowIncomeThresholds
      ? computeIncentiveToIdentifierMap(lowIncomeThresholds)
      : null;
    this.incentiveToGeoGroupIdentifier = geoGroups
      ? computeIncentiveToIdentifierMap(geoGroups)
      : null;
  }

  // Take a collected data record, filter to a subset of fields, do some
  // additional processing/derivation, and return a refined record.
  // That record may still fail ajv schema validation later.
  refineCollectedData(
    state: string,
    record: CollectedIncentive,
  ): Partial<StateIncentive> {
    const authorityName = createAuthorityName(state, record.authority_name);
    // Pass-through fields are those in CollectedIncentive that appear in the
    // refined StateIncentive verbatim. Everything else needs some processing.
    const output: Partial<StateIncentive> = _.pick(record, PASS_THROUGH_FIELDS);
    output.authority = authorityName;
    output.program = createProgramName(
      state,
      record.authority_name,
      record.program_title,
    );
    output.short_description = {
      en: standardizeDescription(record.short_description.en),
    };
    if (record.short_description.es) {
      output.short_description.es = record.short_description.es;
    }
    if (record.bonus_description && record.bonus_description !== '') {
      output.bonus_available = true;
    }
    if (this.incentiveToLowIncomeThresholdMap) {
      const low_income_program =
        this.incentiveToLowIncomeThresholdMap[record.id];
      if (low_income_program) {
        if (!record.income_restrictions) {
          throw new Error(
            `Incentive ${record.id} has a low-income program configured in low_income_thresholds.json, but has no matching data in the spreadsheet. If the incentive has low-income eligibility restrictions, describe them (in free text) in the spreadsheet in the income_restrictions column. If it does not, remove that ID's configuration from low_income_thresholds.json.`,
          );
        }
        output.low_income = low_income_program as LowIncomeAuthority;
      } else if (isPlausibleLowIncomeRow(record)) {
        console.log(
          `Warning: no low-income thresholds found for ${record.id} despite references to income eligiblity in description or income restrictions columns. This may mean you're missing a configuration for that record in low_income_thresholds.json. If not, you can make this warning go away by deleting any value in this row's income_restrictions column in the spreadsheet.`,
        );
      }
    }
    if (this.incentiveToGeoGroupIdentifier) {
      const eligible_geo_group = this.incentiveToGeoGroupIdentifier[record.id];
      if (eligible_geo_group) {
        if (!record.geo_eligibility) {
          throw new Error(
            `Incentive ${record.id} has a geo group configured in geo_groups.json, but has no matching data in the spreadsheet. If the incentive has eligible geo_group, describe it (in free text) in the spreadsheet in the geo_eligibility column. If it does not, remove that ID's configuration from geo_groups.json.`,
          );
        }
        output.eligible_geo_group = eligible_geo_group;
      } else if (record.geo_eligibility) {
        console.log(
          `Warning: no geo group configured for ${record.id} despite the geo_eligibility column being populated in the spreadsheet. This may mean you're missing a configuration for that record in geo_groups.json. If not, you can make this warning go away by deleting any value in this row's geo_eligibility column in the spreadsheet.`,
        );
      }
    }

    // Enforce a specific property order on the output for better debugging.
    return Object.fromEntries(
      FIELD_ORDER.map((key: string) => [
        key,
        key in output ? output[key as keyof typeof output] : undefined,
      ]).filter(([, val]) => val !== undefined),
    );
  }
}

// Low-income thresholds and geo groups have the same structure:
// Keyed by state
// Sub-keyed by the threshold/geo group string identifier
// The sub-values contain a field called incentives that contains incentive IDs.
function computeIncentiveToIdentifierMap<
  T extends {
    [index: string]: { [index: string]: { incentives: string[] } };
  },
>(stateKeyedMap: T): IncentiveToIdentifierMap {
  const inverted: { [index: string]: string } = {};
  for (const stateData of Object.values(stateKeyedMap)) {
    for (const [identifier, data] of Object.entries(stateData)) {
      for (const incentive of data.incentives) {
        inverted[incentive] = identifier;
      }
    }
  }
  return inverted;
}

function standardizeDescription(desc: string): string {
  desc = desc.replaceAll('\n', ' ').trim();
  if (!desc.endsWith('.')) {
    desc = desc + '.';
  }
  return desc;
}

function isPlausibleLowIncomeRow(record: CollectedIncentive) {
  if (record.income_restrictions && record.income_restrictions !== '') {
    return true;
  }
  if (
    record.short_description?.en &&
    record.short_description.en.toLowerCase().includes('income')
  ) {
    return true;
  }
  return false;
}
