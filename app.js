import fs from 'fs';
import path from 'path';
import AutoLoad from '@fastify/autoload';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pass --options via CLI arguments in command to enable these options.
export const options = {}

export default async function (fastify, opts) {
  // Place here your custom code!

  // TODO: glob everything under schemas so we're not hard-coding the website dir:
  const schemas = fs.readdirSync('./schemas/website');
  schemas.forEach(file => {
    const schemaPath = path.join('./schemas/website', file);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
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
