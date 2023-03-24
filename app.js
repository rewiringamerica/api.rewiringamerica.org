import fs from 'fs';
import path from 'path';
import glob from 'glob';
import AutoLoad from '@fastify/autoload';
import { fileURLToPath } from 'url';
import qs from 'qs';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pass --options via CLI arguments in command to enable these options.
export const options = {
  querystringParser: str => qs.parse(str, { allowDots: true })
};

export default async function (fastify, opts) {
  // Place here your custom code!

  // This is for loading all of our request/response schemas automatically:
  const schemas = glob.sync('./schemas/**/*.json');
  schemas.forEach(file => {
    const data = fs.readFileSync(file, 'utf-8');
    const schema = JSON.parse(data);
    fastify.addSchema(schema);
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
