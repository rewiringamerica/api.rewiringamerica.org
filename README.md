# Incentives API Prototype

Lifts the javascript logic from policy-hub and packages it up with Fastify.

Exposes /api/v1/calculator and describes query params and responses using OpenAPI.

Includes scripts to import data into a sqlite database.

Container is deployable on Google Cloud Run, in staging:
 - `gcloud config set project rewiring-america-dev`
 - `gcloud run deploy incentives-api-dev --source .` --> https://incentives-api-dev-mcifvvqcxa-uc.a.run.app

And production:

 - `gcloud config set project rewiring-america`
 - `gcloud run deploy incentives-api --source .` --> https://incentives-api-w4dlpicepa-uc.a.run.app

## TODO

 * put these TODOs into Asana
 * finalize path, request, response formats
 * add examples to schemas
 * use in existing calculator and remove calculation logic and data from website repo
 * document security requirements in openapi schema https://swagger.io/docs/specification/authentication/bearer-authentication/ (or leave this to Zuplo docs?)
 * ensure that our OpenAPI spec is valid and stays valid https://openap.is/validate?url=http%3A%2F%2Fincentives-api-dev-mcifvvqcxa-uc.a.run.app%2Fspec.json
 * what's the right content type for the yaml spec?
 * migrate any other lingering business logic from frontend (work with Derek)
 * think about metrics - what to record per client, where to (amplitude? bigquery) - should be possible from Zuplo
 * cache the openapi json/yaml files (or publish them somewhere at build time?)
 * protect the dev environment with a VPN (Tailscale?) or similar (use gcloud cli to proxy?)
 * should we use fastify-cli, split out routes? add tests?
 * should API accept tracts? address? https://geocoding.geo.census.gov/geocoder/
 * switch to typescript, use fluent apis for json schema etc? https://khalilstemmler.com/blogs/typescript/node-starter-project/
 * cleanup readme.com
 * cleanup fly.io

## Notes

Why fastify? Seems like included schema validation is clean. Was a sqlite example at glitch.com, just ran with it! https://www.fastify.io/docs/latest/

## References

 - https://cloud.google.com/files/apigee/apigee-web-api-design-the-missing-link-ebook.pdf
 - https://techbeacon.com/app-dev-testing/you-need-api-management-help-11-open-source-tools-consider
 - https://zuplo.com/blog/2022/12/01/api-key-authentication
 - https://blog.readme.com/http-api-faux-pas/