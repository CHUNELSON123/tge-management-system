export type AccountStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

export interface User {
  id: string;
  roleId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: AccountStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
