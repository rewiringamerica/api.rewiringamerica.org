import { FastifyInstance } from 'fastify';

const CalculatorSchema = {
  summary: '(Deprecated) Find eligible incentives',
  deprecated: true,
  operationId: 'calculator-get',
  response: {
    400: {
      $ref: 'Error',
    },
  },
} as const;

const IncentivesSchema = {
  summary: '(Deprecated) List all incentives',
  deprecated: true,
  operationId: 'incentives-get',
  response: {
    400: {
      $ref: 'Error',
    },
  },
} as const;

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/v0/calculator', { schema: CalculatorSchema }, async () => {
    throw fastify.httpErrors.createError(
      400,
      'This endpoint no longer exists.',
    );
  });

  fastify.get('/api/v0/incentives', { schema: IncentivesSchema }, async () => {
    throw fastify.httpErrors.createError(
      400,
      'This endpoint no longer exists.',
    );
  });
}
