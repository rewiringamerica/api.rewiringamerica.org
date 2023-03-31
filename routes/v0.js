import fs from 'fs';
import calculateIncentives from '../lib/incentives-calculation.js';
import APIError from '../lib/APIError.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import { t } from '../lib/i18n.js';

const INCENTIVES = JSON.parse(fs.readFileSync('./data/ira_incentives.json', 'utf-8'));
const IRA_STATE_SAVINGS = JSON.parse(fs.readFileSync('./data/ira_state_savings.json', 'utf-8'));

INCENTIVES.forEach(incentive => Object.freeze(incentive));

function translateIncentives(incentives) {
  return incentives.map((incentive) => {
    let item = { ...incentive };
    item.item_es = t(incentive.item, 'es');
    item.item = t(incentive.item, 'en');
    item.program_es = t(incentive.program, 'es');
    item.program = t(incentive.program, 'en');
    // strip domain from v0 links:
    item.more_info_url_es = t(incentive.item_url, 'es').replace('https://www.rewiringamerica.org', '');
    item.more_info_url = t(incentive.item_url, 'en').replace('https://www.rewiringamerica.org', '');
    // Calculator's v0 schema doesn't care about this:
    delete item.item_url;
    return item;
  });
}

const CalculatorSchema = {
  "description": "How much money will you get with the Inflation Reduction Act?",
  "querystring": {
    "$ref": "WebsiteCalculatorRequest"
  },
  "response": {
    "200": {
      "description": "Successful response",
      "$ref": "WebsiteCalculatorResponse"
    },
    "400": {
      "description": "Bad request",
      "$ref": "Error"
    },
    "404": {
      "description": "Resource not found",
      "$ref": "Error"
    }
  }
};

const IncentivesSchema = {
  "description": "What are all the incentives from the Inflation Reduction Act?",
  "response": {
    "200": {
      "description": "Successful response",
      "type": "object",
      "required": ["incentives"],
      "properties": {
        "incentives": {
          "type": "array",
          "items": {
            "$ref": "WebsiteIncentive"
          }
        }
      }
    }
  }
};

export default async function (fastify, opts) {
  fastify.get("/api/v0/calculator", { schema: CalculatorSchema }, async (request, reply) => {
    // TODO: refactor as a plugin like fastify.amis.getForZip(zip)?
    try {
      const amisForZip = await fetchAMIsForZip(fastify.sqlite, request.query.zip);
      if (!amisForZip) {
        throw new APIError("Zip code doesn't exist.", {
          status: 404,
          field: "zip"
        });
      }

      const result = calculateIncentives(
        amisForZip,
        {
          ...request.query
        }
      );
  
      // Website Calculator backwards compatiblity from v1 data:
  
      // 1) Add nnnual savings from pregenerated model
      result.estimated_annual_savings = IRA_STATE_SAVINGS[amisForZip.location.state_id].estimated_savings_heat_pump_ev;
  
      // 2) Overwrite solar_tax_credit amount with representative_amount:
      const solarTaxCredit = result.tax_credit_incentives.find(incentive => incentive.item_type == 'solar_tax_credit');
      solarTaxCredit.amount = solarTaxCredit.representative_amount;
      solarTaxCredit.amount_type = 'solar';
      solarTaxCredit.representative_amount = 0;
  
      // 3) Populate the expected English and Spanish strings
      result.pos_rebate_incentives = translateIncentives(result.pos_rebate_incentives);
      result.tax_credit_incentives = translateIncentives(result.tax_credit_incentives);
  
      return reply.status(200)
        .type('application/json')
        .send(result);
    } catch (e) {
      throw fastify.httpErrors.createError(e);
    }
  });

  fastify.get("/api/v0/incentives", { schema: IncentivesSchema }, async (request, reply) => {
    const incentives = translateIncentives(INCENTIVES);
    return reply.status(200)
      .type('application/json')
      .send({ incentives });
  });
}
