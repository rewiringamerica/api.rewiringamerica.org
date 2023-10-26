export const PROGRAMS_SCHEMA = {
  // IRA
  alternativeFuelVehicleRefuelingPropertyCredit: { type: 'string' },
  cleanVehicleCredit: { type: 'string' },
  creditForPreviouslyOwnedCleanVehicles: { type: 'string' },
  energyEfficientHomeImprovementCredit: { type: 'string' },
  HEEHR: { type: 'string' },
  hopeForHomes: { type: 'string' },
  residentialCleanEnergyCredit: { type: 'string' },

  // CT
  // Energize CT
  ct_energizeCtHomeEnergySolutions: { type: 'string' },
  // Eversource
  ct_residentialGroundSourceHeatPumpIncentive: { type: 'string' },
  ct_residentialHeatPumpWaterHeaterIncentive: { type: 'string' },
  // Groton Utilities
  ct_atticInsulationRebate: { type: 'string' },
  ct_residentialHeatPumpWaterHeaterRebate: { type: 'string' },
  ct_residentialHomeEnergySavingsProgram: { type: 'string' },
  // Norwich Public Utilities
  ct_electricApplianceRebateProgram: { type: 'string' },
  ct_wallOrAtticInsulationProgram: { type: 'string' },
  ct_coolChoiceProgram: { type: 'string' },
  ct_coolingAndHeatingIncentivePilotProgram: { type: 'string' },

  // NY
  // State or State + Utility:
  ny_cleanHeatIncentives: { type: 'string' },
  ny_nyStateResidentialTaxCredit: { type: 'string' },
  ny_nyStateDriveCleanProgram: { type: 'string' },
  ny_comfortHomeProgram: { type: 'string' },
  // ConEdison
  ny_consolidatedEdisonRebates: { type: 'string' },
  // PSEG Long Island
  ny_allElectricHomesProgram: { type: 'string' },

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
