import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import {
  API_LOAN_PROGRAMS_RESPONSE_SCHEMA,
  APILoanProgramsResponse,
} from '../schemas/v1/loan-programs';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
// Compile the schema for validation
const validateLoanPrograms = ajv.compile(API_LOAN_PROGRAMS_RESPONSE_SCHEMA);

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
