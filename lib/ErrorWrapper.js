/**
 * message: string;
 * options: {
 *  status?: number;
 *  field?: 'zip' | 'owner_status' | 'household_income' | 'tax_filing' | 'household_size';
 * }
 */
export default class ErrorWrapper extends Error {
  constructor(message, options) {
    super(message);
    this.message = message;
    this.status = options.status || 500;
    this.field = options.field || "generic";
  }
}