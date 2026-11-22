import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { User } from "../../domain/entities/user.entity.js";
import type {
  CreateUserData,
  UserRepository,
} from "../../domain/repositories/user.repository.js";

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findRoleNameById(roleId: string): Promise<string | null> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });

    return role?.name ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { id: data.roleId }, select: { name: true } });
      if (role && ["System Administrator", "Organisation Administrator"].includes(role.name)) {
        const lock = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM roles WHERE name = 'System Administrator' FOR UPDATE`;
        if (!lock.length) throw new Error("ADMIN_ROLES_NOT_CONFIGURED");
        const count = await tx.user.count({ where: { deletedAt: null, role: { name: { in: ["System Administrator", "Organisation Administrator"] } } } });
        if (count >= 3) throw new Error("ADMIN_LIMIT_REACHED");
      }
      const user = await tx.user.create({
        data: {
          roleId: data.roleId,
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? null,
          status: "PENDING_ACTIVATION",
        },
      });
      if (role?.name === "Member") await tx.member.create({ data: { userId: user.id, membershipStatus: "active", joinedAt: new Date() } });
      if (role?.name === "Mentor") await tx.mentor.create({ data: { userId: user.id, status: "active" } });
      return user;
    });
  }
}
