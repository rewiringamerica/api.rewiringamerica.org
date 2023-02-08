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
    const result = calculateIncentives(amis, { ...request.query });

    // TODO: URL parameter for this:
    fastify.i18n.locale('en');
    const allIncentives = [...result.tax_credit_incentives, ...result.pos_rebate_incentives];
    allIncentives.forEach(function (item) {
      let itemName = item.item;
      item.item = fastify.i18n.t(itemName);
      item.program = fastify.i18n.t(item.program);
      item.more_info_url = fastify.i18n.t(itemName);
    });


    reply.status(200)
      .type('application/json')
      .send(result);
  });
}
