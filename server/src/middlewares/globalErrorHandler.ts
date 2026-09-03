import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { ApiError } from "../helpers/ApiError";
import config from "../config";

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errors: { field: string; message: string }[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof z.ZodError) {
    statusCode = httpStatus.UNPROCESSABLE_ENTITY;
    message = "Validation failed";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = httpStatus.CONFLICT;
        message = "A record with this value already exists.";
        break;
      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "Record not found.";
        break;
      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Related record does not exist.";
        break;
      case "P2034":
        statusCode = httpStatus.CONFLICT;
        message = "Concurrent modification detected. Please retry.";
        break;
      default:
        statusCode = httpStatus.BAD_REQUEST;
        message = "Database operation failed.";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid data provided for database operation.";
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.SERVICE_UNAVAILABLE;
    message = "Database service is unavailable.";
  } else if (
    err instanceof TypeError &&
    (err as Error & { name?: string }).name === "JsonWebTokenError"
  ) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid token.";
  } else if (
    err instanceof Error &&
    (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
  ) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = err.name === "TokenExpiredError" ? "Token expired." : "Invalid token.";
  } else if (err instanceof SyntaxError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid JSON payload.";
  } else if (err instanceof Error) {
    message = err.message;
    statusCode = httpStatus.BAD_REQUEST;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors ?? [],
    ...(config.node_env === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};
