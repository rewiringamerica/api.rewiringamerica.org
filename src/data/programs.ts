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

  // AZ
  // Mohave Electric Cooperative
  'az_mohaveElectricCooperativeMohaveChargedRebates',
  'az_mohaveElectricCooperativeMohaveHeatPumpRebate',
  'az_mohaveElectricCooperativesunWattsRenewableEnergyAndRebateProgram',
  'az_mohaveElectricCooperativeMohaveHeatBatteryRebate',
  // Salt River Project
  'az_saltRiverProjectInsulationRebate',
  'az_saltRiverProjectHeatPumpWaterHeaterRebate',
  'az_saltRiverProjectHomeElectricVehicleChargerRebate',
  // Sulphur Springs Valley Electric Cooperative
  'az_sulphurSpringsValleyElectricCooperativeHotWaterHeaterRebate',
  'az_sulphurSpringsValleyElectricCooperativeHeatPumpRebates',
  // Tucson Electric Power
  'az_tucsonElectricPowerEfficientHomeProgram',
  'az_tucsonElectricPowerWeatherizationAssistance',
  'az_tucsonElectricPowerEfficientHomeWaterHeating',
  'az_tucsonElectricPowerEVChargerRebates',
  // UniSource Energy Services
  'az_uniSourceEnergyServicesWeatherizationAssistance',
  'az_uniSourceEnergyServicesEfficientHomeProgram',

  // CO
  // Black Hills Energy
  'co_blackHillsEnergycoloradoElectricResidentialRebates',
  'co_blackHillsEnergyelectrificationPilotProgram',
  'co_blackHillsEnergyreadyEVProgram',
  // Colorado Springs Utilities
  'co_coloradoSpringsUtilitiesresidentialEfficiencyRebateProgram',
  // City and County of Denver
  'co_cityAndCountyOfDenverdenverClimateActionRebateProgram-HomeEnergyRebates',
  'co_cityAndCountyOfDenverdenverClimateActionRebateProgram-E-BikeAndE-CargoBikeRebateVouchers',
  // Fort Collins Utilities
  'co_fortCollinsUtilitiesefficiencyWorks',
  'co_fortCollinsUtilitiessolarRebates',
  'co_fortCollinsUtilitiessolarRebates-ResidentialBatteryStorageProgram',
  // Longmont Power and Communications
  'co_longmontPowerAndCommunicationsefficiencyWorks',
  // Estes Park Power and Communications
  'co_estesParkPowerAndCommunicationsefficiencyWorks',
  // Loveland Water and Power
  'co_lovelandWaterAndPowerefficiencyWorks',
  // Platte River Power Authority
  'co_platteRiverPowerAuthorityefficiencyWorks',
  // Empire Electric Association and Tri-State Generation and Transmission Association, Inc.
  'co_empireElectricAssociationAndTri-StateGenerationAndTransmissionAssociation,InceNERGYEFFICIENCYPRODUCTSPROGRAM',
  // Energy Outreach Colorado
  'co_energyOutreachColoradoweatherizationAssistanceProgram',
  // Gunnison County Electric
  'co_gunnisonCountyElectricrebates',
  // Holy Cross Energy
  'co_holyCrossEnergyresidentialRebates',
  // La Plata Electric Association
  'co_laPlataElectricAssociationelectrifyAndSave',
  // Morgan County REA
  'co_morganCountyREAtri-StateG&T',
  // Mountain View Electric Association
  'co_mountainViewElectricAssociationrebates',
  // Poudre Valley REA
  'co_poudreValleyREArebatesForResidentialCustomers',
  // San Isabel Electric
  'co_sanIsabelElectricsanIsabelElectric',
  // San Miguel Power Association
  'co_sanMiguelPowerAssociationresidentialAndCommercialRebates',
  // Southeast Colorado Power Association
  'co_southeastColoradoPowerAssociationtri-StateG&T',
  // Tri-State G&T
  'co_tri-StateG&Ttri-StateG&T',
  // United Power
  'co_unitedPowertri-StateG&T',
  // Xcel Energy
  'co_xcelEnergyheatPumpRebates',
  // Colorado Energy Office
  'co_coloradoEnergyOfficeelectricVehicleTaxCredits',
  'co_coloradoEnergyOfficevehicleExchangeColorado(VXC)Program',
  // State of Colorado
  'co_stateOfColoradocoloradoHeatPumpIncentives',
  'co_stateOfColoradotaxCredits',
  // City of Boulder
  'co_cityOfBoulderresidentialRebates',
  'co_cityOfBouldersolarTaxRebates',
  // Boulder County
  'co_boulderCountyenergySmart',
  'co_boulderCountyenergySmartManufacturedHomesRebates',
  // Glenwood Springs Electric
  'co_glenwoodSpringsElectricsustainabilityProgram2023ElectricRebates',
  // Highline Electric Association
  'co_highlineElectricAssociationrebateProgram',
  // K.C. Electric Association
  'co_kCElectricAssociationrebates',
  // Mountain Parks Electric
  'co_mountainParksElectricrebates',
  // San Luis Valley REC
  'co_sanLuisValleyRECenergyEfficiencyRebateProgram',
  // Sangre de Cristo Electric Association
  'co_sangreDeCristoElectricAssociationrebates',
  // Town of Avon
  'co_townOfAvonenergyEfficiencyProgram',
  // Town of Eagle
  'co_townOfEagleenergyEfficiencyProgram',
  // Town of Erie
  'co_townOfErierebates',
  // Town of Vail
  'co_townOfVailenergyEfficiencyProgram',
  // Unincorporated Eagle County
  'co_unincorporatedEagleCountyenergyEfficiencyProgram',
  // Walking Mountains
  'co_walkingMountainslow-ModerateIncomeProgram',
  'co_walkingMountainsrebates&Incentives',
  // White River Electric Association
  'co_whiteRiverElectricAssociationrebates',
  // YW Electric Association
  'co_yWElectricAssociationrebateProgram',

  // CT
  // Energize CT
  'ct_energizeCtHomeEnergySolutions',
  'ct_residentialAirSourceHeatPumpIncentive',
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
