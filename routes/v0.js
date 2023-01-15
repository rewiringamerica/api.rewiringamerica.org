import calculateIncentives from '../lib/incentives-calculation.js';

export default async function (fastify, opts) {
  fastify.get("/api/v0/calculator", {
    schema: {
      description: 'How much money will you get with the Inflation Reduction Act?',
      querystring: {
        $ref: 'WebsiteCalculatorRequest',
      },
      response: {
        200: {
          description: 'Successful response',
          content: {
            "application/json": {
              schema: {
                $ref: 'WebsiteCalculatorResponse',
              }
            }
          }
        },
      },
    },
  }, async (request, reply) => {
    const amisForZip = await fetchAMIs(request.query.zip);
    const result = calculateIncentives(
      amisForZip,
      {
        ...request.query
      }
    );
    reply.status(200)
      .type('application/json')
      .send(JSON.stringify(result, null, 4));
  });

  async function fetchAMIs(zip) {
    // TODO: parallelize? materialize?
    const location = await fastify.sqlite.get(`
          SELECT * FROM zips WHERE zip = ?
      `, zip);
    const calculations = await fastify.sqlite.get(`
          SELECT
              MAX(is_urban) AS isUrban,
              MIN(t.mfi) AS lowestMFI,
              MAX(t.mfi) AS highestMFI,
              MIN(t.poverty_percent) AS lowestPovertyRate,
              MAX(t.poverty_percent) AS highestPovertyRate
          FROM zip_to_tract zt
              LEFT JOIN tracts t ON t.tract_geoid = zt.tract
          WHERE zt.zip = ? AND t.mfi != -666666666;
      `, zip);
    const ami = await fastify.sqlite.get(`
          SELECT a.*
          FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub
          WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
      `, zip);
    return { ami, location, calculations };
  }
}