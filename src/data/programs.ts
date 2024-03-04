import { AZ_PROGRAMS } from '../../data/AZ/programs';
import { CO_PROGRAMS } from '../../data/CO/programs';
import { CT_PROGRAMS } from '../../data/CT/programs';
import { IL_PROGRAMS } from '../../data/IL/programs';
import { MI_PROGRAMS } from '../../data/MI/programs';
import { NV_PROGRAMS } from '../../data/NV/programs';
import { NY_PROGRAMS } from '../../data/NY/programs';
import { RI_PROGRAMS } from '../../data/RI/programs';
import { VA_PROGRAMS } from '../../data/VA/programs';
import { VT_PROGRAMS } from '../../data/VT/programs';
import { LocalizableString } from './types/localizable-string';

export type Program = {
  name: LocalizableString;
  url?: LocalizableString;
};

const ira_programs = {
  alternativeFuelVehicleRefuelingPropertyCredit: {
    name: {
      en: 'Federal Alternative Fuel Vehicle Refueling Property Credit (30C)',
      es: 'Crédito a la propiedad para el repostaje de vehículos de combustible alternativo (30C)',
    },
  },
  cleanVehicleCredit: {
    name: {
      en: 'Federal Clean Vehicle Credit (30D)',
      es: 'Crédito para vehículos limpios (30D)',
    },
  },
  creditForPreviouslyOwnedCleanVehicles: {
    name: {
      en: 'Federal Credit for Previously-Owned Clean Vehicles (25E)',
      es: 'Crédito para vehículos limpios de propiedad anterior (25E)',
    },
  },
  energyEfficientHomeImprovementCredit: {
    name: {
      en: 'Federal Energy Efficient Home Improvement Credit (25C)',
      es: 'Crédito para la mejora de la eficiencia energética en el hogar (25C)',
    },
  },
  homeElectrificationAndApplianceRebates: {
    name: {
      en: 'Federal Home Electrification and Appliance Rebates (HEAR)',
      es: 'Reembolsos de Electrificación y Electrodomésticos (HEAR)',
    },
  },
  homeEfficiencyRebates: {
    name: {
      en: 'Federal Home Efficiency Rebates (HER)',
      es: 'Reembolsos de Eficiencia en el Consumo de Energía en el Hogar (HER)',
    },
  },
  residentialCleanEnergyCredit: {
    name: {
      en: 'Federal Residential Clean Energy Credit (25D)',
      es: 'Crédito de energía limpia residencial (25D)',
    },
  },
} as const;

const all_programs = {
  ...ira_programs,
  ...AZ_PROGRAMS,
  ...CO_PROGRAMS,
  ...CT_PROGRAMS,
  ...IL_PROGRAMS,
  ...MI_PROGRAMS,
  ...NV_PROGRAMS,
  ...NY_PROGRAMS,
  ...NY_PROGRAMS,
  ...RI_PROGRAMS,
  ...VA_PROGRAMS,
  ...VT_PROGRAMS,
} as const;

export type Programs = { [Key in keyof typeof all_programs]: Program };
export const PROGRAMS: Programs = all_programs;
