# Incentives API Prototype

Lifts the javascript logic from policy-hub and packages it up with Fastify.

Exposes /api/v1/calculator and describes query params and responses using OpenAPI.

Includes scripts to import data into a sqlite database.

Container is deployable and tested on fly.io and Google Cloud Run.
 - `fly deploy` --> https://bold-sun-1360.fly.dev
 - `gcloud run deploy incentives-api-dev --source .` --> https://incentives-api-dev-mcifvvqcxa-uc.a.run.app

## TODO
 
 * should we use fastify-cli, split out routes? add tests? (yes)
 * verify logic vs firestore precalculated tables
 * add API_KEY support https://github.com/fastify/fastify-bearer-auth ? Or outsource to https://zuplo.com or similar?
 * clean up request/response formats, add batch mode?
 * use in existing calculator first?
 * should API accept tracts? address? https://geocoding.geo.census.gov/geocoder/
 * make a QA environment that requires VPN or similar (Tailscale?)
 * add examples to schemas
 * https://github.com/fastify/fastify-rate-limit ?
 * think about metrics - what to record per client, where to (amplitude?)
 * https://github.com/fastify/fastify-circuit-breaker ?

## Notes

Why fastify? Seems like included schema validation is clean. Was a sqlite example at glitch.com, just ran with it! https://www.fastify.io/docs/latest/

Why Stoplight Elements for docs? Seems cleanest. Also tried Rapidocs and Swagger-UI. https://github.com/stoplightio/elements/blob/main/docs/getting-started/elements/html.md


## References

 - https://cloud.google.com/files/apigee/apigee-web-api-design-the-missing-link-ebook.pdf