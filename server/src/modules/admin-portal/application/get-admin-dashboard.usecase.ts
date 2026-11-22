import type { AdminDashboardDateRange, AdminDashboardRepository } from "../domain/admin-dashboard.repository.js";

export class GetAdminDashboardUseCase {
  constructor(private readonly repository: AdminDashboardRepository) {}

  execute(range: AdminDashboardDateRange) {
    return this.repository.loadDashboard(range);
  }
}
