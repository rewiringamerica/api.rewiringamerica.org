import Fastify from "fastify";
import FastifySqlite from 'fastify-sqlite';
import FastifySwagger from "@fastify/swagger";
import IncentiveSchema from './schemas/website/incentive.json' assert { type: 'json' };
import CalculatorRequestSchema from './schemas/website/calculator-request.json' assert { type: 'json' };
import CalculatorResponseSchema from './schemas/website/calculator-response.json' assert { type: 'json' };
import V0Routes from './routes/v0.js';

const fastify = Fastify({
  logger: true,
  verbose: true
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
      version: '0.0.0'
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

await fastify.register(V0Routes)

// TODO: split into routes folder:
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