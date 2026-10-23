export class ApiError extends Error {
  constructor(message: string, public status = 500, public code = 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
  }
}
