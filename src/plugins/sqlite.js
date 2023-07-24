import FastifySqlite from 'fastify-sqlite';
import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope

export default fp(async function (fastify) {
  await fastify.register(FastifySqlite, {
    promiseApi: true, // the DB instance supports the Promise API. Default false
    name: null, // optional decorator name. Default null
    verbose: false, // log sqlite3 queries as trace. Default false
    dbFile: './incentives-api.db', // select the database file. Default ':memory:'
    mode: FastifySqlite.sqlite3.OPEN_READONLY, // how to connecto to the DB, Default: OPEN_READWRITE | OPEN_CREATE | OPEN_FULLMUTEX
  });
});
