import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import ApiError from "../helpars/ApiError";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode;
  let message = "Internal Server Error";
  let errorName = err.name || "Error";

  /**
   * Custom Api Error
   */
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    /**
     * Prisma Errors
     */
    switch (err.code) {
      case "P2000":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Input value is too long for the column.";
        break;

      case "P2001":
        statusCode = httpStatus.NOT_FOUND;
        message = "Record does not exist.";
        break;

      case "P2002":
        statusCode = httpStatus.CONFLICT;
        message = "Duplicate value. Record already exists.";
        break;

      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed.";
        break;

      case "P2004":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Database constraint failed.";
        break;

      case "P2005":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Invalid value stored in database.";
        break;

      case "P2006":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Invalid input value.";
        break;

      case "P2007":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Data validation error.";
        break;

      case "P2008":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Query parsing failed.";
        break;

      case "P2009":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Query validation failed.";
        break;

      case "P2010":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Raw query failed.";
        break;

      case "P2011":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Null constraint violation.";
        break;

      case "P2012":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Missing required value.";
        break;

      case "P2013":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Missing required argument.";
        break;

      case "P2014":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Relation violation.";
        break;

      case "P2015":
        statusCode = httpStatus.NOT_FOUND;
        message = "Related record not found.";
        break;

      case "P2016":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Query interpretation error.";
        break;

      case "P2017":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Records are not connected.";
        break;

      case "P2018":
        statusCode = httpStatus.NOT_FOUND;
        message = "Required connected records not found.";
        break;

      case "P2019":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Input error.";
        break;

      case "P2020":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Value out of range.";
        break;

      case "P2021":
        statusCode = httpStatus.NOT_FOUND;
        message = "Table does not exist.";
        break;

      case "P2022":
        statusCode = httpStatus.NOT_FOUND;
        message = "Column does not exist.";
        break;

      case "P2023":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Inconsistent column data.";
        break;

      case "P2024":
        statusCode = httpStatus.REQUEST_TIMEOUT;
        message = "Database connection timeout.";
        break;

      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "Requested record not found.";
        break;

      case "P2026":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Unsupported feature.";
        break;

      case "P2027":
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = "Multiple database errors occurred.";
        break;

      case "P2028":
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = "Transaction failed.";
        break;

      case "P2030":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Full-text index not found.";
        break;

      case "P2033":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Number does not fit into 64-bit integer.";
        break;

      case "P2034":
        statusCode = httpStatus.CONFLICT;
        message = "Transaction conflict. Please retry.";
        break;

      default:
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = err.message;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed. Invalid or missing fields.";
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    switch (err.errorCode) {
      case "P1000":
        statusCode = httpStatus.UNAUTHORIZED;
        message = "Database authentication failed.";
        break;

      case "P1001":
        statusCode = httpStatus.SERVICE_UNAVAILABLE;
        message = "Cannot connect to database.";
        break;

      case "P1002":
        statusCode = httpStatus.REQUEST_TIMEOUT;
        message = "Database connection timed out.";
        break;

      case "P1008":
        statusCode = httpStatus.REQUEST_TIMEOUT;
        message = "Database operation timed out.";
        break;

      default:
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = err.message;
    }
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Prisma engine crashed.";
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Unknown database error.";
  } else if (err.name === "JsonWebTokenError") {
    /**
     * JWT Errors
     */
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid token.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Token expired.";
  } else if (err.name === "NotBeforeError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Token not active.";
  } else if (err.name === "MulterError") {
    /**
     * Multer
     */
    statusCode = httpStatus.BAD_REQUEST;
    message = err.message;
  } else if (err.name === "ZodError") {
    /**
     * Zod
     */
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed.";
  } else if (err instanceof SyntaxError) {
    /**
     * Syntax Error
     */
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid JSON.";
  } else if (err instanceof Error) {
    /**
     * Normal JS Error
     */
    statusCode = httpStatus.BAD_REQUEST;
    message = err.message;
  }

  res.status(statusCode as number).json({
    success: false,
    statusCode,
    name: errorName,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
