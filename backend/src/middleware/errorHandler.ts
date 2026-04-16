import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/index';

export function errorHandler(
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = (err as ApiError).statusCode ?? 500;
  const code = (err as ApiError).code ?? 'INTERNAL_ERROR';

  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  console.error(
    `[${new Date().toISOString()}] ${statusCode} ${code}: ${err.message}`,
    statusCode === 500 ? err.stack : ''
  );

  res.status(statusCode).json({ error: message, code });
}

export function createError(message: string, statusCode: number, code?: string): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
