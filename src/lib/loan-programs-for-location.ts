import { APILoanProgramsResponse } from '../schemas/v1/loan-programs';
import { ResolvedLocation } from './location';

export default function getLoanProgramsForLocation(
  location: ResolvedLocation,
  loan_programs: APILoanProgramsResponse,
): APILoanProgramsResponse {
  return loan_programs.filter(
    loan_program =>
      loan_program.state === location.state || loan_program.is_national,
  );
}
