import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminAccessRepository } from "../domain/admin-access.repository.js";

export class PrismaAdminAccessRepository implements AdminAccessRepository {
  async getPermissions(roleId: string): Promise<string[]> {
    const grants = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { code: true } } },
      orderBy: { permission: { code: "asc" } },
    });
    return grants.map(({ permission }) => permission.code);
  }
}
