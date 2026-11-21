import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { organisationSettingsSchema, defaultOrganisationSettings } from "../domain/organisation-settings.js";
import type { AdminSettingsRepository, OrganisationSettings } from "../domain/admin-settings.repository.js";
export class PrismaAdminSettingsRepository implements AdminSettingsRepository {
  async get(): Promise<OrganisationSettings> {
    const row = await prisma.systemSetting.findUnique({ where: { key: "organisation.settings.v1" }, select: { value: true } });
    return row ? organisationSettingsSchema.parse(row.value) : defaultOrganisationSettings;
  }
  async save(settings: OrganisationSettings, actorId: string): Promise<OrganisationSettings> {
    await prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({ where: { key: "organisation.settings.v1" }, create: { key: "organisation.settings.v1", value: { ...settings }, updatedById: actorId }, update: { value: { ...settings }, updatedById: actorId } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_SETTINGS_UPDATED", entityType: "SystemSetting", entityId: "organisation.settings.v1", details: { fields: Object.keys(settings) } } });
    });
    return settings;
  }
}
