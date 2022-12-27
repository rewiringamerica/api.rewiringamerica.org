// TODO:
//   add https://github.com/fastify/fastify-swagger and ui for a frontend
//   add API KEY support?
//   add batch mode?
//   should API accept tracts?
//

const fastify = require("fastify")({
    logger: true,
});
const fp = require("fastify-plugin");
const sqlite3 = require("sqlite3").verbose();
const sqlite = require("sqlite");
const { calculateIncentives } = require('./incentives-calculation');

fastify.register(
    fp(async (fastify) => {
        const db = await sqlite.open({
            filename: "./data/incentives-api.db",
            driver: sqlite3.Database,
        });
        fastify.decorate("db", db);
    })
);

const zipSchema = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                zip: { type: "string", maxLength: 5, minLength: 5 },
            },
            required: ["zip"],
        },
    },
};

fastify.get("/api/v1/incentives", zipSchema, async (request, reply) => {
    const incentives = await fastify.db.all('SELECT * FROM ira_incentives;');
    // fix JSON array formatting:
    incentives.forEach(inc => inc.owner_status = JSON.parse(inc.owner_status));
    reply.status(200)
        .type('application/json')
        .send(JSON.stringify(incentives, null, 4));
});

const calculatorSchema = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                zip: { type: "string", maxLength: 5, minLength: 5 },
                owner_status: { type: "string", enum: ['homeowner', 'renter'] },
                //housing_type: { type: "string" },
                household_income: { type: "integer", minimum: 0, maximum: 100000000 },
                tax_filing: { type: "string", enum: ['single', 'joint', 'hoh'] },
                household_size: { type: "integer", minimum: 1, maximum: 8 }
            },
            required: ["zip", 
            "owner_status", 
            //"housing_type", 
            "household_income", 
            "tax_filing", 
            "household_size"],
        },
    },
};

fastify.get("/", (request, reply) => {
    reply.status(200)
        .type("text/html")
        .send(`<html>
            <head><title>IRA Calculator API</title></head>
            <body>
                <form action="/api/v1/calculator" method="GET">
                    <label for="zip">Zip: <input name="zip" type="text" inputmode="numeric" pattern="\\d{5}" placeholder="80212" required/></label>
                    <br>
                    <label for="owner_status">Owner Status: 
                        <select name="owner_status" value="homeowner" required>
                            <option value="homeowner">Homeowner</option>
                            <option value="renter">Renter</option>
                        </select>
                    </label>
                    <br>
                    <!--label for="housing_type">Housing type: 
                        <input name="housing_type" type="text" />
                    </label>
                    <br-->
                    <label for="household_income">Household income ($): <input name="household_income" type="number" min="0" max="100000000" step="1000" value="60000" required/></label>
                    <br>
                    <label for="tax_filing">Tax filing: 
                        <select name="tax_filing" value="single" required>
                            <option value="single">Single</option>
                            <option value="joint">Joint</option>
                            <option value="hoh">Head of household</option>
                        </select>
                    </label>
                    <br>
                    <label for="household_size">Household size: <input name="household_size" type="number" min="1" max="8" value="1" required /></label>
                    <br>
                    <button type="submit">Submit</button>
                </form>
            </body>
        </html>`)
});

fastify.get("/api/v1/calculator", calculatorSchema, async (request, reply) => {
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

fastify.get("/api/v1/amis", zipSchema, async (request, reply) => {
    const amis = await fetchAMIs(request.query.zip)
    reply.status(200)
        .type('application/json')
        .send(amis);
});

async function fetchAMIs(zip) {
    // TODO: parallelize?
    const location = await fastify.db.get(`
        SELECT * FROM zips WHERE zip = ?
    `, zip);
    const calculations = await fastify.db.get(`
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
    const ami = await fastify.db.get(`
        SELECT a.* 
        FROM zip_to_cbsasub zc LEFT JOIN ami a ON a.cbsasub = zc.cbsasub 
        WHERE zc.zipcode = ? AND a.cbsasub IS NOT NULL
    `, zip);
    return { ami, location, calculations };
}

// Run the server and report out to the logs
fastify.listen(
    { port: process.env.PORT, host: "127.0.0.1" },
    function (err, address) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Your app is listening on ${address}`);
    }
);
