export interface AuditLogRow { id: string; createdAt: string; actorUserId: string | null; actorName: string; action: string; entityType: string; entityId: string | null; details: Record<string, string | number> }
export interface AuditPage { rows: AuditLogRow[]; total: number; page: number; pageSize: number }
