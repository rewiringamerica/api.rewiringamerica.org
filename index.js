import fs from 'fs';
import Fastify from "fastify";
import FastifySqlite from 'fastify-sqlite';
import FastifySwagger from "@fastify/swagger";
import calculateIncentives from './lib/incentives-calculation.js';
import IncentiveSchema from './schemas/incentive.json' assert { type: 'json' };
import CalculatorRequestSchema from './schemas/calculator-request.json' assert { type: 'json' };
import CalculatorResponseSchema from './schemas/calculator-response.json' assert { type: 'json' };

const fastify = Fastify({
  logger: true
});

await fastify.register(FastifySqlite, {
  promiseApi: true, // the DB instance supports the Promise API. Default false
  name: null, // optional decorator name. Default null
  verbose: false, // log sqlite3 queries as trace. Default false
  dbFile: './incentives-api.db', // select the database file. Default ':memory:'
  mode: FastifySqlite.sqlite3.OPEN_READONLY // how to connecto to the DB, Default: OPEN_READWRITE | OPEN_CREATE | OPEN_FULLMUTEX
});

await fastify.register(FastifySwagger, {
  openapi: {
    info: {
      title: 'Rewiring America Incentives API',
      description: 'Query federal electrification incentives.',
      version: '0.1.0'
    },
    externalDocs: {
      url: 'https://www.rewiringamerica.org/app/ira-calculator',
      description: 'IRA Savings Calculator'
    },
  },
  refResolver: {
    buildLocalReference(json, baseUri, fragment, i) {
      return json.$id || `my-fragment-${i}`
    }
  }
});

// NOTE: if you call fastify.swagger() before the server is running, $refs will break!
// these can be used in schemas via $ref and e.g. Incentive will be added to openapi's components when docs are built:
fastify.addSchema(IncentiveSchema);
fastify.addSchema(CalculatorRequestSchema);
fastify.addSchema(CalculatorResponseSchema);

fastify.get('/spec.json', { schema: { hide: true } }, (_, reply) => {
  const spec = fastify.swagger();
  reply.status(200)
    .type('application/json')
    .send(spec);
});

fastify.get('/spec.yaml', { schema: { hide: true } }, (_, reply) => {
  const spec = fastify.swagger({ yaml: true });
  reply.status(200)
    .type('text/x-yaml')
    .send(spec);
});

fastify.get("/api/v1/calculator", {
  schema: {
    description: 'How much money will you get with the Inflation Reduction Act?',
    querystring: {
      $ref: 'CalculatorRequest',
    },
    response: {
      200: {
        description: 'Successful response',
        content: {
          "application/json": {
            schema: {
              $ref: 'CalculatorResponse',
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

// Run the server and report out to the logs
await fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);