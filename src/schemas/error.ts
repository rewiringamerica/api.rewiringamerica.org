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
    },
    error: {
      type: 'string',
    },
    message: {
      type: 'string',
    },
    field: {
      type: 'string',
      description:
        'If the error was related to a specific field in the request, it will be specified here.',
    },
  },
} as const;
