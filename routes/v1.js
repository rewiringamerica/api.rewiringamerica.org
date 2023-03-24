import fs from 'fs';
import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import { t } from '../lib/i18n.js';

const INCENTIVES = JSON.parse(fs.readFileSync('./data/ira_incentives.json', 'utf-8'));
const ZIP_REGEXP = /^\d\d\d\d\d$/;

// TODO write some tests for this
// - 4 digit = false
// - 6 digit = false
// - alpha text = false
// - number = false
// - null = false
function isZip(location) {
  return ZIP_REGEXP.test(location);
}

function translateIncentives(incentives, language) {
  return incentives.map((incentive) => {
    let item = { ...incentive };
    item.item = t(incentive.item, language);
    item.program = t(incentive.program, language);
    item.item_url = t(incentive.item_url, language);
    return item;
  });
}

function buildEligibilitySummary(calculation, ami, householdSize) {
  const ami_qualification = calculation.is_under_80_ami ? 'less_than_80_ami' :
    calculation.is_under_150_ami ? 'less_than_150_ami' : 'more_than_80_ami';
  return {
    "ami_for_household": ami[`l100_${householdSize}`],
    "80_percent_ami_for_household": ami[`l80_${householdSize}`],
    "150_percent_ami_for_household": ami[`l150_${householdSize}`],
    "ami_cbsa": ami.cbsasub,
    "ami_metro": ami.Metro_Area_Name,
    "ami_qualification": ami_qualification
  }
}

// TODO: update incentives-calculation to make this mapping easier, and do backcompat stuff in v0 instead
function buildIncentivesSummary(calculation) {
  return {
    pos_rebate_total: calculation.pos_savings,
    tax_credit_total: calculation.tax_savings,
    performance_rebate_total: calculation.performance_rebate_savings
  };
}

const CalculatorSchema = {
  "description": "How much money will your customer get with the Inflation Reduction Act?",
  "querystring": {
    "$ref": "CalculatorRequest"
  },
  "response": {
    "200": {
      "description": "Successful response",
      "$ref": "CalculatorResponse"
    },
    "400": {
      "description": "Bad request",
      "$ref": "Error"
    }
  }
};

const IncentivesSchema = {
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
            "$ref": "Incentive"
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
    if (isZip(location)) {
      // TODO: make sure missing zips are handled and don't return anything
      return await fetchAMIsForZip(fastify.sqlite, location);
    } else {
      // TODO: make sure bad addresses are handled here, and don't return anything
      return await fetchAMIsForAddress(fastify.sqlite, location);
    }
  }

  fastify.get("/api/v1/calculator", { schema: CalculatorSchema }, async (request, reply) => {
    const amis = await fetchAMIsForLocation(request.query.location);

    if (!amis) {
      throw fastify.httpErrors.notFound();
    }

    const result = calculateIncentives(amis, { ...request.query });

    const incentives = translateIncentives(result.incentives, request.query.language)
    const incentivesSummary = buildIncentivesSummary(result);
    const eligibilitySummary = buildEligibilitySummary(result, amis.ami, request.query.household_size);

    reply.status(200)
      .type('application/json')
      .send({
        incentives,
        "incentives_summary": incentivesSummary,
        "eligibility_summary": eligibilitySummary
      });
  });

  fastify.get("/api/v1/incentives", { schema: IncentivesSchema }, async (request, reply) => {
    const incentives = translateIncentives(INCENTIVES, request.query.language);
    return reply.status(200)
      .type('application/json')
      .send({ incentives });
  });
}
