export type AdminAccountStatus = "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export interface AdminUserFilter { search?: string; roleId?: string; status?: AdminAccountStatus; page: number; pageSize: number }
export interface AdminUserRow { id: string; firstName: string; lastName: string; email: string; role: { id: string; name: string }; status: AdminAccountStatus; createdAt: string; lastLoginAt: string | null; membershipNo: string | null; hasProfilePhoto: boolean }
export interface AdminRole { id: string; name: string; description: string | null; permissions: Array<{ id: string; code: string; description: string | null }>; userCount: number }
export interface AdminUsersRepository {
  list(filter: AdminUserFilter): Promise<{ summary: { totalUsers: number; roles: number; newUsers: number; inactiveUsers: number }; rows: AdminUserRow[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<unknown | null>;
  getPhoto(id: string): Promise<{ contentType: string; data: Uint8Array } | null>;
  transition(id: string, status: "ACTIVE" | "SUSPENDED", actorId: string): Promise<boolean>;
  roles(): Promise<AdminRole[]>;
  assignableRoles(actorRole: string): Promise<Array<{ id: string; name: string }>>;
  filterRoles(): Promise<Array<{ id: string; name: string }>>;
  permissionCatalog(): Promise<Array<{ id: string; code: string; description: string | null }>>;
  assignRole(id: string, roleId: string, actorId: string): Promise<boolean>;
  updateRolePermissions(roleId: string, permissionIds: string[], actorId: string): Promise<AdminRole | null>;
}
