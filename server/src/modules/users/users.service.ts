import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  phone: true,
  bio: true,
  skills: true,
  experience: true,
  education: true,
  profileImageUrl: true,
  resumeUrl: true,
  jobTitle: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const updateMe = async (user: IAuthUser, payload: Record<string, unknown>) => {
  const data: Record<string, unknown> = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.phone !== undefined) data.phone = payload.phone;
  if (payload.bio !== undefined) data.bio = payload.bio;
  if (payload.skills !== undefined) data.skills = payload.skills;
  if (payload.experience !== undefined) data.experience = payload.experience;
  if (payload.education !== undefined) data.education = payload.education;
  if (payload.profileImageUrl !== undefined)
    data.profileImageUrl = payload.profileImageUrl;
  if (payload.resumeUrl !== undefined) data.resumeUrl = payload.resumeUrl;
  if (payload.jobTitle !== undefined) data.jobTitle = payload.jobTitle;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: safeUserSelect,
  });
  return updated;
};

const changePassword = async (
  user: IAuthUser,
  payload: { currentPassword: string; newPassword: string },
) => {
  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (!current) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const match = await bcrypt.compare(payload.currentPassword, current.password);
  if (!match) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  }
  if (payload.currentPassword === payload.newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password must be different from the current password",
    );
  }
  const hashed = await bcrypt.hash(payload.newPassword, config.bcrypt_salt_rounds);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
  return null;
};

const getActivity = async (user: IAuthUser) => {
  const logs = await prisma.auditLog.findMany({
    where: { actorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      newValue: true,
      ipAddress: true,
      createdAt: true,
    },
  });
  return logs;
};

export const UserServices = {
  updateMe,
  changePassword,
  getActivity,
};
