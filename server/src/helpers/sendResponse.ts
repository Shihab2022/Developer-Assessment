import { Response } from "express";
import { PaginationMeta } from "../types";

export interface SendResponseOptions<T> {
  statusCode: number;
  message: string;
  meta?: PaginationMeta;
  data?: T | null;
}

const sendResponse = <T>(res: Response, options: SendResponseOptions<T>) => {
  const { statusCode, message, meta, data } = options;
  const body: Record<string, unknown> = {
    success: statusCode < 400,
    message,
  };
  if (meta) body.meta = meta;
  body.data = data ?? null;
  res.status(statusCode).json(body);
};

export default sendResponse;