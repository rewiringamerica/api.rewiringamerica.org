import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import {
  API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
  APILoanProgramsResponse,
} from '../schemas/v1/loan-programs';

const LOAN_PROGRAMS_JSON_SCHEMA = {
  ...API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
  items: {
    ...API_LOAN_PROGRAMS_RESPONSE_SCHEMA.items,
    // Conditional validations:
    // - If is_national is true, state must be null
    // - If is_national is false, state must not be null
    allOf: [
      {
        if: {
          properties: { is_national: { const: true } },
        },
        then: {
          properties: { state: { const: null } },
        },
      },
      {
        if: {
          properties: { is_national: { const: false } },
        },
        then: {
          properties: { state: { not: { const: null } } },
        },
      },
    ],
  },
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
// Compile the schema for validation
const validateLoanPrograms = ajv.compile(LOAN_PROGRAMS_JSON_SCHEMA);

const DATA_DIR = 'data';

export function parseLoanProgramJSON(): APILoanProgramsResponse {
  const filepath = `${DATA_DIR}/loan_programs.json`;

  if (!fs.existsSync(filepath)) {
    throw new Error('Loan programs data file not found');
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  // Validate the parsed data against the schema
  if (!validateLoanPrograms(data)) {
    const errors = ajv.errorsText(validateLoanPrograms.errors);
    throw new Error(`Validation errors: ${errors}`);
  }

  return data as APILoanProgramsResponse;
}
