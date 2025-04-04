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
  cool_roof: { type: 'string' },
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
  electric_service_upgrades: { type: 'string' },
  electric_stove: { type: 'string' },
  electric_thermal_storage_and_slab: { type: 'string' },
  electric_vehicle_charger: { type: 'string' },
  electric_wiring: { type: 'string' },
  energy_audit: { type: 'string' },
  evaporative_cooler: { type: 'string' },
  floor_insulation: { type: 'string' },
  geothermal_heating_installation: { type: 'string' },
  heat_pump_clothes_dryer: { type: 'string' },
  heat_pump_water_heater: { type: 'string' },
  integrated_heat_pump_controls: { type: 'string' },
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
  solar_screen_films: { type: 'string' },
  solar_water_heater: { type: 'string' },
  used_electric_vehicle: { type: 'string' },
  used_plugin_hybrid_vehicle: { type: 'string' },
  wall_insulation: { type: 'string' },
  whole_house_fan: { type: 'string' },
  window_replacement: { type: 'string' },
} as const;

export type Item = keyof typeof ITEMS_SCHEMA;

/**
 * These items are for the legacy v0 API, and only used with IRA incentives.
 *
 * Note that this contains two items that don't appear above: weatherization and
 * heat_pump_air_conditioner_heater. In v1 (and state and utility incentives),
 * these are broken up into more granular categories.
 */
export const IRA_ITEMS_SCHEMA = {
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

export type IRAItem = keyof typeof IRA_ITEMS_SCHEMA;

export const ALL_ITEMS = Object.keys(ITEMS_SCHEMA) as unknown as Item[];

export const IRA_ITEMS = Object.keys(IRA_ITEMS_SCHEMA) as unknown as IRAItem[];
