# Developer Guide

This is a guide to contributing to this codebase. It's intended both for Rewiring America engineers and external contributors.

## Getting started

First, read the [README](README.md), especially the section on [API versions](README.md#api-versions).

Look at the [public API docs](https://api.rewiringamerica.org/docs) to understand the general shape of the API.

## For external contributors

### Incentive data

- **Start here if you want to help us collect incentives data**: [Guidelines for Incentive Data Collection](https://docs.google.com/document/d/11jHmz7tc2F6JsPw7vF3dC7BLGf5_XP4joMeCcjM0rVk/edit#heading=h.sdsaz8v9ipkd) provides a detailed overview of our approach for incentive data collection using volunteers.
 
- **To understand the structure of data we capture in spreadsheet format, see**: [Incentives Data Model_Baseline & Template](https://docs.google.com/spreadsheets/d/1JTeTk9lhBxgCvpNDsU80upaxgp1XPROUpFwfK4UHVbI/edit#gid=995688950).

- **Please contact us at api@rewiringamerica.org if you plan to start collecting new data for a state we don’t already have.** One of our goals with open sourcing this project is to avoid duplicated effort across organizations and companies, we would be happy to work together.

- **Get involved in [NODE Collective](https://www.nodecollective.org)**. If you would like to help evolve these standards and datasets in future, please sign up to help!

We also welcome reports of inaccuracies in our existing incentive data, and especially of the API incorrectly saying you're eligible for an incentive. Please file issues in those situations.

### Code

Code changes in this project are driven almost entirely by the needs of our nationwide incentive data gathering project. As such, we don't have a list of PR-ready tasks that are independent of incentive data.

We aren't categorically ruling out external code contributions, but we advise [contacting us](README.md#contact) before sending in a PR.

We welcome reports of bugs that don't pertain to incentive data, like unexpected errors from the API; please file issues for those.

## Codebase overview

All the code is TypeScript, and is required to typecheck without errors.

### Server

- The server uses [Fastify](https://fastify.io), with a minimal set of plugins, defined in `src/plugins`.

- All API endpoints return JSON, which conforms to the JSON Schemas in `src/schemas`. We use [json-schema-to-ts](https://github.com/ThomasAribart/json-schema-to-ts) to generate TypeScript types from these schemas.

- The API entry points are defined in `src/routes`.

- The calculation of incentive eligibility is implemented in `src/lib/incentives-calculation.ts` and `src/lib/state-incentives-calculation.ts`.

### Data

- Incentives are stored in JSON files in the directory `data`. The federal incentives are in `data/ira_incentives.json` and the state/utility incentives are in the subdirectories of `data` named with two-letter state codes.

  - There is a concept of "beta" states, whose incentives are not included in API responses unless the `include_beta_states` query param is set. The sets of launched and beta states are defined in `src/data/types/states.ts`.

- There are several other JSON data files in `data`, containing ancillary information such as tax brackets, low-income thresholds as defined by various authorities, and more.

- All JSON data files are validated against a JSON Schema. The schemas are in TypeScript files in `src/data`, mostly named to correspond to the relevant data file. We use a mix of [Ajv](https://github.com/ajv-validator/ajv) and [json-schema-to-ts](https://github.com/ThomasAribart/json-schema-to-ts) to have TypeScript types that match these schemas.

- There is some geographic data, in CSV format, in `scripts/data`. This is loaded into a SQLite database as a build step, and the SQLite file is deployed as part of the server image. This data allows mapping ZIP codes to census tracts, and census tracts to Area Median Income (AMI); this is used to compute incentive eligibility.

### Scripts

A variety of scripts have been created to automate or reduce manual effort for some workflows. See the [Scripts README](scripts/README.md) for details.

## Branching

- All PRs should be branches off of `main`.
- PRs should be landed by "squash and merge". We don't like merge commits or cluttered history.
- There should not be long-lived feature branches.
- Anything landed on `main` **may be deployed to production at any time**.

## Code review

All PRs are code-reviewed and require at least one approval from a repo committer (which currently includes RA staff only) before merging. PR authors merge their own PRs once they're approved and tests are passing.

To speed things up, we sometimes "approve with comments": approving but pointing out minor things that we trust the author to fix before merging, or that we leave up to the author's discretion. After fixing (or not fixing) such things, the author is free to merge without further review. (However, they can request another review if they want.)

## Tests

Automated tests are run for every PR, and we require all tests to pass before any PR can land.

We use Prettier and ESLint; both are run for every PR and are required to report no issues. We recommend setting up your editor to run Prettier automatically on save.

The codebase has fairly comprehensive test coverage, and we expect all changes to be well-covered. There are:

- End-to-end tests of the API endpoints, in `test/routes`. These compare live output against fixtures in `test/fixtures`.
  - There's a script to update the fixtures to match the output of a local instance of the server, in `scripts/update-fixtures.sh`. If you add a new fixture, make sure to add it to the script.
- Unit tests of various business logic modules, in `test/lib`.
- Unit tests that validate the static data files against JSON Schema, in `test/data`.