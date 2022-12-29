# Incentives API Prototype

Lifts the javascript logic from policy-hub and packages it up with Fastify.

Exposes /api/v1/calculator and describes query params and responses using OpenAPI.

Includes scripts to import data into a sqlite database.

Container is deployable and tested on fly.io and Google Cloud Run.

## TODO
 
 * verify logic vs firestore precalculated tables
 * consider if fastify-swagger-ui is the right thing, maybe it's https://rapidocweb.com or a hosted site (developer.rewiringamerica.org?)
 * add API_KEY support? https://zuplo.com or similar
 * add batch mode?
 * should API accept tracts?
 * make a QA environment that requires VPN or similar (Tailscale?)
 * add examples to schemas