import fs from 'fs';
import { FromSchema } from 'json-schema-to-ts';
import { LOCALIZABLE_STRING_SCHEMA } from './types/localizable-string';

export const ALL_PROGRAMS = [
  'alternativeFuelVehicleRefuelingPropertyCredit',
  'cleanVehicleCredit',
  'creditForPreviouslyOwnedCleanVehicles',
  'energyEfficientHomeImprovementCredit',
  'homeElectrificationAndApplianceRebates',
  'homeEfficiencyRebates',
  'residentialCleanEnergyCredit',

  // AZ
  // Mohave Electric Cooperative
  'az_mohaveElectricCooperative_mohaveChargedRebates',
  'az_mohaveElectricCooperative_mohaveHeatPumpRebate',
  'az_mohaveElectricCooperative_sunWattsRenewableEnergyAndRebateProgram',
  'az_mohaveElectricCooperative_mohaveHeatBatteryRebate',
  // Salt River Project
  'az_saltRiverProject_insulationRebate',
  'az_saltRiverProject_heatPumpWaterHeaterRebate',
  'az_saltRiverProject_homeElectricVehicle(EV)ChargerRebate',
  'az_saltRiverProject_homeElectricVehicleChargerRebate',
  // Sulphur Springs Valley Electric Cooperative
  'az_sulphurSpringsValleyElectricCooperative_hotWaterHeaterRebate',
  'az_sulphurSpringsValleyElectricCooperative_heatPumpRebates',
  // Tucson Electric Power
  'az_tucsonElectricPower_efficientHomeProgram',
  'az_tucsonElectricPower_weatherizationAssistance',
  'az_tucsonElectricPower_efficientHomeWaterHeating',
  'az_tucsonElectricPower_eVChargerRebates',
  // UniSource Energy Services
  'az_uniSourceEnergyServices_weatherizationAssistance',
  'az_uniSourceEnergyServices_efficientHomeProgram',

  // CO
  // Black Hills Energy
  'co_blackHillsEnergy_coloradoElectricResidentialRebates',
  'co_blackHillsEnergy_electrificationPilotProgram',
  'co_blackHillsEnergy_readyEVProgram',
  // Colorado Springs Utilities
  'co_coloradoSpringsUtilities_residentialEfficiencyRebateProgram',
  // City and County of Denver
  'co_cityAndCountyOfDenver_denverClimateActionRebateProgram-HomeEnergyRebates',
  'co_cityAndCountyOfDenver_denverClimateActionRebateProgram-E-BikeAndE-CargoBikeRebateVouchers',
  // Fort Collins Utilities
  'co_fortCollinsUtilities_efficiencyWorks',
  'co_fortCollinsUtilities_solarRebates',
  'co_fortCollinsUtilities_solarRebates-ResidentialBatteryStorageProgram',
  // Longmont Power and Communications
  'co_longmontPowerAndCommunications_efficiencyWorks',
  // Estes Park Power and Communications
  'co_estesParkPowerAndCommunications_efficiencyWorks',
  // Loveland Water and Power
  'co_lovelandWaterAndPower_efficiencyWorks',
  // Platte River Power Authority
  'co_platteRiverPowerAuthority_efficiencyWorks',
  // Empire Electric Association and Tri-State Generation and Transmission Association, Inc.
  'co_empireElectricAssociationAndTri-StateGenerationAndTransmissionAssociation,Inc_energyEfficiencyProductsProgram',
  // Energy Outreach Colorado
  'co_energyOutreachColorado_weatherizationAssistanceProgram',
  // Gunnison County Electric
  'co_gunnisonCountyElectric_rebates',
  // Holy Cross Energy
  'co_holyCrossEnergy_residentialRebates',
  // La Plata Electric Association
  'co_laPlataElectricAssociation_electrifyAndSave',
  // Morgan County REA
  'co_morganCountyREA_tri-StateG&T',
  // Mountain View Electric Association
  'co_mountainViewElectricAssociation_rebates',
  // Poudre Valley REA
  'co_poudreValleyREA_rebatesForResidentialCustomers',
  // San Isabel Electric
  'co_sanIsabelElectric_sanIsabelElectric',
  // San Miguel Power Association
  'co_sanMiguelPowerAssociation_residentialAndCommercialRebates',
  // Southeast Colorado Power Association
  'co_southeastColoradoPowerAssociation_tri-StateG&T',
  // Tri-State G&T
  'co_tri-StateG&T_tri-StateG&T',
  // United Power
  'co_unitedPower_tri-StateG&T',
  // Xcel Energy
  'co_xcelEnergy_heatPumpRebates',
  // Colorado Energy Office
  'co_coloradoEnergyOffice_electricVehicleTaxCredits',
  'co_coloradoEnergyOffice_vehicleExchangeColorado(VXC)Program',
  // State of Colorado
  'co_stateOfColorado_coloradoHeatPumpIncentives',
  'co_stateOfColorado_taxCredits',
  // City of Boulder
  'co_cityOfBoulder_residentialRebates',
  'co_cityOfBoulder_solarTaxRebates',
  // Boulder County
  'co_boulderCounty_energySmart',
  'co_boulderCounty_energySmartManufacturedHomesRebates',
  // Glenwood Springs Electric
  'co_glenwoodSpringsElectric_sustainabilityProgram2023ElectricRebates',
  // Highline Electric Association
  'co_highlineElectricAssociation_rebateProgram',
  // K.C. Electric Association
  'co_kCElectricAssociation_rebates',
  // Mountain Parks Electric
  'co_mountainParksElectric_rebates',
  // San Luis Valley REC
  'co_sanLuisValleyREC_energyEfficiencyRebateProgram',
  // Sangre de Cristo Electric Association
  'co_sangreDeCristoElectricAssociation_rebates',
  // Town of Avon
  'co_townOfAvon_energyEfficiencyProgram',
  // Town of Eagle
  'co_townOfEagle_energyEfficiencyProgram',
  // Town of Erie
  'co_townOfErie_rebates',
  // Town of Vail
  'co_townOfVail_energyEfficiencyProgram',
  // Unincorporated Eagle County
  'co_unincorporatedEagleCounty_energyEfficiencyProgram',
  // Walking Mountains
  'co_walkingMountains_low-ModerateIncomeProgram',
  'co_walkingMountains_rebates&Incentives',
  // White River Electric Association
  'co_whiteRiverElectricAssociation_rebates',
  // YW Electric Association
  'co_yWElectricAssociation_rebateProgram',

  // CT
  // State: DEEP
  'ct_cheapr',
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
  'ct_electricVehicleAndChargingRebateProgram',

  // IL
  // Commonwealth Edison
  'il_commonwealthEdison_applianceRebates',
  // Corn Belt Energy
  'il_cornBeltEnergy_rebateProgram',
  // Jo-Carroll Energy Cooperative
  'il_jo-CarrollEnergyCooperative_2023EnergyEfficiencyIncentives',
  'il_jo-CarrollEnergyCooperative_energyEfficiencyIncentives',
  // MidAmerican Energy
  'il_midAmericanEnergy_residentialInstantRebates',
  // State of Illinois
  'il_stateOfIllinois_homeWeatherization',

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
  'ri_erikaNiedowskiMemorialEBikeRebateProgram',
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
