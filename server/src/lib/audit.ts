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
        previousValue: (payload.previousValue as never) ?? null,
        newValue: (payload.newValue as never) ?? null,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      },
    });
  } catch {
    // Audit logging must never break the main request flow.
  }
};

/**
 * Writes many audit log entries in one insert. Used by bulk flows (e.g. inviting
 * hundreds of candidates) where a single `createMany` beats hundreds of round-trips.
 * Never throws — audit logging must never break the main flow.
 */
export const writeAuditLogs = async (payloads: AuditLogPayload[]): Promise<void> => {
  if (!payloads.length) return;
  try {
    await prisma.auditLog.createMany({
      data: payloads.map((payload) => ({
        actorId: payload.actorId ?? null,
        action: payload.action,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        previousValue: (payload.previousValue as never) ?? null,
        newValue: (payload.newValue as never) ?? null,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
      })),
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
