import FastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async function (fastify) {
  if (process.env.NODE_ENV !== 'production') {
    await fastify.register(FastifyCors, {
      origin: true,
    });
  }
});
