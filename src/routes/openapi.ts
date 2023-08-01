import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/spec.json', { schema: { hide: true } }, (_, reply) => {
    const spec = fastify.swagger();
    reply.status(200).type('application/json').send(spec);
  });

  fastify.get('/spec.yaml', { schema: { hide: true } }, (_, reply) => {
    const spec = fastify.swagger({ yaml: true });
    reply.status(200).type('text/x-yaml').send(spec);
  });
}
