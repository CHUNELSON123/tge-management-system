export interface OrganisationSettings { name: string; email: string; phone: string; address: string; allowPublicRegistration: boolean }
export interface AdminSettingsRepository {
  get(): Promise<OrganisationSettings>;
  save(settings: OrganisationSettings, actorId: string): Promise<OrganisationSettings>;
}
