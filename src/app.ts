import path from 'path';
import AutoLoad from '@fastify/autoload';
import { fileURLToPath } from 'url';
import qs from 'qs';
import {
  FastifyInstance,
  FastifyRegisterOptions,
  RegisterOptions,
} from 'fastify';
import {
  API_CALCULATOR_REQUEST_SCHEMA,
  API_CALCULATOR_RESPONSE_SCHEMA,
} from './schemas/v1/calculator-endpoint.js';
import { API_INCENTIVE_SCHEMA } from './schemas/v1/incentive.js';
import { ERROR_SCHEMA } from './schemas/error.js';
import { WEBSITE_CALCULATOR_REQUEST_SCHEMA } from './schemas/v0/calculator-request.js';
import { WEBSITE_CALCULATOR_RESPONSE_SCHEMA } from './schemas/v0/calculator-response.js';
import { WEBSITE_INCENTIVE_SCHEMA } from './schemas/v0/incentive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pass --options via CLI arguments in command to enable these options.
export const options = {
  querystringParser: (str: string) => qs.parse(str, { allowDots: true }),
};

export default async function (
  fastify: FastifyInstance,
  opts: FastifyRegisterOptions<RegisterOptions>,
) {
  // Place here your custom code!

  // Add any schemas that are referred to by $id
  fastify.addSchema(ERROR_SCHEMA);
  fastify.addSchema(WEBSITE_INCENTIVE_SCHEMA);
  fastify.addSchema(WEBSITE_CALCULATOR_REQUEST_SCHEMA);
  fastify.addSchema(WEBSITE_CALCULATOR_RESPONSE_SCHEMA);
  fastify.addSchema(API_INCENTIVE_SCHEMA);
  fastify.addSchema(API_CALCULATOR_REQUEST_SCHEMA);
  fastify.addSchema(API_CALCULATOR_RESPONSE_SCHEMA);

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    forceESM: true,
    options: Object.assign({}, opts),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    forceESM: true,
    options: Object.assign({}, opts),
  });
}
