export const PROGRAMS_SCHEMA = {
  // IRA
  alternativeFuelVehicleRefuelingPropertyCredit: { type: 'string' },
  cleanVehicleCredit: { type: 'string' },
  creditForPreviouslyOwnedCleanVehicles: { type: 'string' },
  energyEfficientHomeImprovementCredit: { type: 'string' },
  HEEHR: { type: 'string' },
  hopeForHomes: { type: 'string' },
  residentialCleanEnergyCredit: { type: 'string' },

  // RI
  // State: OER, Commerce RI, RI DHS
  ri_drive: { type: 'string' },
  ri_drive_plus: { type: 'string' },
  ri_smallScaleSolar: { type: 'string' },
  ri_cleanHeat: { type: 'string' },
  ri_dhsWeatherizationAssistanceProgram: { type: 'string' },
  // Pascoag
  ri_hvacAndWaterHeaterIncentives: { type: 'string' },
  ri_residentialEnergyStarOfferings: { type: 'string' },
  ri_residentialEnergyAuditWeatherization: { type: 'string' },
  // Block Island
  ri_blockIslandEnergyEfficiency: { type: 'string' },
  // Rhode Island Energy
  ri_energyStarClothesDryer: { type: 'string' },
  ri_residentialHeatPumpWaterHeater: { type: 'string' },
  ri_electricHeatingAndCoolingRebates: { type: 'string' },
  ri_incomeEligibleEnergySavings: { type: 'string' },
} as const;

export const ALL_PROGRAMS = Object.keys(
  PROGRAMS_SCHEMA,
) as unknown as (keyof typeof PROGRAMS_SCHEMA)[];
