export type PublicWebsiteSettings = { aboutTitle: string; aboutContent: string; contactTitle: string; contactContent: string; address: string; email: string; phone: string; hours: string; facebook: string; linkedin: string; instagram: string; youtube: string;
  aboutHeroTitle: string; aboutHeroIntro: string; aboutMission: string; aboutVision: string; aboutValuesSummary: string;
  aboutInclusionTitle: string; aboutInclusionText: string; aboutCollaborationTitle: string; aboutCollaborationText: string; aboutInnovationTitle: string; aboutInnovationText: string; aboutIntegrityTitle: string; aboutIntegrityText: string; aboutImpactTitle: string; aboutImpactText: string; aboutImpactStatement: string; aboutImpactNote: string; aboutCommunityTitle: string; aboutCommunityText: string;
  contactSubheading: string; contactChannels: string; contactFormTitle: string; contactFormCopy: string; contactPartnerTitle: string; contactPartnerCopy: string; contactPartnerLink: string;
};
export type WebsiteSettings = PublicWebsiteSettings & { newsletterEmail: string };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/api/${path}`, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.data) throw new Error(body?.message || "Website settings are unavailable.");
  return body.data as T;
}
export const websiteSettingsService = {
  public: (signal?: AbortSignal) => request<PublicWebsiteSettings>("public/website-settings", { signal }),
  get: (token: string) => request<WebsiteSettings>("admin/website/settings", { headers: { Authorization: `Bearer ${token}` } }),
  save: (token: string, settings: WebsiteSettings) => request<WebsiteSettings>("admin/website/settings", { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(settings) }),
};
