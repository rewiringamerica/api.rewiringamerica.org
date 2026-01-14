import AutoLoad from '@fastify/autoload';
import {
  FastifyInstance,
  FastifyRegisterOptions,
  RegisterOptions,
} from 'fastify';
import path from 'path';
import qs from 'qs';
import { ERROR_SCHEMA } from './schemas/error';
import { API_CALCULATOR_RESPONSE_SCHEMA } from './schemas/v1/calculator-endpoint';
import { API_INCENTIVE_SCHEMA } from './schemas/v1/incentive';
import { API_LOAN_PROGRAMS_RESPONSE_SCHEMA } from './schemas/v1/loan-programs';
import { API_PROGRAMS_RESPONSE_SCHEMA } from './schemas/v1/programs';

/**
 * Custom querystring decoding logic that parses comma-separated param values
 * into arrays.
 *
 * qs has an option to parse comma-separated param values as arrays, but there
 * are two problems with that, so we can't use it.
 *
 * - Zuplo percent-encodes commas (so if a client passes "a=b,c", Zuplo will
 *   send us "a=b%2Cc"), which suppresses qs's comma-separating behavior.
 *
 * - Not all fields should get this treatment. In particular, "address" may
 *   contain commas, but should never be parsed as an array.
 */
function querystringParser(str: string): { [key: string]: unknown } {
  // The query parameters whose values are arrays. (Unfortunately, we can't
  // discriminate by endpoint in this function, so the parsing logic will be
  // applied to params with these names on all endpoints.)
  const ARRAY_VALUED_KEYS = ['authority_types', 'items'];

  // The "decoder" function passed to qs.parse is invoked sequentially with keys
  // and values as they're encountered in the query string. Track the last key
  // we saw so we know when to parse an array.
  let lastKey: string | null = null;

  return qs.parse(str, {
    arrayLimit: Infinity,
    decoder: (str, defaultDecoder, charset, type) => {
      if (type === 'key') {
        lastKey = str;
      }

      if (type === 'value' && lastKey && ARRAY_VALUED_KEYS.includes(lastKey)) {
        // (?:) is a non-capturing group so we don't get the separators in the
        // array returned from split()
        return str
          .split(/(?:%2C|,)/i)
          .map(part => defaultDecoder(part, undefined, charset));
      }
      return defaultDecoder(str, undefined, charset);
    },
  });
}

// These are the options described here:
// https://fastify.dev/docs/latest/Reference/Server
export const options = {
  querystringParser,
  disableRequestLogging: true,
};

export default async function (
  fastify: FastifyInstance,
  opts: FastifyRegisterOptions<RegisterOptions>,
) {
  // Place here your custom code!

  // Add any schemas that are referred to by $id
  fastify.addSchema(ERROR_SCHEMA);
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
