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
  column_aliases: string[];
  description: string;
  // critical doesn't seem to be used in a meaningful way. Maintaining it for
  // now, but retire if it isn't used in Q3 2024.
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
      'This will be the link that is shared with the consumers as "Learn More" when they see an incentive that interests them. It can be a link to the incentive program page, or a PDF for the rebate form.\n\nTip: Try to identify the best resource to send users to when they want to ""Learn More"" about the incentive. When in doubt, capture both."',
  },
  item: {
    column_aliases: ['Technology *'],
    description:
      'The technology (appliance or product) for which the rebate applies',
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
      'A short description of the incentive program and the rebate value it offers including any limitations at a very high level (refer to the guidelines here)',
  },
  'short_description.es': {
    column_aliases: ['Program Description (Spanish)'],
    description: 'A translation of the Program Description into Spanish.',
  },
  program_status: {
    column_aliases: ['Program Status'],
    description:
      'Status of the incentive program (active, expired, paused, unknown)',
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
  },
  'amount.number': {
    column_aliases: ['Number *'],
    description:
      'The incentive amount as it relates to amount type:\n-If type is dollar_amount or dollar_per_unit, this represents the incentive amount in dollars.\n-If the type is percentage, then this should be a number between 0 and 1.',
  },
  'amount.unit': {
    column_aliases: ['Unit'],
    description: 'The unit of the incentive offering (eg., ton)',
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
  },
  owner_status: {
    column_aliases: ['Homeowner / Renter'],
    description:
      'Indicates ownership of the property - homeowner or renter. Use your judgement to make a call on if the appliance incentive makes sense for a renter - We typically think of this as something you could take with you if you move, vs a "fixture" in the home that only the owner benefits from.',
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

// TODO: consolidate VALUE_MAPPINGS data into FIELD_METADATA.
export const VALUE_MAPPINGS: { [index: string]: AliasMap } = {
  authority_type: {
    federal: ['Federal'],
    state: ['State'],
    utility: ['Utility'],
    county: ['County'],
    city: ['City'],
    other: ['Other'],
  },
  payment_methods: {
    rebate: ['Rebate (Post Purchase)'],
    pos_rebate: ['Point of Sale Rebate'],
    account_credit: ['Account Credit'],
    tax_credit: ['Tax Credit'],
    assistance_program: ['Assistance Program'],
    bonus: ['Bonus'],
    multiple: ['Multiple'],
    other: ['Other'],
    unknown: ['Unknown'],
    financing: ['Financing'],
  },
  type: {
    rebate: ['Rebate (Post Purchase)'],
    pos_rebate: ['Point of Sale Rebate'],
    account_credit: ['Account Credit'],
    tax_credit: ['Tax Credit'],
    assistance_program: ['Assistance Program'],
    bonus: ['Bonus'],
    multiple: ['Multiple'],
    other: ['Other'],
    unknown: ['Unknown'],
    financing: ['Financing'],
  },
  item: {
    geothermal_heating_installation: [
      'Ground Source Heat Pump (GSHP) / Geothermal HP',
    ],
    heat_pump_air_conditioner_heater: [
      'HVAC - Air Source Heat Pump',
      'HVAC - Air to Water Heat Pump',
      'HVAC - Ducted Heat Pump',
      'HVAC - Ductless Heat Pump',
    ],
    heat_pump_water_heater: ['Heat Pump Water Heater (HPWH)'],
    new_electric_vehicle: ['New Electric Vehicle'],
    used_electric_vehicle: ['Used Electric Vehicle'],
    electric_vehicle_charger: ['Electric Vehicle Charger'],
    rooftop_solar_installation: ['Rooftop Solar'],
    battery_storage_installation: ['Battery Storage'],
    heat_pump_clothes_dryer: ['Heat Pump Dryers / Clothes Dryer'],
    electric_stove: ['Induction Cooktop', 'Electric Stove'],
    weatherization: ['Weatherization (Insulation and Air Sealing)'],
    electric_panel: ['Electric Panel', 'Electric Wiring'],
    electric_outdoor_equipment: [
      'Electric Lawn Equipment (Mower, Edger, Leaf Blower, Weedwacker)',
      'Electric Lawn Equipment (Mower, Edger, Leaf Blower, Weedwhacker)',
    ],
    smart_thermostat: ['Smart Thermostat'],
    ebike: ['E-Bike'],
    electric_thermal_storage_and_slab: ['Electric Thermal Storage/Slab'],
    evaporative_cooler: ['Evaporative Cooler'],
    non_heat_pump_clothes_dryer: ['Non-Heat Pump Clothes Dryer'],
    non_heat_pump_water_heater: ['Non-Heat Pump Water Heater'],
    whole_house_fan: ['Whole House Fan'],
    other: ['Other'],
  },
  program_status: {
    active: ['Active'],
    expired: ['Expired'],
    paused: ['Paused'],
    other: ['Other'],
    unknown: ['Unknown'],
    planned: ['Planned'],
  },
  'amount.type': {
    dollars_per_unit: ['Dollar Per Unit'],
    percent: ['Percent', 'Percent With a Cap'],
    dollar_amount: ['Dollar Amount', 'Dollar Amount With a Cap'],
  },
  'amount.unit': {
    kilowatt: ['Kilowatt', 'kW'],
    kilowatt_hour: ['Kilowatt-hour', 'kWh'],
    ton: ['Ton'],
    watt: ['Watt'],
    btuh10k: ['Btuh10k'],
    square_foot: ['Square Foot'],
  },
  owner_status: {
    homeowner: ['Homeowner'],
    renter: ['Renter'],
  },
};
