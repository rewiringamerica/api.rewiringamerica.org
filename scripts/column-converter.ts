export const FIELD_MAPPINGS: { [index: string]: string[] } = {
  id: ['ID'],
  data_urls: ['Data Source URL(s)'],
  authority_level: ['Authority Level *'],
  authority_name: ['Authority (Name) *'],
  program_title: ['Program Title *'],
  program_url: ['Program URL'],
  technology: ['Technology *'],
  technology_if_selected_other: ["Technology (If selected 'Other')"],
  program_description: ['Program Description (guideline)'],
  program_status: ['Program Status'],
  program_start: ['Program Start', 'Program Start (mm/dd/yyyy)'],
  program_end: ['Program End', 'Program End (mm/dd/yyyy)'],
  rebate_type: ['Rebate Type'],
  rebate_value: ['Rebate Value *'],
  amount_type: ['Amount Type *'],
  number: ['Number *'],
  unit: ['Unit'],
  amount_minimum: ['Amount Minimum'],
  amount_maximum: ['Amount Maximum'],
  amount_representative: ['Amount Representative (only for average values)'],
  bonus_description: ['Bonus Description'],
  equipment_standards_restrictions: ['Equipment Standards Restrictions'],
  equipment_capacity_restrictions: ['Equipment Capacity Restrictions'],
  contractor_restrictions: ['Contractor Restrictions'],
  income_restrictions: ['Income Restrictions'],
  tax_filing_status_restrictions: ['Tax - filing Status Restrictions'],
  owner_status: ['Homeowner / Renter'],
  other_restrictions: ['Other Restrictions'],
  stacking_details: ['Stacking Details'],
  financing_details: ['Financing Details'],
};

const wordSeparators =
  /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]+/;

function cleanFieldName(field: string): string {
  return field
    .replace('\n', '')
    .replace('*', '')
    .replace(wordSeparators, '')
    .trim()
    .toLowerCase();
}

function reverseMap(map: { [index: string]: string[] }): {
  [index: string]: string;
} {
  const reversed: { [index: string]: string } = {};
  for (const [fieldName, aliases] of Object.entries(map)) {
    for (const alias of aliases) {
      const cleaned = cleanFieldName(alias);
      if (cleaned in reversed) {
        throw new Error(
          `Duplicate column name found: ${cleaned}; original: ${alias}. This just means you've added a redundant value to the field mappings and this can probably be removed.`,
        );
      }
      reversed[cleaned] = fieldName;
    }
  }
  return reversed;
}

interface StringMap {
  [index: string]: string;
}

interface StringArrayMap {
  [index: string]: string[];
}

export class ColumnConverter {
  private reverseMap: StringMap;
  private strict: boolean;

  constructor(map: StringArrayMap = FIELD_MAPPINGS, strict: boolean = true) {
    this.reverseMap = reverseMap(map);
    this.strict = strict;
  }

  convertFieldNames(input: Record<string, string>): Record<string, string> {
    const output: Record<string, string> = {};
    for (const key in input) {
      const cleaned = cleanFieldName(key);
      if (this.reverseMap[cleaned] === undefined) {
        if (this.strict) {
          throw new Error(`Invalid column found: ${cleaned}; original: ${key}`);
        }
        output[key] = input[key];
        continue;
      }

      const newCol = this.reverseMap[cleaned];
      output[newCol] = input[key];
    }
    return output;
  }
}
