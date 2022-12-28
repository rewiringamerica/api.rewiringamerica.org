import Fastify from "fastify";
import fp from "fastify-plugin";
import calculateIncentives from './incentives-calculation.js';
import swaggerDefault from "@fastify/swagger";
import swaggerUiDefault from "@fastify/swagger-ui";
import fastifySqlite from 'fastify-sqlite';

const fastify = Fastify({
  logger: true
});

await fastify.register(fastifySqlite, {
  promiseApi: true, // the DB instance supports the Promise API. Default false
  name: null, // optional decorator name. Default null
  verbose: false, // log sqlite3 queries as trace. Default false
  dbFile: './data/incentives-api.db', // select the database file. Default ':memory:'
  mode: fastifySqlite.sqlite3.OPEN_READONLY // how to connecto to the DB, Default: OPEN_READWRITE | OPEN_CREATE | OPEN_FULLMUTEX
});

await fastify.register(swaggerDefault, {
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
  }
});

// NOTE: if you call fastify.swagger() before the server is running, $refs will break!
// can be used in schemas via $ref and Incentive will be added to openapi's components when docs are built:
fastify.addSchema({
  $id: 'Incentive',
  type: 'object',
  required: ['type', 'program', 'item', 'more_info_url', 'amount', 'amount_type', 'item_type', 'owner_status', 'description', 'start_date', 'end_date', 'special_note'],
  properties: {
    type: { type: 'string', enum: ['household', 'ev', 'niche'] },
    program: { type: 'string' },
    item: { type: 'string' },
    more_info_url: { type: 'string' },
    amount: { type: 'number' },
    amount_type: { type: 'string', enum: ['dollar_amount', 'percent'] },
    item_type: { type: 'string', enum: ['performance_rebate', 'pos_rebate', 'tax_credit'] },
    owner_status: { type: 'string', enum: ['homeowner', 'renter'] },
    description: { type: 'string' },
    start_date: { type: 'number' },
    end_date: { type: 'number' },
    special_note: { type: 'string' },
    representative_amount: { type: 'number' },
    ami_qualification: { type: 'string', enum: ['less_than_80_ami', 'less_than_150_ami'] },
    agi_max_limit: { type: 'number' },
    filing_status: { type: 'string', enum: ['single', 'joint', 'hoh'] },
    note_1: { type: 'string' },
    note_2: { type: 'string' },
    note_3: { type: 'string' },
    eligible: { type: 'boolean' },
  },
})

await fastify.register(swaggerUiDefault, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next() },
    preHandler: function (request, reply, next) { next() }
  },
  staticCSP: false,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true,
})

fastify.get('/', { schema: { hide: true } }, (_, reply) => {
  reply.redirect('/documentation');
});

fastify.get("/api/v1/calculator", {
  schema: {
    description: 'How much money will you get with the Inflation Reduction Act?',
    querystring: {
      type: "object",
      properties: {
        zip: {
          type: "string",
          description: "Your zip code helps determine the amount of discounts and tax credits you qualify for.",
          maxLength: 5,
          minLength: 5
        },
        owner_status: {
          type: "string",
          description: "Homeowners and renters qualify for different incentives.",
          enum: ['homeowner', 'renter']
        },
        household_income: {
          type: "integer",
          description: "Enter your gross income (income before taxes). Include wages and salary plus other forms of income, including pensions, interest, dividends, and rental income. If you are married and file jointly, include your spouse's income.",
          minimum: 0,
          maximum: 100000000
        },
        tax_filing: {
          type: "string",
          description: "Select \"Head of Household\" if you have a child or relative living with you, and you pay more than half the costs of your home. Select \"Joint\" if you file your taxes as a married couple.",
          enum: ['single', 'joint', 'hoh']
        },
        household_size: {
          type: "integer",
          description: "Include anyone you live with who you claim as a dependent on your taxes, and your spouse or partner if you file taxes together.",
          minimum: 1,
          maximum: 8
        }
      },
      required: ["zip",
        "owner_status",
        "household_income",
        "tax_filing",
        "household_size"],
    },
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          is_under_80_ami: { type: 'boolean' },
          is_under_150_ami: { type: 'boolean' },
          is_over_150_ami: { type: 'boolean' },

          // The max POS savings is $14,000 if you're under 150% ami, otherwise 0
          pos_savings: { type: 'integer' },

          // You can't save more than tax owed. Choose the lesser of tax owed vs tax savings
          tax_savings: { type: 'integer' },

          // Not prominently displayed
          performance_rebate_savings: { type: 'integer' },

          // Annual savings from pregenerated model
          estimated_annual_savings: { type: 'integer' },
          pos_rebate_incentives: { type: 'array', items: { $ref: 'Incentive' } },
          tax_credit_incentives: { type: 'array', items: { $ref: 'Incentive' } },
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
  // TODO: parallelize?
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