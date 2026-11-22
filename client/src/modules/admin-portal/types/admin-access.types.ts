export interface AdminAccess {
  userId: string;
  roleName: string;
  permissions: string[];
}

export interface AdminAccessResponse {
  message: string;
  data: AdminAccess;
}
