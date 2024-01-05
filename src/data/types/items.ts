/**
 * Each incentive pertains to a specific product or upgrade you can get;
 * these are the possible products/upgrades.
 */

export const LAUNCHED_ITEMS_SCHEMA = {
  battery_storage_installation: { type: 'string' },
  efficiency_rebates: { type: 'string' },
  electric_panel: { type: 'string' },
  electric_stove: { type: 'string' },
  electric_vehicle_charger: { type: 'string' },
  electric_wiring: { type: 'string' },
  geothermal_heating_installation: { type: 'string' },
  heat_pump_air_conditioner_heater: { type: 'string' },
  heat_pump_clothes_dryer: { type: 'string' },
  heat_pump_water_heater: { type: 'string' },
  new_electric_vehicle: { type: 'string' },
  rooftop_solar_installation: { type: 'string' },
  used_electric_vehicle: { type: 'string' },
  weatherization: { type: 'string' },
} as const;

export const BETA_ITEMS_SCHEMA = {
  ebike: { type: 'string' },
  electric_outdoor_equipment: { type: 'string' },
  other: { type: 'string' },
  smart_thermostat: { type: 'string' },
} as const;

export const ITEMS_SCHEMA = { ...LAUNCHED_ITEMS_SCHEMA, ...BETA_ITEMS_SCHEMA };

export type Item = keyof typeof ITEMS_SCHEMA;

export const ALL_ITEMS = Object.keys(ITEMS_SCHEMA) as unknown as Item[];
export const LAUNCHED_ITEMS = Object.keys(
  LAUNCHED_ITEMS_SCHEMA,
) as unknown as Item[];
export const BETA_ITEMS = Object.keys(BETA_ITEMS_SCHEMA) as unknown as Item[];
