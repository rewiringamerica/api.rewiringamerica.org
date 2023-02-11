import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope
import Database from 'better-sqlite3';

export default fp(async function (fastify, _) {
  const db = new Database('./incentives-api.db', { readonly: true });

  db.loadExtension(process.env.SPATIALITE_EXTENSION_PATH);

  // expose this to other plugins/routes:
  fastify.decorate('sqlite', db);

  // FIXME: go back to fastify-sqlite now that we're using loadExtension again
});
