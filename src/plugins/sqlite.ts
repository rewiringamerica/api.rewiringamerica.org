import Database from 'better-sqlite3';
import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope

export default fp(function (fastify, _, next) {
  const db = new Database('./incentives-api.db', {
    readonly: true,
    fileMustExist: true,
  });

  fastify.decorate('sqlite', db);
  fastify.addHook('onClose', () => db.close());

  next();
});
