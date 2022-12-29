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
 * consider if rapidoc is the right thing, maybe it's swagger-ui or a hosted site (CNAME developer.rewiringamerica.org?)
 * add API_KEY support? Or outsource to https://zuplo.com or similar?
 * clean up request/response formats, add batch mode?
 * use in existing calculator first?
 * should API accept tracts? address? https://geocoding.geo.census.gov/geocoder/
 * make a QA environment that requires VPN or similar (Tailscale?)
 * add examples to schemas