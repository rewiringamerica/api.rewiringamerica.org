import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope
import spatialite from 'spatialite';
import { open } from 'sqlite';

export default fp(async function (fastify, _) {
  const db = await open({
    filename: './incentives-api.db',
    driver: spatialite.Database
  });
  fastify.decorate('sqlite', db);

  // FIXME: we probably need a .close() here somewhere - check what fastify-sqlite does
  // TODO: maybe a PR on fastify-sqlite to accept driver as a parameter?
});
