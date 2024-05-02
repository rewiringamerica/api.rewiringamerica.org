/**
 * Each incentive pertains to a specific product or upgrade you can get;
 * these are the possible products/upgrades.
 */

export const ITEMS_SCHEMA = {
  air_sealing: { type: 'string' },
  air_to_water_heat_pump: { type: 'string' },
  attic_or_roof_insulation: { type: 'string' },
  basement_insulation: { type: 'string' },
  battery_storage_installation: { type: 'string' },
  central_air_conditioner: { type: 'string' },
  crawlspace_insulation: { type: 'string' },
  door_replacement: { type: 'string' },
  duct_replacement: { type: 'string' },
  duct_sealing: { type: 'string' },
  ducted_heat_pump: { type: 'string' },
  ductless_heat_pump: { type: 'string' },
  ebike: { type: 'string' },
  efficiency_rebates: { type: 'string' },
  electric_outdoor_equipment: { type: 'string' },
  electric_panel: { type: 'string' },
  electric_stove: { type: 'string' },
  electric_thermal_storage_and_slab: { type: 'string' },
  electric_vehicle_charger: { type: 'string' },
  electric_wiring: { type: 'string' },
  energy_audit: { type: 'string' },
  evaporative_cooler: { type: 'string' },
  floor_insulation: { type: 'string' },
  geothermal_heating_installation: { type: 'string' },
  heat_pump_air_conditioner_heater: { type: 'string' }, // TODO remove
  heat_pump_clothes_dryer: { type: 'string' },
  heat_pump_water_heater: { type: 'string' },
  new_electric_vehicle: { type: 'string' },
  new_plugin_hybrid_vehicle: { type: 'string' },
  non_heat_pump_clothes_dryer: { type: 'string' },
  non_heat_pump_water_heater: { type: 'string' },
  other: { type: 'string' },
  other_heat_pump: { type: 'string' },
  other_insulation: { type: 'string' },
  other_weatherization: { type: 'string' },
  rooftop_solar_installation: { type: 'string' },
  smart_thermostat: { type: 'string' },
  used_electric_vehicle: { type: 'string' },
  used_plugin_hybrid_vehicle: { type: 'string' },
  wall_insulation: { type: 'string' },
  weatherization: { type: 'string' }, // TODO remove
  whole_house_fan: { type: 'string' },
  window_replacement: { type: 'string' },
} as const;

export type Item = keyof typeof ITEMS_SCHEMA;

/** Only these items appear in the IRA incentives (and thus in API v0). */
export const IRA_ITEMS = [
  'battery_storage_installation',
  'efficiency_rebates',
  'electric_panel',
  'electric_stove',
  'electric_vehicle_charger',
  'electric_wiring',
  'geothermal_heating_installation',
  'heat_pump_air_conditioner_heater',
  'heat_pump_clothes_dryer',
  'heat_pump_water_heater',
  'new_electric_vehicle',
  'rooftop_solar_installation',
  'used_electric_vehicle',
  'weatherization',
] as const satisfies readonly Item[];

export type IRAItem = (typeof IRA_ITEMS)[number];

export const ALL_ITEMS = Object.keys(ITEMS_SCHEMA) as unknown as Item[];
