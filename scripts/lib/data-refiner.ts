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
  createAuthorityName,
  createProgramName,
} from './authority-and-program-updater';

export class DataRefiner {
  private lowIncomeThresholds: LowIncomeThresholdsMap | null;
  /**
   * @param lowIncomeThresholds: state-segmented income thresholds. If empty, the script won't try to associate records with low-income programs.
   */
  constructor(lowIncomeThresholds: LowIncomeThresholdsMap | null = null) {
    this.lowIncomeThresholds = lowIncomeThresholds;
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
    if (this.lowIncomeThresholds && isPlausibleLowIncomeRow(record)) {
      const low_income_program = this.retrieveLowIncomeProgram(
        authorityName,
        state,
      );
      if (low_income_program) {
        output.low_income = low_income_program;
      } else if (low_income_program === undefined) {
        // This is checked up front by the caller rather than
        // at the row level to avoid spamming error messages.
      } else {
        console.log(
          `Warning: no low-income thresholds found for ${record.id} despite references to income eligiblity in description or income restrictions columns. This either means: 1) manually set this field in the JSON to 'default' to use a state's default thresholds (must be defined), or 2) you need to define program-specific thresholds for it, or 3) it's not actually a low-income row and no action is necessary.`,
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

  retrieveLowIncomeProgram(
    authority: string,
    state: string,
  ): LowIncomeAuthority | undefined | null {
    if (this.lowIncomeThresholds![state] === undefined) {
      return undefined;
    }
    if (authority in this.lowIncomeThresholds![state]) {
      return authority as LowIncomeAuthority;
    } else {
      return null;
    }
  }
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
