import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { IAuthUser, RegisterUserPayload } from "../../types";
import config from "../../config";
import { UserStatus } from "../../../generated/prisma/enums";
import { generateJwtToken } from "../../helpers/jwtHelpers";
import ApiError from "../../helpers/ApiError";
import httpStatus from "http-status";
import { createToken } from "../../utils/auth";
// import { formatHtml } from "../../utils/formatHtml";
import crypto from "crypto";
const register = async (payload: RegisterUserPayload) => {
  const { email, password, name, role, phone, address } = payload;

  // Validate if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  // Dynamic database payload construction based on role choice
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      phone,
      address,
      technicianProfile:
        role === "TECHNICIAN"
          ? { create: { experience: 0, skills: [] } }
          : undefined,
    },
    include: {
      technicianProfile: true,
    },
  });
  const jwtPayload = {
    id: user.id,
    role: user.role,
    name: user.name,
  };
  const token = createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expire_in,
  );
  //   const html = await formatHtml("src/templates/confirmAccount.ejs", {
  //     name: name,
  //     url: `${config?.front_end_base_url}/confirm?token=${token}`,
  //     baseUrl: config?.front_end_base_url as string,
  //     year: new Date().getFullYear(),
  //   });
  // 🔹 Email
  //   const notifyMsg = {
  //     to: [email],
  //     from: `"FixItNow" <${config.smtp.user_name}>`,
  //     subject: emailSenderMessages.WELCOME_EMAIL_SUBJECT,
  //     replyTo: config.smtp.user_name,
  //     text: emailSenderMessages.CONFIRM_EMAIL_MESSAGE,
  //     html,
  //     // attachments,
  //   };

  //   await transporter.sendMail(notifyMsg);
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const login = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  if (user.status === UserStatus.BANNED) {
    throw new Error("Your account has been blocked. Please contact support.");
  }

  const isPasswordCorrect = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordCorrect) {
    throw new Error("Password is not correct!");
  }
  const tokenData: IAuthUser = {
    id: user?.id,
    role: user.role,
    name: user.name,
  };
  const accessToken = generateJwtToken(
    tokenData,
    config.jwt_access_secret,
    config.jwt_access_expire_in,
  );
  const refreshToken = generateJwtToken(
    tokenData,
    config.jwt_refresh_secret,
    config.jwt_refresh_expire_in,
  );

  return { accessToken, refreshToken };
};

const getMe = async (user: IAuthUser) => {
  if (!user) {
    throw new Error("User not found");
  }
  const reUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      technicianProfile: true, // Will cleanly return data for techs, or null for customers/admins
    },
  });

  if (!reUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const { password: _, ...userWithoutPassword } = reUser;
  return userWithoutPassword;
};
const updateMe = async (user: IAuthUser, payload: Partial<IAuthUser>) => {
  if (!user) {
    throw new Error("User not found");
  }

  const updateData: any = Object.fromEntries(
    Object.entries(payload as Record<string, any>).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  ) as any;
  const reUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  const { password: _, ...userWithoutPassword } = reUser;
  return userWithoutPassword;
};
const forgetPassword = async (payload: { email: string }) => {
  const { email } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  // const hashedPassword = await bcrypt.hash(
  //   password,
  //   Number(config.bcrypt_salt_rounds),
  // );
  // const updatedUser = await prisma.user.update({
  //   where: { email },
  //   data: { password: hashedPassword },
  // });
  const jwtPayload = {
    id: user.id,
    role: user.role,
  };
  const token = createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expire_in,
  );
  const pin = crypto.randomInt(100000, 999999).toString();
  //   const html = await formatHtml("src/templates/forgotPassword.ejs", {
  //     name: user.name,
  //     url: `${config?.front_end_base_url}/reset-password?token=${token}`,
  //     baseUrl: config?.front_end_base_url as string,
  //     pin: pin,
  //     year: new Date().getFullYear(),
  //   });

  // 🔹 Email
  //   const notifyMsg = {
  //     to: [email],
  //     from: `"FixItNow" <${config.smtp.user_name}>`,
  //     subject: emailSenderMessages.FORGET_PASSWORD_SUBJECT,
  //     replyTo: config.smtp.user_name,
  //     text: emailSenderMessages.FORGET_PASSWORD_MESSAGE,
  //     html,
  //   };

  //   await transporter.sendMail(notifyMsg);
  return null;
};
const updatePassword = async (payload: { email: string }) => {
  const { email } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  // const hashedPassword = await bcrypt.hash(
  //   password,
  //   Number(config.bcrypt_salt_rounds),
  // );
  // const updatedUser = await prisma.user.update({
  //   where: { email },
  //   data: { password: hashedPassword },
  // });
  //   const html = await formatHtml("src/templates/passwordResetSuccess.ejs", {
  //     name: user.name,
  //     loginUrl: `${config?.front_end_base_url}/login`,
  //     baseUrl: config?.front_end_base_url as string,
  //   });

  // 🔹 Email
  //   const notifyMsg = {
  //     to: [email],
  //     from: `"FixItNow" <${config.smtp.user_name}>`,
  //     subject: emailSenderMessages.PASSWORD_RESET_SUCCESS_SUBJECT,
  //     replyTo: config.smtp.user_name,
  //     text: emailSenderMessages.PASSWORD_RESET_SUCCESS_MESSAGE,
  //     html,
  //   };

  //   await transporter.sendMail(notifyMsg);
  return null;
};
const resetPassword = async (payload: { email: string }) => {
  const { email } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  // const hashedPassword = await bcrypt.hash(
  //   password,
  //   Number(config.bcrypt_salt_rounds),
  // );
  // const updatedUser = await prisma.user.update({
  //   where: { email },
  //   data: { password: hashedPassword },
  // });
  //   const html = await formatHtml("src/templates/passwordResetSuccess.ejs", {
  //     name: user.name,
  //     loginUrl: `${config?.front_end_base_url}/login`,
  //     baseUrl: config?.front_end_base_url as string,
  //   });

  // 🔹 Email
  //   const notifyMsg = {
  //     to: [email],
  //     from: `"FixItNow" <${config.smtp.user_name}>`,
  //     subject: emailSenderMessages.PASSWORD_RESET_SUCCESS_SUBJECT,
  //     replyTo: config.smtp.user_name,
  //     text: emailSenderMessages.PASSWORD_RESET_SUCCESS_MESSAGE,
  //     html,
  //   };

  //   await transporter.sendMail(notifyMsg);
  return null;
};

export const AuthServices = {
  register,
  login,
  getMe,
  updateMe,
  forgetPassword,
  updatePassword,
  resetPassword,
};
