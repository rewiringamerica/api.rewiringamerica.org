/**
 * Each incentive pertains to a specific product or upgrade you can get;
 * these are the possible products/upgrades.
 */
export const ITEMS_SCHEMA = {
  batteryStorageInstallation: { type: 'string' },
  efficiencyRebates: { type: 'string' },
  electricPanel: { type: 'string' },
  electricStove: { type: 'string' },
  electricVehicleCharger: { type: 'string' },
  electricWiring: { type: 'string' },
  geothermalHeatingInstallation: { type: 'string' },
  heatPumpAirConditionerHeater: { type: 'string' },
  heatPumpClothesDryer: { type: 'string' },
  heatPumpWaterHeater: { type: 'string' },
  newElectricVehicle: { type: 'string' },
  rooftopSolarInstallation: { type: 'string' },
  usedElectricVehicle: { type: 'string' },
  weatherization: { type: 'string' },
} as const;

export type Item = keyof typeof ITEMS_SCHEMA;

export const ALL_ITEMS = Object.keys(ITEMS_SCHEMA) as unknown as Item[];
