# Incentives API

This repo contains structured data about home electrification incentives in the US, and an API server that calculates which incentives a user is eligible for.

See public API docs at https://api.rewiringamerica.org/docs.

An instance of this API is live at https://api.rewiringamerica.org. An API key is required to use it; [sign up for a key here](https://www.rewiringamerica.org/api).

## Running the server

### For local development

1. _(Optional)_ If you want the server to be able to accept addresses as well as ZIP codes, you'll need to get an API key for [Geocodio](https://geocod.io). (RA employees: there's one in the internal password manager.)
2. Create a file called `.env` at the root of your working copy:

   ```
   GEOCODIO_API_KEY=<YOUR_GEOCODIO_API_KEY>
   ```

   If you don't have a Geocodio key, just put nothing after the equals sign.

3. Install Node 18. We recommend using [NVM](https://github.com/nvm-sh/nvm).
4. Install Yarn by running `corepack enable`.
5. Run `yarn install` to install dependencies.
6. Run `yarn build` to build the SQLite database of geographic and income data.
7. Run `yarn tsc` to compile TS scripts
8. Run `yarn dev` to run the API server. It will automatically reload whenever you modify code. The server listens on port 3000 by default.

See [CONTRIBUTING.md](CONTRIBUTING.md) for a guide to the codebase.

### For deployment

You can run the API server as a Docker container, without setting up a development environment.

:rotating_light: **We strongly recommend that you use Rewiring America's public API instance, rather than deploying your own instance**. We'll be updating incentive data frequently, and it's important to keep up with those changes. If our public API doesn't meet your needs, please [contact us](#contact) to discuss.

- Run `docker build .` to build the image.
- The container listens for HTTP requests on port 8080.
- If you have a [Geocodio](https://geocod.io) API key, put it in the environment variable `GEOCODIO_API_KEY` to enable the API server to accept addresses as well as ZIP codes.

- The server does not deal with access control (e.g. API keys) or rate limiting. Rewiring America's public API instance uses [Zuplo](https://zuplo.com) to handle those concerns.

  There is also a Fastify plugin to handle CORS, but it's enabled only when `NODE_ENV !== 'production'`, because RA's public API instance also uses Zuplo to handle CORS.

## Roadmap

**Caveat**: the roadmap for this project is planned and tracked internally at Rewiring America. What's reflected here may not be fully up to date.

As of November 2023, our highest priority efforts are:

- Improving our processes for collecting new incentive data and keeping existing incentive data up to date.
- Using those processes to expand coverage of state, local, and utility incentives nationwide.
- Adapting our representation of incentives to be able to capture all the various details and nuances of incentives, in a structured way. This includes income limits, time limits, stacking and mutual exclusion, and so on.

## Data

### Scope of Incentives data collected

Aligning to our mission, the scope of the incentive data we have collected so far is representative of the following household types and technologies.

**Household Type:**

- Only Residential and Single-family households

**Technology (Appliances / Product):**

- Heat pumps (heating and cooling) HVAC (includes all types of heat pumps such as Air-to-water heat pumps, Ductless heat pumps, Ducted heat pumps, Air source heat pumps, Mini-split heat pumps)
- Geothermal / Ground Source Heat Pump
- Heat Pump Water Heater (HPWH)
- Electric Stoves / Induction Cooktop
- Heat Pump Dryers / Electric Clothes Dryer
- Electric Vehicles (new and used)
- Electric Vehicle chargers
- Rooftop Solar
- Battery Storage
- Weatherization (includes insulation, windows, and air sealing etc)
- Electric wiring (electric upgrades / retrofits)
- Electric panel (electric upgrades / retrofits)
- Electric lawn equipment (mower, edger, leaf blower, weed whacker)
- Smart Thermostat
- E-Bike

### Structure of the Incentives data

Refer to the [Incentive data model definition](https://docs.google.com/spreadsheets/d/1JTeTk9lhBxgCvpNDsU80upaxgp1XPROUpFwfK4UHVbI/edit?pli=1#gid=894925043) to understand our approach to standardize the incentive data structure across all 50 states.

This data model is undergoing continuous refinement as we gather more comprehensive information about nationwide incentive programs. Our goal is to iteratively enhance the model by incorporating additional data points that complement the current broad survey of incentive data, typically derived from the market needs.

## Contributing

:construction: **Our capacity to accept contributions is limited.** We're not currently set up for external contributions of new incentive data, though we're working towards it.

That said, there are two situations we consider to be serious bugs, of which we gladly welcome reports:

- **False positive eligibility results**. That is: the API returning an incentive with `eligible: true`, given a specific set of inputs that would make someone _ineligible_ for that incentive. If you see this, please file an issue.
- **Incorrect incentive information**. For example, if the calculator is showing the wrong amount for an incentive, or a description is inaccurate, or a link is broken, please file an issue.

In general, we know that our incentive coverage is _incomplete_, and we're working to change that. However, we expect the coverage we have to be _accurate_, and if it's not, we want to fix that as soon as possible.

We also welcome reports of bugs that don't pertain to incentive data, such as unexpected errors from the API. Please file issues for these.

For further information, including guidance on working on code, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Contact

See the [Contributing](#contributing) section for specific situations where we'd like you to file an issue.

For other matters, you can email us at `api@rewiringamerica.org`.

For FAQs, refer to the [IRA Calculator FAQ page](https://www.rewiringamerica.org/app/ira-calculator/faqs).
