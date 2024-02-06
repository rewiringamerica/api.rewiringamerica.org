// From canonical column name to a list of possible aliases.
// The *first* alias is special – when converting from canonical
// to an alias (as when going from json to spreadsheet), that is
// the one that will be used
export type AliasMap = { [index: string]: string[] };
// From alias back to canonical.
export type FlatAliasMap = { [index: string]: string };

// Map from canonical column name to possible aliases in spreadsheets.
export const FIELD_MAPPINGS: AliasMap = {
  id: ['ID'],
  data_urls: ['Data Source URL(s)'],
  authority_type: ['Authority Level *'],
  authority_name: ['Authority (Name) *'],
  program_title: ['Program Title *'],
  program_url: ['Program URL'],
  item: ['Technology *'],
  technology_if_selected_other: ["Technology (If selected 'Other')"],
  'short_description.en': ['Program Description (guideline)'],
  program_status: ['Program Status'],
  program_start_raw: ['Program Start', 'Program Start (mm/dd/yyyy)'],
  program_end_raw: ['Program End', 'Program End (mm/dd/yyyy)'],
  payment_methods: ['Rebate Type'],
  rebate_value: ['Rebate Value *'],
  'amount.type': ['Amount Type *'],
  'amount.number': ['Number *'],
  'amount.unit': ['Unit'],
  'amount.minimum': ['Amount Minimum'],
  'amount.maximum': ['Amount Maximum'],
  'amount.representative': ['Amount Representative (only for average values)'],
  bonus_description: ['Bonus Description', 'Bonus Details'],
  equipment_standards_restrictions: ['Equipment Standards Restrictions'],
  equipment_capacity_restrictions: ['Equipment Capacity Restrictions'],
  contractor_restrictions: ['Contractor Restrictions'],
  income_restrictions: ['Income Restrictions'],
  tax_filing_status_restrictions: ['Tax - filing Status Restrictions'],
  owner_status: ['Homeowner / Renter'],
  other_restrictions: ['Other Restrictions'],
  stacking_details: ['Stacking Details'],
  financing_details: ['Financing Details'],
  // This contains notes about why we might not serve a record in the API.
  // It may not appear in all spreadsheets.
  editorial_notes: ['Editorial Notes'],
  questions: ['Questions'],
};

export const VALUE_MAPPINGS: { [index: string]: AliasMap } = {
  authority_type: {
    federal: ['Federal'],
    state: ['State'],
    utility: ['Utility'],
    county: ['County'],
    city: ['City'],
  },
  payment_methods: {
    rebate: ['Rebate (post purchase)'],
    pos_rebate: ['Point of sale rebate'],
    account_credit: ['Account Credit'],
    tax_credit: ['Tax Credit'],
    assistance_program: ['Assistance program'],
    bonus: ['Bonus'],
    multiple: ['Multiple'],
    other: ['Other'],
    unknown: ['Unknown'],
    financing: ['Financing'],
  },
  type: {
    rebate: ['Rebate (post purchase)'],
    pos_rebate: ['Point of sale rebate'],
    account_credit: ['Account Credit'],
    tax_credit: ['Tax Credit'],
    assistance_program: ['Assistance program'],
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
    heat_pump_air_conditioner_heater: ['HVAC - Air Source Heat Pump'],
    heat_pump_air_to_water: ['HVAC - Air to Water Heat Pump'],
    heat_pump_ducted: ['HVAC - Ducted Heat Pump'],
    heat_pump_ductless: ['HVAC - Ductless Heat Pump'],
    heat_pump_water_heater: ['Heat Pump Water Heater (HPWH)'],
    new_electric_vehicle: ['New Electric Vehicle'],
    used_electric_vehicle: ['Used Electric Vehicle'],
    electric_vehicle_charger: ['Electric Vehicle Charger'],
    rooftop_solar_installation: ['Rooftop Solar'],
    battery_storage_installation: ['Battery Storage'],
    heat_pump_clothes_dryer: ['Heat Pump Dryers / Clothes Dryer'],
    electric_stove: ['Induction Cooktop', 'Electric Stove'],
    weatherization: ['Weatherization (insulation and air sealing)'],
    electric_panel: ['Electric panel', 'Electric wiring'],
    electric_outdoor_equipment: [
      'Electric lawn equipment (mower, edger, leaf blower, weedwhacker)',
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
    dollars_per_unit: ['dollar per unit'],
    percent: ['percent with a cap', 'percent'],
    dollar_amount: ['dollar amount with a cap', 'dollar amount'],
  },
  'amount.unit': {
    kilowatt: ['kW'],
    kilowatt_hour: ['kilowatt-hour', 'kWh'],
  },
  owner_status: {
    homeowner: ['Homeowner'],
    renter: ['Renter'],
  },
};
