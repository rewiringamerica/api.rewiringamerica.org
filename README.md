# Incentives API

Lifts the javascript logic from policy-hub and packages it up with Fastify.

Exposes /api/v1/calculator and describes query params and responses using OpenAPI.

Includes scripts to import data into a sqlite database.

## Architecture

The node.js file is packaged in a Docker container to allow installing sqlite in Cloud Run.

The Cloud Run services are not intended to be hit directly, we use zuplo.com as an API gateway. Zuplo performs the following functions for us:
 - documentation generation and hosting at /docs
 - API key management and authentication (and tracking for leaks)
 - rate limiting
 - CORS support for browsers

In production, this app responds to api.rewiringamerica.org via a CNAME that points to Zuplo.

At the moment, @tomc is the only team member with access to Zuplo at https://portal.zuplo.com/ - changes to configurations can also be made via git at https://github.com/rewiringamerica/incentives-api-zuplo

Zuplo authenticates developers using Auth0. @tomc, @derek, @tomm and @chell have access to Auth0.

## Deploys

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
 * set autoscaling rules and capacity rules on Cloud Run in dev and prod
 * document security requirements in openapi schema https://swagger.io/docs/specification/authentication/bearer-authentication/ (or leave this to Zuplo docs?)
 * ensure that our OpenAPI spec is valid and stays valid https://openap.is/validate?url=http%3A%2F%2Fincentives-api-dev-mcifvvqcxa-uc.a.run.app%2Fspec.json
 * can we make the Cloud Run services private and give Zuplo keys to hit them? https://zuplo.com/docs/policies/upstream-gcp-jwt-inbound
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
 * link to changelog from Zuplo? https://www.rewiringamerica.org/app/changelog

## Notes

Why fastify? Seems like included schema validation is clean. Was a sqlite example at glitch.com, just ran with it! https://www.fastify.io/docs/latest/

## References

 - https://cloud.google.com/files/apigee/apigee-web-api-design-the-missing-link-ebook.pdf
 - https://techbeacon.com/app-dev-testing/you-need-api-management-help-11-open-source-tools-consider
 - https://zuplo.com/blog/2022/12/01/api-key-authentication
 - https://blog.readme.com/http-api-faux-pas/
