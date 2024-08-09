import fs from 'fs';
import { LocalizableString } from './types/localizable-string';
import { STATES_AND_TERRITORIES } from './types/states';

const PROGRAMS_DIR = 'data';

interface Program {
  name: LocalizableString;
  url: LocalizableString;
}

interface Programs {
  [key: string]: Program;
}

export const ira_programs = {
  alternativeFuelVehicleRefuelingPropertyCredit: {
    name: {
      en: 'Federal Alternative Fuel Vehicle Refueling Property Credit (30C)',
      es: 'Crédito a la propiedad para el repostaje de vehículos de combustible alternativo (30C)',
    },
    url: {
      en: 'https://www.irs.gov/credits-deductions/alternative-fuel-vehicle-refueling-property-credit',
      es: 'https://www.irs.gov/es/credits-deductions/alternative-fuel-vehicle-refueling-property-credit',
    },
  },
  cleanVehicleCredit: {
    name: {
      en: 'Federal Clean Vehicle Credit (30D)',
      es: 'Crédito para vehículos limpios (30D)',
    },
    url: {
      en: 'https://www.irs.gov/credits-deductions/credits-for-new-clean-vehicles-purchased-in-2023-or-after',
      es: 'https://www.irs.gov/es/credits-deductions/credits-for-new-clean-vehicles-purchased-in-2023-or-after',
    },
  },
  creditForPreviouslyOwnedCleanVehicles: {
    name: {
      en: 'Federal Credit for Previously-Owned Clean Vehicles (25E)',
      es: 'Crédito para vehículos limpios de propiedad anterior (25E)',
    },
    url: {
      en: 'https://www.irs.gov/credits-deductions/used-clean-vehicle-credit',
      es: 'https://www.irs.gov/es/credits-deductions/used-clean-vehicle-credit',
    },
  },
  energyEfficientHomeImprovementCredit: {
    name: {
      en: 'Federal Energy Efficient Home Improvement Credit (25C)',
      es: 'Crédito para la mejora de la eficiencia energética en el hogar (25C)',
    },
    url: {
      en: 'https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit',
      es: 'https://www.irs.gov/es/credits-deductions/energy-efficient-home-improvement-credit',
    },
  },
  homeElectrificationAndApplianceRebates: {
    name: {
      en: 'Federal Home Electrification and Appliance Rebates (HEAR)',
      es: 'Reembolsos de Electrificación y Electrodomésticos (HEAR)',
    },
    url: {
      // Normally, program URLs should be first-party pages, but there's no
      // such thing for these.
      en: 'https://homes.rewiringamerica.org/federal-incentives/home-electrification-appliance-rebates',
      es: 'https://www.rewiringamerica.org/app/ira-calculator/information/cuadro-electrico',
    },
  },
  homeEfficiencyRebates: {
    name: {
      en: 'Federal Home Efficiency Rebates (HER)',
      es: 'Reembolsos de Eficiencia en el Consumo de Energía en el Hogar (HER)',
    },
    url: {
      // Normally, program URLs should be first-party pages, but there's no
      // such thing for these.
      en: 'https://homes.rewiringamerica.org/federal-incentives/home-efficiency-rebates',
      es: 'https://www.rewiringamerica.org/app/ira-calculator/information/climatizacion',
    },
  },
  residentialCleanEnergyCredit: {
    name: {
      en: 'Federal Residential Clean Energy Credit (25D)',
      es: 'Crédito de energía limpia residencial (25D)',
    },
    url: {
      en: 'https://www.irs.gov/credits-deductions/residential-clean-energy-credit',
      es: 'https://www.irs.gov/es/credits-deductions/residential-clean-energy-credit',
    },
  },
} as const;

const all_programs = STATES_AND_TERRITORIES.reduce((acc, state) => {
  try {
    const statePrograms = parseProgramJSON(state);
    return { ...acc, ...statePrograms };
  } catch (error) {
    console.error(`Error parsing programs for state ${state}:`, error);
    return acc;
  }
}, ira_programs);

export const PROGRAMS: Programs = all_programs;

function parseProgramJSON(state: string) {
  let result: Programs = {};
  const filepath = `${PROGRAMS_DIR}/${state}/programs.json`;
  if (fs.existsSync(filepath)) {
    result = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }

  return result;
}
