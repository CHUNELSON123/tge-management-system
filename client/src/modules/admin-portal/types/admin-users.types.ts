export type AccountStatus = "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export interface AdminUserRow { id: string; firstName: string; lastName: string; email: string; role: { id: string; name: string }; status: AccountStatus; createdAt: string; lastLoginAt: string | null; membershipNo: string | null; hasProfilePhoto: boolean }
export interface AdminUserDetail extends AdminUserRow { phone: string | null; location: string | null; emailVerifiedAt: string | null; updatedAt: string; hasProfilePhoto: boolean; permissions: Array<{ code: string; description: string | null }>; recentActivity: Array<{ id: string; action: string; entityType: string; entityId: string | null; createdAt: string }> }
export interface AdminUsersList { summary: { totalUsers: number; roles: number; newUsers: number; inactiveUsers: number }; rows: AdminUserRow[]; total: number; page: number; pageSize: number }
export interface AdminRole { id: string; name: string; description: string | null; permissions: Array<{ id: string; code: string; description: string | null }>; userCount: number }
export interface AdminPermission { id: string; code: string; description: string | null }
