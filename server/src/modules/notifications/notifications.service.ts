import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";

const list = async (user: IAuthUser, query: { page?: number; limit?: number; status?: string }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const where: Record<string, unknown> = { userId: user.id };
  if (query.status) where.status = query.status;
  const [total, data] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const markAsRead = async (user: IAuthUser, notificationId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (notification === null) throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  if (notification.userId !== user.id) throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
  return prisma.notification.update({ where: { id: notificationId }, data: { status: "READ", readAt: new Date() } });
};

const markAllAsRead = async (user: IAuthUser) => {
  const result = await prisma.notification.updateMany({ where: { userId: user.id, status: "UNREAD" }, data: { status: "READ", readAt: new Date() } });
  return { updated: result.count };
};

const getUnreadCount = async (user: IAuthUser) => {
  const count = await prisma.notification.count({ where: { userId: user.id, status: "UNREAD" } });
  return { unreadCount: count };
};

export const NotificationServices = { list, markAsRead, markAllAsRead, getUnreadCount };
