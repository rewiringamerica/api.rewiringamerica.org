import calculateIncentives from '../lib/incentives-calculation.js';
import fetchAMIsForAddress from '../lib/fetch-amis-for-address.js';
import fetchAMIsForZip from '../lib/fetch-amis-for-zip.js';

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

export default async function (fastify, opts) {
  async function fetchAMIsForLocation(location) {
    if (location.address) {
      return await fetchAMIsForAddress(fastify.sqlite, location.address);
    } else if (location.zip) {
      return await fetchAMIsForZip(fastify.sqlite, location.zip);
    } else {
      // FIXME: can this be a 400 BadRequest Error, using Fastify?
      throw new Error('location.address or location.zip required');
    }
  }

  fastify.get("/api/v1/calculator", { schema: APICalculatorSchema }, async (request, reply) => {
    const amis = await fetchAMIsForLocation(request.query.location);
    const result = calculateIncentives(amis, { ...request.query });
    reply.status(200)
      .type('application/json')
      .send(result);
  });
}