# Incentives API Prototype

Lifts the javascript logic from policy-hub and packages it up with Fastify.

Exposes /api/v1/calculator and describes query params and responses using OpenAPI.

Includes scripts to import data into a sqlite database.

Container is deployable and tested on fly.io and Google Cloud Run.
 - `fly deploy` --> https://bold-sun-1360.fly.dev
 - `gcloud run deploy incentives-api-dev --source .` --> https://incentives-api-dev-mcifvvqcxa-uc.a.run.app

## TODO

 * document security requirements in openapi schema https://swagger.io/docs/specification/authentication/bearer-authentication/ (or leave this to Zuplo docs?)
 * ensure that our OpenAPI spec is valid and stays valid https://openap.is/validate?url=http%3A%2F%2Fincentives-api-dev-mcifvvqcxa-uc.a.run.app%2Fspec.json
 * add summaries to response
 * add API_KEY support https://github.com/fastify/fastify-bearer-auth ? Or outsource to https://zuplo.com or similar?
 * docs with readme.com? (set up an automation to sync the spec)
 * CORS support to allow building frontend demo, using external swagger docs
 * think about metrics - what to record per client, where to (amplitude?)
 * split out documentation into a separate site (e.g. api.rewiringamerica.org for REST and developers.rewiringamerica.org for docs?)
 * cache the openapi json/yaml files (or publish them somewhere at merge time?)
 * decommission fly.io stuff for now
 * set up a production deploy, set CNAMEs for dev and production
 * protect the dev environment with a VPN (Tailscale?) or similar (use gcloud cli to proxy?)
 * should we use fastify-cli, split out routes? add tests?
 * clean up request/response formats, add batch mode?
 * use in existing calculator first?
 * should API accept tracts? address? https://geocoding.geo.census.gov/geocoder/
 * add examples to schemas (does fastify support this?)
 * https://github.com/fastify/fastify-response-validation ?
 * https://github.com/fastify/fastify-rate-limit ?
 * https://github.com/fastify/fastify-circuit-breaker ?
 * switch to typescript, use fluent apis for json schema etc? https://khalilstemmler.com/blogs/typescript/node-starter-project/
 * decide on doc hosting platform, cleanup others: readme.com, zuplo.com

## Notes

Why fastify? Seems like included schema validation is clean. Was a sqlite example at glitch.com, just ran with it! https://www.fastify.io/docs/latest/

Why Stoplight Elements for docs? Seems cleanest. Also tried Rapidocs and Swagger-UI. https://github.com/stoplightio/elements/blob/main/docs/getting-started/elements/html.md


## References

 - https://cloud.google.com/files/apigee/apigee-web-api-design-the-missing-link-ebook.pdf
 - https://techbeacon.com/app-dev-testing/you-need-api-management-help-11-open-source-tools-consider
 - https://zuplo.com/blog/2022/12/01/api-key-authentication
 - https://blog.readme.com/http-api-faux-pas/