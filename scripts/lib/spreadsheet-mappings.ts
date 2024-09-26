import { CollectedIncentive } from '../../src/data/state_incentives';

// From canonical column name to a list of possible aliases.
export type AliasMap = { [index: string]: string[] };
// From alias back to canonical.
export type FlatAliasMap = { [index: string]: string };

// This type lists all keys or sub-keys within a nested object.
// Rough translation: look through object keys;
// if the value is an object (and not an array), keep going recursively;
// otherwise terminate with the key.
type NestedKeyOf<O extends object> = {
  [Key in keyof O & (string | number)]: O[Key] extends object
    ? O[Key] /* eslint-disable @typescript-eslint/no-explicit-any */ extends Array<any>
      ? /* eslint-enable @typescript-eslint/no-explicit-any */
        `${Key}`
      : `${Key}.${NestedKeyOf<O[Key]>}`
    : `${Key}`;
}[keyof O & (string | number)];

export type FieldMetadata = {
  // The first column alias is special: when we export to spreadsheet, that is
  // the column name that is used.
  column_aliases: string[];
  description: string;
  // To provide aliases for enum values and generate explanations.
  // We might be able to constrain the values below with some more type magic.
  values?: {
    [index: string]: { value_aliases: string[]; description?: string };
  };
  // critical doesn't seem to be used in a meaningful way. Maintaining it for
  // now, but retire if it isn't used by Q3 2024.
  critical?: boolean;
};

export const FIELD_METADATA: Record<
  NestedKeyOf<CollectedIncentive>,
  FieldMetadata
