import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminAccountStatus, AdminRole, AdminUserFilter, AdminUserRow, AdminUsersRepository } from "../domain/admin-users.repository.js";
import { canTransitionAccount } from "../domain/account-lifecycle.js";

const userRow = (row: { id: string; firstName: string; lastName: string; email: string; status: string; createdAt: Date; lastLoginAt: Date | null; role: { id: string; name: string }; memberProfile: { membershipNo: string | null } | null; profilePhoto: { contentType: string } | null }): AdminUserRow => ({ id: row.id, firstName: row.firstName, lastName: row.lastName, email: row.email, role: row.role, status: row.status as AdminAccountStatus, createdAt: row.createdAt.toISOString(), lastLoginAt: row.lastLoginAt?.toISOString() ?? null, membershipNo: row.memberProfile?.membershipNo ?? null, hasProfilePhoto: !!row.profilePhoto });
const adminUserSelect = { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true, lastLoginAt: true, role: { select: { id: true, name: true } }, memberProfile: { select: { membershipNo: true } }, profilePhoto: { select: { contentType: true } } } as const;
const roleSelect = { id: true, name: true, description: true, permissions: { select: { permission: { select: { id: true, code: true, description: true } } }, orderBy: { permission: { code: "asc" as const } } }, _count: { select: { users: true } } } as const;
type RoleRecord = { id: string; name: string; description: string | null; permissions: Array<{ permission: { id: string; code: string; description: string | null } }>; _count: { users: number } };
function mapRole(row: RoleRecord): AdminRole { return { id: row.id, name: row.name, description: row.description, permissions: row.permissions.map((item) => item.permission), userCount: row._count.users }; }

