// Map from canonical column name to possible aliases in spreadsheets.
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

// Note: this is from alias to canonical name, which is the reverse of
// FIELD_MAPPINGS above.
// TODO: make this more consistent.
export const VALUE_MAPPINGS = {
  payment_methods: {
    'Rebate (post purchase)': 'rebate',
    'Point of sale rebate': 'pos_rebate',
    'Account Credit': 'account_credit',
    'Tax Credit': 'tax_credit',
    'Assistance program': 'assistance_program',
    Bonus: 'other',
    Multiple: 'other',
    Other: 'other',
    Unknown: 'unknown',
    Financing: 'other',
  },
  item: {
    'Ground Source Heat Pump (GSHP) / Geothermal HP':
      'geothermal_heating_installation',
    'HVAC - Air Source Heat Pump': 'heat_pump_air_conditioner_heater',
    'HVAC - Air to Water Heat Pump': 'heat_pump_air_conditioner_heater',
    'HVAC - Ducted Heat Pump': 'heat_pump_air_conditioner_heater',
    'HVAC - Ductless Heat Pump': 'heat_pump_air_conditioner_heater',
    'Heat Pump Water Heater (HPWH)': 'heat_pump_water_heater',
    'New Electric Vehicle': 'new_electric_vehicle',
    'Used Electric Vehicle': 'used_electric_vehicle',
    'Electric Vehicle Charger': 'electric_vehicle_charger',
    'Rooftop Solar': 'rooftop_solar_installation',
    'Battery Storage': 'battery_storage_installation',
    'Heat Pump Dryers / Clothes Dryer': 'heat_pump_clothes_dryer',
    'Heat Pump Dryers / clothes dryer': 'heat_pump_clothes_dryer',
    'Electric Stove': 'electric_stove',
    'Weatherization (insulation and air sealing)': 'weatherization',
    'Electric wiring': 'electric_panel',
    'Electric panel': 'electric_panel',
    'Electric lawn equipment (mower, edger, leaf blower, weedwhacker)':
      'electric_outdoor_equipment',
    'Smart Thermostat': 'smart_thermostat',
    'E-Bike': 'ebike',
    'Induction Cooktop': 'electric_stove',
    Other: 'other',
  },
  amount_type: {
    'dollar per unit': 'dollars_per_unit',
    'percent with a cap': 'percent',
    'dollar amount with a cap': 'dollar_amount',
  },
  amount_unit: {
    kW: 'kilowatt',
    kWh: 'kilowatt_hour',
    'kilowatt-hour': 'kilowatt_hour',
  },
};