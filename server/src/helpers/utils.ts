import crypto from "crypto";

export const paginate = (page?: number, limit?: number) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip, take: safeLimit };
};

export const buildPaginationMeta = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Friendly, shareable company join code, e.g. `TECHCOR-4F2A19`.
 * Recruiters use this instead of the raw company UUID when registering.
 */
export const generateCompanyCode = (name: string): string => {
  const base = slugify(name).replace(/-/g, "").slice(0, 6).toUpperCase() || "COMPANY";
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${base}-${random}`;
};