export class PrismaAdminUsersRepository implements AdminUsersRepository {
  async list(filter: AdminUserFilter) {
    const words = filter.search?.trim().split(/\s+/).filter(Boolean) ?? [];
    const where = { deletedAt: null, ...(filter.status ? { status: filter.status } : {}), ...(filter.roleId ? { roleId: filter.roleId } : {}), ...(words.length ? { AND: words.map(word => ({ OR: [{ firstName: { contains: word, mode: "insensitive" as const } }, { lastName: { contains: word, mode: "insensitive" as const } }, { email: { contains: word, mode: "insensitive" as const } }, { role: { name: { contains: word, mode: "insensitive" as const } } }] })) } : {}) };
    const [total, totalUsers, roles, newUsers, inactiveUsers, rows] = await Promise.all([
      prisma.user.count({ where }), prisma.user.count({ where: { deletedAt: null } }), prisma.role.count(), prisma.user.count({ where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }), prisma.user.count({ where: { deletedAt: null, status: { in: ["SUSPENDED", "DEACTIVATED"] } } }),
      prisma.user.findMany({ where, select: adminUserSelect, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize }),
    ]);
    return { summary: { totalUsers, roles, newUsers, inactiveUsers }, rows: rows.map(userRow), total, page: filter.page, pageSize: filter.pageSize };
  }
  async get(id: string) {
    const row = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { ...adminUserSelect, phone: true, location: true, emailVerifiedAt: true, updatedAt: true, profilePhoto: { select: { contentType: true } }, role: { select: { id: true, name: true, permissions: { select: { permission: { select: { code: true, description: true } } }, orderBy: { permission: { code: "asc" } } } } } } });
    if (!row) return null;
    const logs = await prisma.auditLog.findMany({ where: { actorUserId: id }, select: { id: true, action: true, entityType: true, entityId: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 });
    return { ...userRow(row), phone: row.phone, location: row.location, emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null, updatedAt: row.updatedAt.toISOString(), hasProfilePhoto: Boolean(row.profilePhoto), permissions: row.role.permissions.map((item) => item.permission), recentActivity: logs.map((log) => ({ id: log.id, action: log.action, entityType: log.entityType, entityId: log.entityId, createdAt: log.createdAt.toISOString() })) };
  }
  async getPhoto(id: string) {
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { profilePhoto: { select: { contentType: true, data: true } } } });
    return user?.profilePhoto ?? null;
  }
  async transition(id: string, status: "ACTIVE" | "SUSPENDED", actorId: string) {
    if (id === actorId) throw new Error("ACCOUNT_SELF_STATUS_CHANGE_FORBIDDEN");
    const current = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!current) return false;
    if (!canTransitionAccount(current.status as AdminAccountStatus, status)) throw new Error("ACCOUNT_TRANSITION_INVALID");
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({ where: { id, status: current.status, deletedAt: null }, data: { status } });
      if (updated.count !== 1) throw new Error("ACCOUNT_CHANGED");
      await tx.auditLog.create({ data: { actorUserId: actorId, action: `ADMIN_ACCOUNT_${status}`, entityType: "User", entityId: id, details: { previousStatus: current.status, status } } });
    });
    return true;
  }
  async roles() { return (await prisma.role.findMany({ select: roleSelect, orderBy: { name: "asc" } })).map(mapRole); }
  async filterRoles() { return prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }); }
  async assignableRoles(actorRole: string) {
    const names = actorRole === "System Administrator" ? undefined : ["Member", "Mentor", "Trainer / Facilitator"];
    return prisma.role.findMany({ where: names ? { name: { in: names } } : {}, select: { id: true, name: true }, orderBy: { name: "asc" } });
  }
  async permissionCatalog() { return prisma.permission.findMany({ select: { id: true, code: true, description: true }, orderBy: { code: "asc" } }); }
  async assignRole(id: string, roleId: string, actorId: string) {
    if (id === actorId) throw new Error("ACCOUNT_SELF_ROLE_CHANGE_FORBIDDEN");
    const [target, role] = await Promise.all([prisma.user.findFirst({ where: { id, deletedAt: null }, select: { roleId: true, role: { select: { name: true } } } }), prisma.role.findUnique({ where: { id: roleId }, select: { name: true } })]);
    if (!target || !role) return false;
    await prisma.$transaction(async (tx) => {
      if (["System Administrator", "Organisation Administrator"].includes(role.name) && !["System Administrator", "Organisation Administrator"].includes(target.role.name)) {
        const lock = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM roles WHERE name = 'System Administrator' FOR UPDATE`;
        if (!lock.length) throw new Error("ADMIN_ROLES_NOT_CONFIGURED");
        const count = await tx.user.count({ where: { deletedAt: null, role: { name: { in: ["System Administrator", "Organisation Administrator"] } } } });
        if (count >= 3) throw new Error("ADMIN_LIMIT_REACHED");
      }
      const changed = await tx.user.updateMany({ where: { id, roleId: target.roleId, deletedAt: null }, data: { roleId } });
      if (changed.count !== 1) throw new Error("ACCOUNT_CHANGED");
      if (role.name === "Member") await tx.member.upsert({ where: { userId: id }, create: { userId: id, membershipStatus: "active", joinedAt: new Date() }, update: {} });
      if (role.name === "Mentor") await tx.mentor.upsert({ where: { userId: id }, create: { userId: id, status: "active" }, update: {} });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_ACCOUNT_ROLE_CHANGED", entityType: "User", entityId: id, details: { previousRole: target.role.name, role: role.name } } });
    });
    return true;
  }
  async updateRolePermissions(roleId: string, permissionIds: string[], actorId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { name: true } }); if (!role) return null;
    const existing = await prisma.permission.findMany({ where: { id: { in: permissionIds } }, select: { id: true } }); if (existing.length !== new Set(permissionIds).size) throw new Error("PERMISSION_NOT_FOUND");
    if (role.name === "System Administrator") {
      const rolesManage = await prisma.permission.findUnique({ where: { code: "roles.manage" }, select: { id: true } });
      if (rolesManage && !permissionIds.includes(rolesManage.id)) throw new Error("SYSTEM_ADMIN_PERMISSION_REQUIRED");
    }
    await prisma.$transaction(async (tx) => {
      const current = await tx.rolePermission.findMany({ where: { roleId }, select: { permissionId: true } });
      await tx.rolePermission.deleteMany({ where: { roleId, ...(permissionIds.length ? { permissionId: { notIn: permissionIds } } : {}) } });
      const existingIds = new Set(current.map((item) => item.permissionId));
      await tx.rolePermission.createMany({ data: permissionIds.filter((id) => !existingIds.has(id)).map((permissionId) => ({ roleId, permissionId })) });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_ROLE_PERMISSIONS_UPDATED", entityType: "Role", entityId: roleId, details: { role: role.name, permissionCount: permissionIds.length } } });
    });
    const refreshed = await prisma.role.findUnique({ where: { id: roleId }, select: roleSelect });
    return refreshed ? mapRole(refreshed) : null;
  }
}
