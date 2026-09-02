import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export const generateJwtToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions,
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);

  return token;
};

export const verifyJwtToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
