export const ERROR_SCHEMA = {
  $id: 'Error',
  title: 'Error',
  type: 'object',
  required: [
    'statusCode',
    'error',
    'message',
  ],
  properties: {
    statusCode: {
      type: 'integer',
      examples: [
        400,
        404,
      ],
    },
    error: {
      type: 'string',
      examples: [
        'Not Found',
      ],
    },
    message: {
      type: 'string',
      examples: [
        'Route GET:/ not found',
      ],
    },
    field: {
      type: 'string',
      description:
        'If the error was related to a specific field in the request, it will be specified here.',
      examples: [
        'zip',
        'owner_status',
      ],
    },
  },
  examples: [
    {
      message: 'Route GET:/ not found',
      error: 'Not Found',
      statusCode: 404,
    },
  ],
} as const;
