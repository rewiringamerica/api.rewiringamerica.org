import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';
import incentives from '../data/ira_incentives.json' assert { type: 'json' };
import IRA_STATE_SAVINGS from '../data/ira_state_savings.json' assert { type: 'json' };

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
    const amisForZip = await fetchAMIsForZip(fastify.sqlite, request.query.zip);

    if (!amisForZip) {
      throw fastify.httpErrors.notFound();
    }

    const result = calculateIncentives(
      amisForZip,
      {
        ...request.query
      }
    );

    // Website Calculator-only:
    // Annual savings from pregenerated model
    result.estimated_annual_savings = IRA_STATE_SAVINGS[amisForZip.location.state_id].estimated_savings_heat_pump_ev;

    return reply.status(200)
      .type('application/json')
      .send(result);
  });

  fastify.get("/api/v0/incentives", { schema: IncentivesSchema }, async (request, reply) => {
    return reply.status(200)
      .type('application/json')
      .send({ incentives });
  });
}
