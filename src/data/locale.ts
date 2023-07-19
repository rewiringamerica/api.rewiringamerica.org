import fs from 'fs';
import { JSONSchemaType } from 'ajv';

const itemsSchema = {
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
const allItems = Object.keys(
  itemsSchema,
) as unknown as (keyof typeof itemsSchema)[];

export type Items = {
  [k in keyof typeof itemsSchema]: string;
};

const programsSchema = {
  alternativeFuelVehicleRefuelingPropertyCredit: { type: 'string' },
  cleanVehicleCredit: { type: 'string' },
  creditForPreviouslyOwnedCleanVehicles: { type: 'string' },
  energyEfficientHomeImprovementCredit: { type: 'string' },
  HEEHR: { type: 'string' },
  hopeForHomes: { type: 'string' },
  residentialCleanEnergyCredit: { type: 'string' },
} as const;
const allPrograms = Object.keys(
  programsSchema,
) as unknown as (keyof typeof programsSchema)[];

export type Programs = {
  [k in keyof typeof programsSchema]: string;
};

export interface Locale {
  items: Items;
  programs: Programs;
  urls: Items;
}

export const SCHEMA: JSONSchemaType<Locale> = {
  type: 'object',
  properties: {
    items: {
      type: 'object',
      properties: itemsSchema,
      required: allItems,
    },
    programs: {
      type: 'object',
      properties: programsSchema,
      required: allPrograms,
    },
    urls: {
      type: 'object',
      properties: itemsSchema,
      required: allItems,
    },
  },
  required: ['items', 'programs', 'urls'],
};

export const LOCALES = {
  en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf-8')) as Locale,
  es: JSON.parse(fs.readFileSync('./locales/es.json', 'utf-8')) as Locale,
};
