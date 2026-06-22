import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  if (statusCode === 500) {
    console.error("Unhandled error:", err);
  }

  res.status(statusCode).json({ error: message });
}
