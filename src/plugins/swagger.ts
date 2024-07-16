import FastifySwagger from '@fastify/swagger';
import fp from 'fastify-plugin'; // the use of fastify-plugin is required to be able to export the decorators to the outer scope

const DESCRIPTION = `Rewiring America’s API offers comprehensive, up-to-date \
information about electrification incentive programs and eligibility.

We are actively developing the "v1" revision of this API. It currently powers \
our [incentives calculator](https://homes.rewiringamerica.org/calculator), \
and we aim for it to be suitable for inclusion in third-party applications.

The "v0" of this API is still available, but deprecated; we plan to remove it \
in the near future, and new applications should not use it.

**To generate an API key, click on the "Sign In" button. You can also use \
[this link](https://www.rewiringamerica.org/api) to sign up if needed**.

If you have feedback, or if you've stumbled across this page by accident and \
you'd like to learn more, reach out to us at \
[api@rewiringamerica.org](mailto:api@rewiringamerica.org).

Usage of the API is governed by our \
[API Terms of Service (PDF)](http://content.rewiringamerica.org/api/terms.pdf) \
(including our API Guidelines and Acceptable Use Policy) and our \
[Privacy Policy](https://content.rewiringamerica.org/view/privacy-policy.pdf).`;

export default fp(async function (fastify) {
  await fastify.register(FastifySwagger, {
    openapi: {
      info: {
        title: 'Rewiring America Incentives API',
        description: DESCRIPTION,
        version: '0.0.0',
      },
      externalDocs: {
        url: 'https://api.rewiringamerica.org/docs',
        description: 'API Documentation',
      },
    },
    refResolver: {
      buildLocalReference(json, baseUri, fragment, i) {
        return (json.$id as string) || `my-fragment-${i}`;
      },
    },
  });
});
