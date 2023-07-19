import FastifySensible from '@fastify/sensible';
import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope

export default fp(async function (fastify) {
  await fastify.register(FastifySensible);
});
