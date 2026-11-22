import { z } from "zod";
import { prisma } from "../../../infrastructure/database/prisma-client.js";

const text = z.string().trim().max(12000);
const link = z.union([z.literal(""), z.url().refine(value => { try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } }, "Use an https URL")]);
export const websiteSettingsSchema = z.object({
  aboutTitle: text, aboutContent: text, contactTitle: text, contactContent: text,
  address: text, email: z.union([z.literal(""), z.email()]), phone: text, hours: text,
  facebook: link, linkedin: link, instagram: link, youtube: link,
  newsletterEmail: z.union([z.literal(""), z.email()]),
  aboutHeroTitle: text.default(""), aboutHeroIntro: text.default(""),
  aboutMission: text.default(""), aboutVision: text.default(""), aboutValuesSummary: text.default(""),
  aboutInclusionTitle: text.default(""), aboutInclusionText: text.default(""),
  aboutCollaborationTitle: text.default(""), aboutCollaborationText: text.default(""),
  aboutInnovationTitle: text.default(""), aboutInnovationText: text.default(""),
  aboutIntegrityTitle: text.default(""), aboutIntegrityText: text.default(""),
  aboutImpactTitle: text.default(""), aboutImpactText: text.default(""),
  aboutImpactStatement: text.default(""), aboutImpactNote: text.default(""), aboutCommunityTitle: text.default(""), aboutCommunityText: text.default(""),
  contactSubheading: text.default(""), contactChannels: text.default(""),
  contactFormTitle: text.default(""), contactFormCopy: text.default(""),
  contactPartnerTitle: text.default(""), contactPartnerCopy: text.default(""), contactPartnerLink: text.default(""),
});
export type WebsiteSettings = z.infer<typeof websiteSettingsSchema>;
export const defaults: WebsiteSettings = websiteSettingsSchema.parse({ aboutTitle: "", aboutContent: "", contactTitle: "", contactContent: "", address: "", email: "", phone: "", hours: "", facebook: "", linkedin: "", instagram: "", youtube: "", newsletterEmail: "" });
const key = "website.content.settings.v1";
export class WebsiteSettingsRepository {
  async get(): Promise<WebsiteSettings> {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    return row ? websiteSettingsSchema.parse(row.value) : defaults;
  }
  async save(value: WebsiteSettings, actorId: string): Promise<WebsiteSettings> {
    await prisma.$transaction(async tx => {
      await tx.systemSetting.upsert({ where: { key }, create: { key, value, updatedById: actorId }, update: { value, updatedById: actorId } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "WEBSITE_SETTINGS_UPDATED", entityType: "SystemSetting", entityId: key } });
    });
    return value;
  }
}
