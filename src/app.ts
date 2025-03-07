import AutoLoad from '@fastify/autoload';
import {
  FastifyInstance,
  FastifyRegisterOptions,
  RegisterOptions,
} from 'fastify';
import path from 'path';
import qs from 'qs';
import { ERROR_SCHEMA } from './schemas/error';
import { WEBSITE_CALCULATOR_RESPONSE_SCHEMA } from './schemas/v0/calculator-response';
import { WEBSITE_INCENTIVE_SCHEMA } from './schemas/v0/incentive';
import { API_CALCULATOR_RESPONSE_SCHEMA } from './schemas/v1/calculator-endpoint';
import { API_INCENTIVE_SCHEMA } from './schemas/v1/incentive';
import { API_LOAN_PROGRAMS_RESPONSE_SCHEMA } from './schemas/v1/loan-programs';
import { API_PROGRAMS_RESPONSE_SCHEMA } from './schemas/v1/programs';

// These are the options described here:
// https://fastify.dev/docs/latest/Reference/Server
export const options = {
  querystringParser: (str: string) => qs.parse(str, { comma: true }),
  disableRequestLogging: true,
};

export default async function (
  fastify: FastifyInstance,
  opts: FastifyRegisterOptions<RegisterOptions>,
) {
  // Place here your custom code!

  // Add any schemas that are referred to by $id
  fastify.addSchema(ERROR_SCHEMA);
  fastify.addSchema(WEBSITE_INCENTIVE_SCHEMA);
  fastify.addSchema(WEBSITE_CALCULATOR_RESPONSE_SCHEMA);
  fastify.addSchema(API_INCENTIVE_SCHEMA);
  fastify.addSchema(API_CALCULATOR_RESPONSE_SCHEMA);
  fastify.addSchema(API_PROGRAMS_RESPONSE_SCHEMA);
  fastify.addSchema(API_LOAN_PROGRAMS_RESPONSE_SCHEMA);

  // Replace Fastify's default request-start logging, to include more structured
  // info about the request, including the API consumer's identity
  fastify.addHook('onRequest', (req, reply, done) => {
    req.log.info(
      {
        consumer: req.headers['x-zuplo-consumer'],
        origin: req.headers.origin,
        params: req.query,
        path: req.routeOptions.url,
      },
      'incoming request',
    );
    done();
  });

  // Equivalent to Fastify's default request-end logging
  fastify.addHook('onResponse', (req, reply, done) => {
    req.log.info(
      { res: reply, responseTime: reply.elapsedTime },
      'request completed',
    );
    done();
  });

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts),
  });
}
