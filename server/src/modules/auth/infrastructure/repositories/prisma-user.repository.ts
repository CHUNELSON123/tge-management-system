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
    return prisma.user.create({
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
  }
}