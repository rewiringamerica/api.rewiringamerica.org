import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { LOCALIZABLE_STRING_SCHEMA } from './types/localizable-string';

export const ALL_PROGRAMS = [
  'alternativeFuelVehicleRefuelingPropertyCredit',
  'cleanVehicleCredit',
  'creditForPreviouslyOwnedCleanVehicles',
  'energyEfficientHomeImprovementCredit',
  'HEEHR',
  'hopeForHomes',
  'residentialCleanEnergyCredit',

  // CT
  // Energize CT
  'ct_energizeCtHomeEnergySolutions',
  // Eversource
  'ct_residentialGroundSourceHeatPumpIncentive',
  'ct_residentialHeatPumpWaterHeaterIncentive',
  // Groton Utilities
  'ct_atticInsulationRebate',
  'ct_residentialHeatPumpWaterHeaterRebate',
  'ct_residentialHomeEnergySavingsProgram',
  // Norwich Public Utilities
  'ct_electricApplianceRebateProgram',
  'ct_wallOrAtticInsulationProgram',
  'ct_coolChoiceProgram',
  'ct_coolingAndHeatingIncentivePilotProgram',

  // NY
  // State or State + Utility:
  'ny_cleanHeatIncentives',
  'ny_nyStateResidentialTaxCredit',
  'ny_nyStateDriveCleanProgram',
  'ny_comfortHomeProgram',
  // ConEdison
  'ny_consolidatedEdisonRebates',
  // PSEG Long Island
  'ny_allElectricHomesProgram',

  // RI
  // State: OER, Commerce RI, RI DHS
  'ri_drive',
  'ri_drive_plus',
  'ri_smallScaleSolar',
  'ri_cleanHeat',
  'ri_dhsWeatherizationAssistanceProgram',
  // Pascoag
  'ri_hvacAndWaterHeaterIncentives',
  'ri_residentialEnergyStarOfferings',
  'ri_residentialEnergyAuditWeatherization',
  // Block Island
  'ri_blockIslandEnergyEfficiency',
  // Rhode Island Energy
  'ri_energyStarClothesDryer',
  'ri_residentialHeatPumpWaterHeater',
  'ri_electricHeatingAndCoolingRebates',
  'ri_incomeEligibleEnergySavings',

  //  VA
  // Appalachian Power
  'va_takeChargeVirginiaEfficientProductsProgram',
  'va_takeChargeVirginiaHomePerformanceProgram',
  // Dominion Virginia Energy
  'va_energyStarRebates',
  'va_waterEnergySavingsProgram',
  'va_evChargerRewards',
  'va_incomeAndAgeQualifyingEnergyEfficiencyProgram',
  'va_controlYourHeatingAndCoolingProgram',

  //  VT
  // Efficiency Vermont
  'vt_efficiencyVtAirToWaterHeatPumpRebateProgram',
  'vt_efficiencyVtClothesDryerRebateProgram',
  'vt_efficiencyVtDuctedHeatPumpRebateProgram',
  'vt_efficiencyVtDuctlessHeatPumpRebateProgram',
  'vt_efficiencyVtGroundSourceHeatPumpRebateProgram',
  'vt_efficiencyVtHeatPumpWaterHeaterRebateProgram',
  'vt_efficiencyVtHeatPumpRebateIncomeBonusProgram',
  'vt_efficiencyVtPowerShiftProgram',
  'vt_efficiencyVtWeatherizationProgram',
  'vt_efficiencyVtHomePerformanceEnergyStarProgram',
  'vt_efficiencyVtHomePerformanceEnergyStarIncomeBonusProgram',
  'vt_efficiencyVTwithWECWeatherizationProgram',
  'vt_efficiencyVTwithWECWeatherizationIncomeBonusProgram',
  // Burlington Electric Department
  'vt_burlingtonElectricAirToWaterHeatPumpRebateProgram',
  'vt_burlingtonElectricDuctedHeatPumpRebateProgram',
  'vt_burlingtonElectricDuctlessHeatPumpRebateProgram',
  'vt_burlingtonElectricGroundSourcePumpRebateProgram',
  'vt_burlingtonHeatPumpWaterHeaterRebateProgram',
  'vt_burlingtonElectricHeatPumpIncomeBonusRebateProgram',
  'vt_burlingtonElectricResidentialEVChargerRebateProgram',
  // Washington Electric Co-op
  'vt_buttonUpWECAirToWaterHeatPumpProgram',
  'vt_buttonUpWECDuctedHeatPumpProgram',
  'vt_buttonUpWECDuctlessHeatPumpProgram',
  'vt_buttonUpWECGroundSourceHeatPumpProgram',
  'vt_buttonUpWECHeatPumpWaterHeaterProgram',
  // Green Mountain Power
  'vt_greenMountainPowerDuctedHeatPumpRebateProgram',
  'vt_greenMountainPowerDuctlessHeatPumpRebateProgram',
  'vt_greenMountainPowerIncomeBonusRebateProgram',
  'vt_greenMountainPowerFreeLevel2EVChargerProgram',
  // VPPSA
  'vt_vppsaHeatPumpIncomeBonusRebateProgram',
  // Vermont Electric Co-Op
  'vt_vermontElectricCoopThermalEfficiencyBillCreditDuctedHeatPumpBonusProgram',
  'vt_vermontElectricCoopThermalEfficiencyBillCreditDuctlessHeatPumpBonusProgram',
  'vt_vermontElectricCoopFreeLevel2EVChargerProgram',
  'vt_vermontElectricCoopBillCredtLevel2EVChargerProgram',
  // State of Vermont
  'vt_stateOfVermontIncentivesForNewElectricVehiclesProgram',
  'vt_stateOfVermontMileageSmartUsedElectricVehiclesProgram',
  'vt_stateOfVermontReplaceYourRideProgram',
  'vt_stateOfVermontWeatherizationIncomeBonusProgram',
  // VGS
  'vt_vermontGasServiceWeatherizationProgram',
  'vt_vermontGasServiceWeatherizationIncomeBonusProgram',
] as const;

export const PROGRAMS_SCHEMA = {
  type: 'object',
  propertyNames: {
    type: 'string',
    enum: ALL_PROGRAMS,
  },
  additionalProperties: {
    $id: 'Program',
    type: 'object',
    properties: {
      name: {
        $ref: 'LocalizableString',
      },
      url: {
        $ref: 'LocalizableString',
      },
    },
    required: ['name'],
    additionalProperties: false,
  },
} as const;

export type Programs = FromSchema<
  typeof PROGRAMS_SCHEMA,
  { references: [typeof LOCALIZABLE_STRING_SCHEMA] }
>;

export const PROGRAMS: Programs = JSON.parse(
  fs.readFileSync('./data/programs.json', 'utf-8'),
);
