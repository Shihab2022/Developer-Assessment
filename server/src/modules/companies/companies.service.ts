import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { slugify } from "../../helpers/utils";
import { writeAuditLog } from "../../lib/audit";
import { CompanyMemberRole } from "../../../generated/prisma/enums";

export const getMembership = async (userId: string, companyId: string) => {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  });
};

const assertCompanyAccess = async (
  user: IAuthUser,
  companyId: string,
  allowRoles: CompanyMemberRole[] = [
    CompanyMemberRole.OWNER,
    CompanyMemberRole.ADMIN,
    CompanyMemberRole.MEMBER,
  ],
) => {
  if (user.role === "ADMIN") return;
  const membership = await getMembership(user.id, companyId);
  if (!membership) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this company",
    );
  }
  if (!allowRoles.includes(membership.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have the required permission for this company",
    );
  }
};

const create = async (
  payload: {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    industry?: string;
    location?: string;
    size?: string;
  },
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  let slug = slugify(payload.name);
  if (!slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Company name is invalid");
  }
  let uniqueSlug = slug;
  let counter = 1;
  for (;;) {
    const exists = await prisma.company.findUnique({
      where: { slug: uniqueSlug },
    });
    if (!exists) break;
    uniqueSlug = `${slug}-${counter++}`;
  }

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: payload.name,
        slug: uniqueSlug,
        logo: payload.logo,
        description: payload.description,
        website: payload.website,
        industry: payload.industry,
        location: payload.location,
        size: payload.size,
      },
    });
    await tx.companyMember.create({
      data: {
        companyId: created.id,
        userId: user.id,
        role: CompanyMemberRole.OWNER,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { companyId: created.id },
    });
    return created;
  });

  await writeAuditLog({
    actorId: user.id,
    action: "company.create",
    entityType: "Company",
    entityId: company.id,
    newValue: { name: company.name },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return company;
};const getById = async (id: string, user: IAuthUser) => {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true },
        where: { status: { not: "DELETED" } },
      },
      members: {
        select: { userId: true, role: true },
      },
    },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
  await assertCompanyAccess(user, company.id);
  return company;
};

const update = async (
  id: string,
  payload: Record<string, unknown>,
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  await assertCompanyAccess(user, id, [
    CompanyMemberRole.OWNER,
    CompanyMemberRole.ADMIN,
  ]);

  const data: Record<string, unknown> = {};
  for (const key of [
    "logo",
    "description",
    "website",
    "industry",
    "location",
    "size",
  ]) {
    if (payload[key] !== undefined) data[key] = payload[key];
  }
  if (payload.name !== undefined) {
    data.name = payload.name;
    if (company.name !== payload.name) {
      const newSlug = slugify(payload.name as string);
      let uniqueSlug = newSlug;
      let counter = 1;
      for (;;) {
        const exists = await prisma.company.findUnique({
          where: { slug: uniqueSlug },
        });
        if (!exists || exists.id === id) break;
        uniqueSlug = `${newSlug}-${counter++}`;
      }
      data.slug = uniqueSlug;
    }
  }

  const updated = await prisma.company.update({
    where: { id },
    data,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "company.update",
    entityType: "Company",
    entityId: id,
    previousValue: { name: company.name },
    newValue: data,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const remove = async (
  id: string,
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  await assertCompanyAccess(user, id, [CompanyMemberRole.OWNER]);

  const updated = await prisma.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "company.delete",
    entityType: "Company",
    entityId: id,
    previousValue: { name: company.name },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const getMembers = async (id: string, user: IAuthUser) => {
  await assertCompanyAccess(user, id);
  const members = await prisma.companyMember.findMany({
    where: { companyId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return members;
};

const list = async (q?: string, page = 1, limit = 10) => {
  const where = {
    deletedAt: null,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        industry: true,
        location: true,
        size: true,
        createdAt: true,
      },
    }),
  ]);
  return {
    data: companies,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const CompanyServices = {
  create,
  getById,
  update,
  remove,
  getMembers,
  list,
  assertCompanyAccess,
};