> = {
  id: {
    column_aliases: ['ID', 'ID (StateAbv-number. eg., NY-1)'],
    description: 'Auto generated unique identifier for the incentive',
  },
  data_urls: {
    column_aliases: ['Data Source URL(s)'],
    description:
      'All source URL(s) to pages/pdfs/websites from where the data is being pulled from. This can also be referred to as the source url of the data entered in this row/source url that you used to get the information from.',
    critical: true,
  },
  authority_type: {
    column_aliases: ['Authority Level *'],
    description:
      'The level of the authority administering the incentive program to the consumer (usually state, utility, federal, muni)',
    critical: true,
    values: {
      federal: { value_aliases: ['Federal'] },
      state: {
        value_aliases: ['State'],
        description: 'Typically a government entity',
      },
      utility: {
        value_aliases: ['Utility'],
        description:
          'The utility service provider (electricity provider etc) that is not necessarily a government entity',
      },
      county: { value_aliases: ['County'] },
      city: { value_aliases: ['City'] },
      other: { value_aliases: ['Other'] },
    },
  },
  authority_name: {
    column_aliases: ['Authority (Name) *'],
    description:
      'Name of the authority that is administering the incentive program (eg., State office of energy, utility provider name)',
    critical: true,
  },
  geo_eligibility: {
    column_aliases: ['Geographic Eligibility'],
    description:
      'Any information related to the utilities, counties, or cities that constrain eligibility of the incentive',
  },
  program_title: {
    column_aliases: ['Program Title *'],
    description:
      'Title of the incentive program when available. If there is no explicit title, use Authority name + Technology',
    critical: true,
  },
  program_url: {
    column_aliases: ['Program URL'],
    description:
      'This will be the link that is shared with the consumers as "Learn More" when they see an incentive that interests them. It can be a link to the incentive program page, or a PDF for the rebate form.\n\nTip: Try to identify the best resource to send users to when they want to "Learn More" about the incentive. When in doubt, capture both.',
  },
  items: {
    column_aliases: ['Technology *'],
    description:
      'The technology (appliance or product) for which the rebate applies',
    values: {
      geothermal_heating_installation: {
        value_aliases: [
          'Ground Source Heat Pump (GSHP) / Geothermal HP',
        ],
      },
      air_to_water_heat_pump: {
        value_aliases: ['HVAC - Air to Water Heat Pump'],
      },
      central_air_conditioner: { value_aliases: ['Central Air Conditioner'] },
      ducted_heat_pump: { value_aliases: ['HVAC - Ducted Heat Pump'] },
      ductless_heat_pump: { value_aliases: ['HVAC - Ductless Heat Pump'] },
      heat_pump_water_heater: {
        value_aliases: ['Heat Pump Water Heater (HPWH)'],
      },
      new_electric_vehicle: { value_aliases: ['New Electric Vehicle'] },
      used_electric_vehicle: { value_aliases: ['Used Electric Vehicle'] },
      new_plugin_hybrid_vehicle: { value_aliases: ['New Plug-in Hybrid'] },
      used_plugin_hybrid_vehicle: { value_aliases: ['Used Plug-in Hybrid'] },
      electric_vehicle_charger: { value_aliases: ['Electric Vehicle Charger'] },
      rooftop_solar_installation: { value_aliases: ['Rooftop Solar'] },
      battery_storage_installation: { value_aliases: ['Battery Storage'] },
      heat_pump_clothes_dryer: {
        value_aliases: ['Heat Pump Dryers / Clothes Dryer'],
      },
      electric_stove: {
        value_aliases: ['Induction Cooktop', 'Electric Stove'],
      },
      air_sealing: { value_aliases: ['Air Sealing'] },
      duct_sealing: { value_aliases: ['Duct Sealing'] },
      attic_or_roof_insulation: { value_aliases: ['Insulation - Attic/Roof'] },
      basement_insulation: { value_aliases: ['Insulation - Basement'] },
      crawlspace_insulation: { value_aliases: ['Insulation - Crawlspace'] },
      floor_insulation: { value_aliases: ['Insulation - Floor'] },
      other_insulation: { value_aliases: ['Insulation - Other'] },
      wall_insulation: { value_aliases: ['Insulation - Wall'] },
      door_replacement: { value_aliases: ['Door Replacement'] },
      window_replacement: { value_aliases: ['Window Replacement'] },
      other_weatherization: { value_aliases: ['Other Weatherization'] },
      energy_audit: { value_aliases: ['Energy Audit/Assessment'] },
      electric_panel: { value_aliases: ['Electric Panel', 'Electric Wiring'] },
      electric_outdoor_equipment: {
        value_aliases: [
          'Electric outdoor equipment',
          'Electric Lawn Equipment (Mower, Edger, Leaf Blower, Weedwacker)',
          'Electric Lawn Equipment (Mower, Edger, Leaf Blower, Weedwhacker)',
        ],
      },
      smart_thermostat: { value_aliases: ['Smart Thermostat'] },
      ebike: { value_aliases: ['E-Bike'] },
      electric_thermal_storage_and_slab: {
        value_aliases: ['Electric Thermal Storage/Slab'],
      },
      evaporative_cooler: { value_aliases: ['Evaporative Cooler'] },
      non_heat_pump_clothes_dryer: {
        value_aliases: ['Non-Heat Pump Clothes Dryer'],
      },
      non_heat_pump_water_heater: {
        value_aliases: ['Non-Heat Pump Water Heater'],
      },
      whole_house_fan: { value_aliases: ['Whole House Fan'] },
      other: { value_aliases: ['Other'] },
    },
  },
  item_if_selected_other: {
    column_aliases: ["Technology (If selected 'Other')"],
    description:
      'Free-text description of the technology if Other was selected.',
  },
  'short_description.en': {
    column_aliases: [
      'Program Description (guideline)',
      'Program Description (style guide)',
    ],
    description:
      'A short description of the incentive program and the rebate value it offers including any limitations at a very high level (refer to the guidelines at https://docs.google.com/document/d/1nM9320uOUYpfpD3eZ4DFo32Scd5kauLEL17j1NYB5Ww/edit#bookmark=id.mryjojvw3dsg)',
  },
  'short_description.es': {
    column_aliases: ['Program Description (Spanish)'],
    description: 'A translation of the Program Description into Spanish.',
  },
  status: {
    column_aliases: ['Program Status'],
    description:
      'Status of the incentive program (active, expired, paused, unknown)',
    values: {
      active: {
        value_aliases: ['Active'],
        description: 'The incentive program is live',
      },
      retired: {
        value_aliases: ['Expired'],
        description: 'The incentive program has ended / expired',
      },
      on_hold: {
        value_aliases: ['Paused'],
        description:
          'The incentive program is on pause (eg., when funding is frozen)',
      },
      unknown: {
        value_aliases: ['Other', 'Unknown'],
        description:
          'Use only when no information is provided about this on the rebate',
      },
      in_development: {
        value_aliases: ['Planned'],
        description:
          'The incentive program is scheduled to start at a future date',
      },
    },
  },
  start_date: {
    column_aliases: ['Program Start', 'Program Start (mm/dd/yyyy)'],
    description:
      'The date when the program becomes effective or is available. If the program status is paused, capture the restart date (if available) separately from the program start date (add two entries). It is possible and acceptable for this value to be unknown since many incentive programs may not have this published yet / may not be launched yet.',
    critical: true,
  },
  end_date: {
    column_aliases: ['Program End', 'Program End (mm/dd/yyyy)'],
    description:
      'The date when the program expires and cannot be redeemed. Usually renewed at an annual basis. It is possible and acceptable for this value to be unknown since many incentive programs may not have this published yet / may not be launched yet.',
    critical: true,
  },
  payment_methods: {
    column_aliases: ['Rebate Type'],
    description:
      'Indicates how the consumer receives the rebate (Point of sale rebate, tax credit, account / bill credit, financing)',
    critical: true,
    values: {
      rebate: {
        value_aliases: ['Rebate (Post Purchase)', 'Rebate'],
        description: 'After purchase rebate',
      },
      pos_rebate: {
        value_aliases: ['Point of Sale Rebate'],
        description:
          'Consumer receives an instant discount at the time of purchase (upfront discount)',
      },
      account_credit: {
        value_aliases: ['Account Credit'],
        description: 'Credit to the utility account bill',
      },
      tax_credit: {
        value_aliases: ['Tax Credit'],
        description: 'Consumer receives a tax credit',
      },
      assistance_program: {
        value_aliases: ['Assistance Program'],
        description:
          'Free products or free service like weatherization or free EV charger',
      },
      bonus: {
        value_aliases: ['Bonus'],
        description:
          'For bonus offers that are dependent on a parent/primary incentive and cannot be applied to be redeemed on its own',
      },
      multiple: {
        value_aliases: ['Multiple'],
        description:
          'When multiple rebate type values are applicable for the incentive (add a comment for which ones)',
      },
      other: {
        value_aliases: ['Other'],
        description:
          'Use when a new/different value is provided for rebate type on the rebate program',
      },
      unknown: {
        value_aliases: ['Unknown'],
        description:
          'Use only when no information is provided about this on the rebate',
      },
      financing: {
        value_aliases: ['Financing'],
        description: 'For loan financing programs',
      },
    },
  },
  rebate_value: {
    column_aliases: ['Rebate Value *'],
    description:
      'The rebate value in plain English (could be a combination of all the rebate sub-fields below) ',
    critical: true,
  },
  'amount.type': {
    column_aliases: ['Amount Type *'],
    description:
      'Indicates the structure in which the incentive is being offered for the particular technology / product (e.g. dollar_amount, dollar_per_unit, percentage)',
    values: {
      dollars_per_unit: { value_aliases: ['Dollar Per Unit'] },
      percent: { value_aliases: ['Percent', 'Percent With a Cap'] },
      dollar_amount: {
        value_aliases: ['Dollar Amount', 'Dollar Amount With a Cap'],
      },
    },
  },
  'amount.number': {
    column_aliases: ['Number *'],
    description:
      'The incentive amount as it relates to amount type:\n-If type is dollar_amount or dollar_per_unit, this represents the incentive amount in dollars.\n-If the type is percentage, then this should be a number between 0 and 1.',
  },
  'amount.unit': {
    column_aliases: ['Unit'],
    description: 'The unit of the incentive offering (eg., ton)',
    values: {
      kilowatt: { value_aliases: ['Kilowatt', 'kW'] },
      kilowatt_hour: { value_aliases: ['Kilowatt-hour', 'kWh'] },
      ton: { value_aliases: ['Ton'] },
      watt: { value_aliases: ['Watt'] },
      btuh10k: { value_aliases: ['Btuh10k'] },
      square_foot: { value_aliases: ['Square Foot'] },
    },
  },
  'amount.minimum': {
    column_aliases: ['Amount Minimum'],
    description:
      'The minimum value of the incentive being offered for the particular technology / product. ',
  },
  'amount.maximum': {
    column_aliases: ['Amount Maximum'],
    description:
      'The maximum value of the incentive being offered for the particular technology / product. ',
  },
  'amount.representative': {
    column_aliases: ['Amount Representative (only for average values)'],
    description:
      'The estimated average incentive amount as recommended / calculated by the incentive provider. (not mandatory)',
  },
  bonus_description: {
    column_aliases: ['Bonus Description', 'Bonus Details'],
    description:
      "A bonus or a prerequisite are mostly applicable for for different appliance type, combined with another appliance's rebate offer. (eg., weatherization required to get heat pump, or heat pump required to get electric service upgrade) from the same incentive program.",
  },
  equipment_standards_restrictions: {
    column_aliases: ['Equipment Standards Restrictions'],
    description:
      'Incentive eligibility criteria on what you buy based on the appliance standard / rating  (SEER, Energy efficent rating). Also capture eligibility for EVs here such as EV MSRP maximum to qualify for an EV rebate',
  },
  equipment_capacity_restrictions: {
    column_aliases: ['Equipment Capacity Restrictions'],
    description:
      'Incentive eligibility criteria based what you buy based on the appliance capacity (ton/size limits)',
    critical: true,
  },
  contractor_restrictions: {
    column_aliases: ['Contractor Restrictions'],
    description:
      'Incentive eligibility criteria based on who you buy it from for the installation requirements (contractor network, suppliers etc)',
  },
  income_restrictions: {
    column_aliases: ['Income Restrictions'],
    description:
      'Income eligible conditions to qualify for the incentive when applicable. This could be a flat maximum number for EV rebates, but also a percentage of Area Median Income (AMI), which is defined by HUD for each (for complex income guidelines listed as table, add a separate tab capturing that income guideline and link the tab out in this cell)',
    critical: true,
  },
  filing_status: {
    column_aliases: ['Tax - filing Status Restrictions'],
    description:
      'Tax filing status to qualify for an incentive.\nFor example, there is a maximum income for each tax filing status for both the new and used EV credits.',
    critical: true,
    values: {
      hoh: { value_aliases: ['Head of the household'] },
      joint: { value_aliases: ['Married, filing jointly'] },
      married_filing_separately: {
        value_aliases: ['Married, filing separately'],
      },
      single: { value_aliases: ['Single'] },
      qualifying_widower_with_dependent_child: {
        value_aliases: [
          'Qualifying widower with dependent child',
        ],
      },
    },
  },
  owner_status: {
    column_aliases: ['Homeowner / Renter'],
    description:
      'Indicates ownership of the property - homeowner or renter. Use your judgement to make a call on if the appliance incentive makes sense for a renter - We typically think of this as something you could take with you if you move, vs a "fixture" in the home that only the owner benefits from.',
    values: {
      homeowner: { value_aliases: ['Homeowner'] },
      renter: { value_aliases: ['Renter'] },
    },
  },
  other_restrictions: {
    column_aliases: ['Other Restrictions'],
    description:
      'All other incentive eligibility criteria (new / qualified products, application timeline etc)',
    critical: true,
  },
  stacking_details: {
    column_aliases: ['Stacking Details'],
    description:
      'Details on what incentives can be (or should be) stacked together to maximize on multiple incentive offerings whenever eligible (includes bonus offers). Example, some programs offer a flat point of sale rebate AND an enhanced additional rebate if you qualify for the income threshold. Alternatively for some federal incentive, you may need to use one incentive to qualify for the other incentive for another item. Capture this as a freetext including the ID of the incentive it can be stacked with. Include any total project cap details as you include stacking information (eg., total installation cost is capped at 75% when multiple rebates are stacked together)',
  },
  financing_details: {
    column_aliases: ['Financing Details', 'Financing / Loan Details'],
    description:
      'Any financing / loan programs offered for supporting the purchase of the appliance / product',
  },
  editorial_notes: {
    column_aliases: ['Editorial Notes'],
    description:
      'This contains notes about the record, such as why it might need be served in the API.',
  },
  questions: {
    column_aliases: ['Questions'],
    description:
      'Holds questions from data collectors about how to represent different incentives',
  },
  omit_from_api: {
    column_aliases: ['Omit from API?'],
    description:
      "When true, our data pipeline will ignore this record so it doesn't end up in the API.",
  },
};

export const FIELD_MAPPINGS: AliasMap = Object.fromEntries(
  Object.entries(FIELD_METADATA).map(([fieldName, metadata]) => [
    fieldName,
    metadata.column_aliases,
  ]),
);

export const VALUE_MAPPINGS: { [index: string]: AliasMap } = Object.fromEntries(
  Object.entries(FIELD_METADATA)
    .filter(([, metadata]) => metadata.values)
    .map(([fieldName, metadata]) => [
      fieldName,
      Object.fromEntries(
        Object.entries(metadata.values!).map(([value, valueMetadata]) => [
          value,
          valueMetadata.value_aliases,
        ]),
      ),
    ]),
);
