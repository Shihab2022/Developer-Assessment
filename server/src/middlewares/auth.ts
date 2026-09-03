import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { UnauthorizedError } from "../helpers/ApiError";
import config from "../config";
import { verifyJwtToken } from "../helpers/jwtHelpers";
import { IAuthUser } from "../types";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: IAuthUser;
}

/**
 * Authentication + role authorization middleware.
 * Expects `Authorization: Bearer <accessToken>`.
 */
const auth = (...roles: Array<"CANDIDATE" | "RECRUITER" | "ADMIN">) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
      if (!token) {
        throw new UnauthorizedError("Access token is required");
      }

      const payload = verifyJwtToken(token, config.jwt.access_secret);

      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          companyId: true,
        },
      });

      if (!user || user.status === "DELETED") {
        throw new UnauthorizedError("User no longer exists");
      }
      if (user.status === "SUSPENDED") {
        throw new UnauthorizedError("Your account has been suspended");
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new UnauthorizedError(
          "You do not have permission to access this resource",
        );
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId ?? undefined,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (token) {
      const payload = verifyJwtToken(token, config.jwt.access_secret);
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { id: true, email: true, name: true, role: true, status: true, companyId: true },
      });
      if (user && user.status === "ACTIVE") {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId ?? undefined,
        };
      }
    }
    next();
  } catch {
    next();
  }
};

export default auth;