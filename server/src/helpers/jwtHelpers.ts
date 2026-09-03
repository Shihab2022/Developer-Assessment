import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export const generateJwtToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn?: string | number,
): string => {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyJwtToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};