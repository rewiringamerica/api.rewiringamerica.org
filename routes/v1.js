import fs from 'fs';
import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import { t } from '../lib/i18n.js';

const INCENTIVES = JSON.parse(fs.readFileSync('./data/ira_incentives.json', 'utf-8'));

function translateIncentives(incentives, language) {
  return incentives.map((incentive) => {
    let item = { ...incentive };
    item.item = t(incentive.item, language);
    item.program = t(incentive.program, language);
    item.item_url = t(incentive.item_url, language);
    return item;
  });
}

const APICalculatorSchema = {
  "description": "How much money will your customer get with the Inflation Reduction Act?",
  "querystring": {
    "$ref": "APICalculatorRequest"
  },
  "response": {
    "200": {
      "description": "Successful response",
      "$ref": "APICalculatorResponse"
    },
    "400": {
      "description": "Bad request",
      "$ref": "Error"
    }
  }
};

const APIIncentivesSchema = {
  "description": "What are all the incentives from the Inflation Reduction Act?",
  "querystring": {
    "type": "object",
    "properties": {
      "language": {
        "type": "string",
        "description": "Optional choice of language for `item`, `program` and `item_url` properties.",
        "enum": [
          "en",
          "es"
        ],
        "default": "en"
      }
    }
  },
  "response": {
    "200": {
      "description": "Successful response",
      "type": "object",
      "required": ["incentives"],
      "properties": {
        "incentives": {
          "type": "array",
          "items": {
            "$ref": "APIIncentive"
          }
        }
      }
    },
    "400": {
      "description": "Bad request",
      "$ref": "Error"
    }
  }
};

export default async function (fastify, opts) {
  async function fetchAMIsForLocation(location) {
    if (location.address) {
      // TODO: make sure bad addresses are handled here, and don't return anything
      return await fetchAMIsForAddress(fastify.sqlite, location.address);
    } else if (location.zip) {
      return await fetchAMIsForZip(fastify.sqlite, location.zip);
    } else {
      // NOTE: this should never happen, APICalculatorSchema should block it:
      throw new Error('location.address or location.zip required');
    }
  }

  fastify.get("/api/v1/calculator", { schema: APICalculatorSchema }, async (request, reply) => {
    const amis = await fetchAMIsForLocation(request.query.location);

    if (!amis) {
      throw fastify.httpErrors.notFound();
    }

    const result = calculateIncentives(amis, { ...request.query });

    const language = request.query.language;
    result.tax_credit_incentives = translateIncentives(result.tax_credit_incentives, language)
    result.pos_rebate_incentives = translateIncentives(result.pos_rebate_incentives, language)

    reply.status(200)
      .type('application/json')
      .send(result);
  });

  fastify.get("/api/v1/incentives", { schema: APIIncentivesSchema }, async (request, reply) => {
    const incentives = translateIncentives(INCENTIVES, request.query.language);
    return reply.status(200)
      .type('application/json')
      .send({ incentives });
  });
}
