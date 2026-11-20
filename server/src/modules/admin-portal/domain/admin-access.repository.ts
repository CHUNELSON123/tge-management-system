export interface AdminAccessRepository {
  getPermissions(roleId: string): Promise<string[]>;
}
