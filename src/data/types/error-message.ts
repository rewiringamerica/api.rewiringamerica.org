export const ERROR_MESSAGES_SCHEMA = {
  cannot_locate_address: { type: 'string' },
  no_data_for_location: { type: 'string' },
  zip_code_doesnt_exist: { type: 'string' },
} as const;

export type ErrorMessage = keyof typeof ERROR_MESSAGES_SCHEMA;

export const ALL_ERROR_MESSAGES = Object.keys(
  ERROR_MESSAGES_SCHEMA,
) as unknown as ErrorMessage[];
