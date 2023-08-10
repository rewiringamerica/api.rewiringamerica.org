/**
 * Thrown from incentive calculation upon seeing input that shouldn't be
 * possible at that layer, because it should have been caught upstream (such as
 * by Fastify request schema validation).
 */
export class UnexpectedInputError extends Error {}

/**
 * Thrown from incentive calculation upon seeing input that is not what the API
 * requires, and that is NOT expected to be caught upstream.
 */
export class InvalidInputError extends Error {}
