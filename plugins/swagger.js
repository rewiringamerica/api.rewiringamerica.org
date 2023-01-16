import FastifySwagger from "@fastify/swagger";
import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope

export default fp(async function (fastify, _) {
  await fastify.register(FastifySwagger, {
    openapi: {
      info: {
        title: 'Rewiring America Incentives API',
        description: 'Query federal electrification incentives.',
        version: '0.0.0'
      },
      externalDocs: {
        url: 'https://www.rewiringamerica.org/app/ira-calculator',
        description: 'IRA Savings Calculator'
      },
    },
    refResolver: {
      buildLocalReference(json, baseUri, fragment, i) {
        return json.$id || `my-fragment-${i}`
      }
    }
  });
});