import fs from 'fs';
import minimist from 'minimist';

import { config } from 'dotenv';
import { OpenAI } from 'openai';

import { FILES, IncentiveFile } from './incentive-spreadsheet-registry';
import { Incentive } from './translation-types';

/* Pre-work
1. Get an OpenAPI key if you don't have one – Tom C and Tom M are admins.
2. Add the API key to a .env file with key OPENAI_API_KEY.
*/

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: 'org-ddLfNAZlZhWVu6YToH5DHQno',
});

const GPT_MODEL = 'gpt-4-1106-preview'; // This GPT4 is fast and relatively cheap.
const BATCH_SIZE = 200; // Should easily avoid any token limits while keeping costs down
const SYSTEM_PROMPT = `I'm going to give you a list of newline-delimited strings in English. Translate each of the strings to Spanish, and return the results, also newline-delimited.

The translations should be in the same style as the original strings. They must have the following characteristics:
- they don't have to be complete sentences
- they should be less than 160 characters long
- use the formal 'usted' instead of the informal 'tu'
- use the following domain-specific vocabulary:
'Clothes dryer': 'Secadora'
'Heating, ventilation & cooling': 'Sistemas de climatización'
'HVAC': 'Climatización'
'Electric vehicle': 'Vehículo eléctrico'
'EV': 'Vehículo eléctrico'
'Solar': 'Tejado solar'
'Battery storage': 'Almacenamiento de baterías'
'Water heater': 'Calentador de agua'
'Cooking stove/range': 'Estufa/cocina'
'Electrical panel & wiring': 'Tablero eléctrico y cableado'
'Weatherization & efficiency': 'Impermeabilización y eficiencia energética'
'Weatherization': 'Impermeabilización'
'Homeowner': 'Propietario'
'Renter': 'Inquilino'
'Single': 'Soltero'
'Married filing jointly': 'Casado que presenta una declaración conjunta'
'Married filing separately': 'Casado que presenta una declaración por separado'
'Head of household': 'Cabeza de familia'
'Household size': 'Tamaño del hogar'
'Household income': 'Ingresos del hogar'
'Tax credit': 'Crédito fiscal'
'Upfront discount': 'Descuento por adelantado'
'Rebate': 'Reembolso'
'Account credit': 'Crédito de cuenta'
'Performance rebate': 'Reembolso por rendimiento'
'Incentive': 'Incentivo'
'Terms': 'Términos'
'Electric Utility': 'Empresa de servicios eléctricos'
'Zip': 'Código postal'
'an electric/induction stove': 'una estufa eléctrica/inducción'
'an EV charger': 'un cargador de vehículos eléctricos'
'electric wiring': 'cableado'
'geothermal heating installation': 'instalación de calefacción geotérmica'
'a heat pump': 'una bomba de calor'
'a heat pump clothes dryer': 'una secadora con bomba de calor'
'a heat pump water heater': 'un calentador de agua con bomba de calor'
'rooftop solar': 'tejado solar'
'an energy efficiency retrofit': 'una renovación de eficiencia energética'
`;

// These are from RI-1, RI-4, RI-7
const EXAMPLE_USER = `Up to $700 applied to your PUD account for purchase and installation of qualifying heat pumps and mini-splits.
Up to $2,250 back on insulation and air sealing your home. Must be recommended in a home energy audit and installed by a BPI certified contractor.
100% of weatherization costs, including air/duct sealing and insulation, up to $2,000.`;

const EXAMPLE_RESPONSE = `Hasta $700 aplicado a su cuenta de PUD para la compra e instalación de bombas de calor y mini-splits calificados.
Reembolsos hasta $2,250 por el aislamiento y sellado de aire. Debe ser recomendado en una auditoría energética e instalado por un contratista certificado.
El total de los costos de la impermeabilización, hasta $2000, incluyendo el sellado de conductos de aire y el aislamiento.`;

function createPrompt(
  translations: string[],
  system: string,
  examples: [string, string][],
) {
  const output: OpenAI.ChatCompletionMessageParam[] = [];
  output.push({ role: 'system', content: system });
  for (const [user, assistant] of examples) {
    output.push({ role: 'user', content: user });
    output.push({ role: 'assistant', content: assistant });
  }
  output.push({ role: 'user', content: translations.join('\n') });

  return output;
}

async function queryGpt(
  messages: OpenAI.ChatCompletionMessageParam[],
  model: string,
) {
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.0,
      seed: 0,
    });
    return completion.choices[0].message!.content!;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error with OpenAI API request: ${error.message}`);
    } else {
      console.error(`Error with OpenAI API request: ${error}`);
    }
  }
}

async function logTranslations(
  file: IncentiveFile,
  model_family: string,
) {
  const incentives: Incentive[] = JSON.parse(
    fs.readFileSync(file.filepath, 'utf-8'),
  );

  let translations: string[] = [];
  let batch = 0;
  while (batch * BATCH_SIZE < incentives.length) {
    const english = incentives
      .slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE)
      .map(incentive => incentive.short_description.en);
    const prompt = createPrompt(english, SYSTEM_PROMPT, [
      [EXAMPLE_USER, EXAMPLE_RESPONSE],
    ]);
    const resp = await queryGpt(prompt, model_family);
    if (resp === undefined)
      throw new Error('Undefined response received from GPT');
    const spanish = resp.split('\n');
    if (spanish.length !== english.length) {
      throw new Error(
        `Mismatched lengths for translation inputs (${english.length}) and outputs (${spanish.length})`,
      );
    }
    translations = translations.concat(spanish);
    batch += 1;
  }

  console.log(`Translations for ${file.filepath}`);
  console.log('Copy these into the corresponding spreadsheet.');
  console.log('If necessary, filter to records that exist in the JSON file.');
  console.log(translations.join('\n'));
}

(async function () {
  const args = minimist(process.argv.slice(2));

  const bad = args._.filter(f => !(f in FILES));
  if (bad.length) {
    console.error(
      `${bad.join(', ')} not valid(choices: ${Object.keys(FILES).join(', ')})`,
    );
    process.exit(1);
  }

  args._.forEach(async fileIdent => {
    await logTranslations(FILES[fileIdent], GPT_MODEL);
  });
})();
