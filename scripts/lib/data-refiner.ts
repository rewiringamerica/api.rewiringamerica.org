import _ from 'lodash';
import { LowIncomeThresholdsMap } from '../../src/data/low_income_thresholds';
import {
  CollectedIncentive,
  FIELD_ORDER,
  LowIncomeAuthority,
  PASS_THROUGH_FIELDS,
  StateIncentive,
} from '../../src/data/state_incentives';
import {
  authorityNameToGroupName,
  createAuthorityName,
  createProgramName,
} from './authority-and-program-updater';

type IncentiveToLowIncomeThresholdMap = {
  [index: string]: string;
};

export class DataRefiner {
  private incentiveToLowIncomeThresholdMap: IncentiveToLowIncomeThresholdMap | null;
  /**
   * @param lowIncomeThresholds: state-segmented income thresholds. If empty, the script won't try to associate records with low-income programs.
   */
  constructor(lowIncomeThresholds: LowIncomeThresholdsMap | null = null) {
    this.incentiveToLowIncomeThresholdMap = lowIncomeThresholds
      ? computeIncentiveToLowIncomeThresholdMap(lowIncomeThresholds)
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
    if (record.program_start_raw && record.program_start_raw !== '') {
      output.start_date = +parseDateToYear(record.program_start_raw);
    }
    if (record.program_end_raw && record.program_end_raw !== '') {
      output.end_date = +parseDateToYear(record.program_end_raw);
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
    if (record.authority_type === 'other') {
      // During initial data collection, the "Geographic Eligibility" column
      // will be filled in with free text. After misc state data is generated,
      // which adds entries to geo_groups.json, translate the free text into
      // structured representation in geo_groups.json, and replace the
      // "Geographic Eligibility" free text with the ID of the geo group.
      //
      // If the column doesn't contain a plausible geo group ID, derive the
      // geo group ID from the authority name (the common case).
      output.eligible_geo_group = isPlausibleGeoGroup(record.geo_eligibility)
        ? record.geo_eligibility
        : authorityNameToGroupName(output.authority);
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

function computeIncentiveToLowIncomeThresholdMap(
  thresholds: LowIncomeThresholdsMap,
): IncentiveToLowIncomeThresholdMap {
  const inverted: IncentiveToLowIncomeThresholdMap = {};
  for (const stateThreshold of Object.values(thresholds)) {
    for (const [identifier, threshold] of Object.entries(stateThreshold)) {
      for (const incentive of threshold.incentives) {
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

/** An ID-like string that includes "-group-", like "nv-group-some-counties". */
function isPlausibleGeoGroup(geo_eligibility: string | undefined) {
  return (
    !!geo_eligibility &&
    !geo_eligibility.includes(' ') &&
    geo_eligibility.includes('-group-')
  );
}

function parseDateToYear(input: string): string {
  if (input.length === 4) return input;
  let sep;
  if (input.indexOf('/') !== -1) {
    sep = '/';
  } else if (input.indexOf('-') !== -1) {
    sep = '-';
  } else {
    return input;
  }

  if (input.indexOf(sep) === 4) return input.substring(0, 4);
  if (input.length - input.lastIndexOf(sep) === 5) {
    return input.substring(input.lastIndexOf(sep) + 1, input.length);
  }
  return input;
}
