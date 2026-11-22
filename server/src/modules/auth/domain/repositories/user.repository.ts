import type { User } from "../entities/user.entity.js";

export interface CreateUserData {
  roleId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findRoleNameById(roleId: string): Promise<string | null>;
  create(data: CreateUserData): Promise<User>;
}
