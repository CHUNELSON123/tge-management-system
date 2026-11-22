import type { AdminSettingsRepository, OrganisationSettings } from "../../system-settings/domain/admin-settings.repository.js";
export class GetAdminSettingsUseCase {
  constructor(private readonly repository: AdminSettingsRepository) {}
  execute() { return this.repository.get(); }
  save(input: OrganisationSettings, actorId: string) { return this.repository.save(input, actorId); }
}
