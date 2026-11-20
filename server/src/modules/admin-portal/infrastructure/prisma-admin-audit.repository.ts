import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminAuditFilter, AdminAuditRepository } from "../domain/admin-audit.repository.js";

const safeDetailKeys = new Set(["status", "previousStatus", "decision", "permissionCount"]);
export function safeAuditDetails(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => safeDetailKeys.has(key) && (typeof item === "string" || (typeof item === "number" && Number.isFinite(item))) ? [[key, typeof item === "string" ? item.slice(0, 100) : item]] : []));
}
export class PrismaAdminAuditRepository implements AdminAuditRepository {
  async list(filter: AdminAuditFilter) {
    const where = { createdAt: { gte: filter.dateFrom, ...(filter.dateTo ? { lte: filter.dateTo } : {}) }, ...(filter.actorUserId ? { actorUserId: filter.actorUserId } : {}), ...(filter.action ? { action: { contains: filter.action, mode: "insensitive" as const } } : {}), ...(filter.entityType ? { entityType: { contains: filter.entityType, mode: "insensitive" as const } } : {}), ...(filter.search ? { OR: [{ action: { contains: filter.search, mode: "insensitive" as const } }, { entityType: { contains: filter.search, mode: "insensitive" as const } }, { entityId: { contains: filter.search, mode: "insensitive" as const } }] } : {}) };
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where, select: { id: true, actorUserId: true, action: true, entityType: true, entityId: true, details: true, createdAt: true, actor: { select: { firstName: true, lastName: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize }),
    ]);
    return { rows: logs.map((log) => ({ id: log.id, createdAt: log.createdAt.toISOString(), actorUserId: log.actorUserId, actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}`.trim() : "Former user", action: log.action, entityType: log.entityType, entityId: log.entityId, details: safeAuditDetails(log.details) })), total, page: filter.page, pageSize: filter.pageSize };
  }
  async actors() {
    const rows = await prisma.auditLog.findMany({ where: { actorUserId: { not: null }, createdAt: { gte: new Date(Date.now() - 90 * 86400000) } }, distinct: ["actorUserId"], select: { actorUserId: true, actor: { select: { firstName: true, lastName: true } } }, orderBy: { actorUserId: "asc" }, take: 200 });
    return rows.flatMap((row) => row.actorUserId && row.actor ? [{ id: row.actorUserId, name: `${row.actor.firstName} ${row.actor.lastName}`.trim() }] : []);
  }
}
