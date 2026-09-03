import { Request, Response } from "express";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
};

export const testingRoute = (_req: Request, res: Response) => {
  res.send({
    message: "Welcome to the Developer Assessment & Coding Platform API",
  });
};
