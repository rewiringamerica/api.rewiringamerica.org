// This file contains code that we reuse
// between our tests.

import helper from 'fastify-cli/helper.js';
import path from 'path';

const AppPath = path.join(__dirname, '..', 'src', 'app.ts');

// Fill in this config with all the configurations
// needed for testing the application
function config() {
  return {};
}

// automatically build and tear down our instance
async function build(t: Tap.Test) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath, '--options'];

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await helper.build(argv, config());

  // tear down our app after we are done
  t.teardown(app.close.bind(app));

  return app;
}

export { config, build };
