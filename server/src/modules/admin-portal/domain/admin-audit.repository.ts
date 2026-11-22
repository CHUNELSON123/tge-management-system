export interface AdminAuditFilter { dateFrom: Date; dateTo?: Date; actorUserId?: string; action?: string; entityType?: string; search?: string; page: number; pageSize: number }
export interface AdminAuditRepository {
  list(filter: AdminAuditFilter): Promise<{ rows: Array<{ id: string; createdAt: string; actorUserId: string | null; actorName: string; action: string; entityType: string; entityId: string | null; details: Record<string, string | number> }>; total: number; page: number; pageSize: number }>;
  actors(): Promise<Array<{ id: string; name: string }>>;
}
