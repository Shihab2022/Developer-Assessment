import { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../helpers/ApiError";

/**
 * Validates request body, query and params against a Zod schema.
 */
export const validate =
  (schema: z.ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body?: unknown;
        query?: Record<string, string>;
        params?: Record<string, string>;
      };
      // Only overwrite each part when the schema actually validated it;
      // otherwise params-only/query-only/body-only schemas would wipe the
      // data validated by earlier middleware (or merged parent params).
      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          configurable: true,
        });
      }
      if (parsed.params !== undefined) {
        Object.defineProperty(req, "params", {
          value: parsed.params,
          writable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
