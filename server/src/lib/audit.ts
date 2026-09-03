import { prisma } from "./prisma";

export interface AuditLogPayload {
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Writes an audit log entry. Never store passwords, hashes or secrets here.
 */
export const writeAuditLog = async (payload: AuditLogPayload): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: payload.actorId ?? null,
        action: payload.action,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        previousValue: payload.previousValue as never ?? null,
        newValue: payload.newValue as never ?? null,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      },
    });
  } catch {
    // Audit logging must never break the main request flow.
  }
};

export const sanitizeForAudit = (value: unknown): unknown => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const obj = { ...(value as Record<string, unknown>) };
    delete obj.password;
    delete obj.tokenHash;
    return obj;
  }
  return value;
};