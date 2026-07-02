/** Error carrying an HTTP status code; mapped to a JSON response by the error handler. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message = 'Bad Request') => new AppError(400, message);
export const paymentRequired = (message = 'Payment Required') => new AppError(402, message);
export const unauthorized = (message = 'Unauthorized') => new AppError(401, message);
export const forbidden = (message = 'Forbidden') => new AppError(403, message);
export const notFound = (message = 'Not Found') => new AppError(404, message);
export const conflict = (message = 'Conflict') => new AppError(409, message);
