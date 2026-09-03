import httpStatus from "http-status";

export class ApiError extends Error {
  statusCode: number;
  errors?: { field: string; message: string }[];

  constructor(
    statusCode: number,
    message: string,
    errors?: { field: string; message: string }[],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(httpStatus.BAD_REQUEST, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "You are not authorized") {
    super(httpStatus.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "You do not have permission to perform this action") {
    super(httpStatus.FORBIDDEN, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(httpStatus.NOT_FOUND, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists or conflicts with existing data") {
    super(httpStatus.CONFLICT, message);
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = "Validation failed",
    errors?: { field: string; message: string }[],
  ) {
    super(httpStatus.UNPROCESSABLE_ENTITY, message, errors);
  }
}

export default ApiError;