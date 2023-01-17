import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIs from '../lib/fetch-amis.js';

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
    }
  }
};

export default async function (fastify, opts) {
  fastify.get("/api/v0/calculator", { schema: CalculatorSchema }, async (request, reply) => {
    const amisForZip = await fetchAMIs(fastify.sqlite, request.query.zip);
    const result = calculateIncentives(
      amisForZip,
      {
        ...request.query
      }
    );
    reply.status(200)
      .type('application/json')
      .send(result);
  });
}