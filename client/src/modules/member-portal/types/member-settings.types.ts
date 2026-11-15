import type { MemberProfile } from "../services/member-profile.service";

export type MemberSettingsTab = "account" | "notifications" | "privacy" | "appearance";

export interface MemberSettingsProfileDraft {
  fullName: string;
  phone: string;
  location: string;
  bio: string;
  preferredLanguage: "en" | "fr" | "";
  timezone: string;
}

export type MemberSettingsProfileField = keyof MemberSettingsProfileDraft;

export interface MemberSettingsPasswordDraft {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type MemberSettingsPasswordField = keyof MemberSettingsPasswordDraft;

export interface MemberSettingsFeedback {
  type: "success" | "error";
  message: string;
}

export function profileToSettingsDraft(profile: MemberProfile): MemberSettingsProfileDraft {
  return {
    fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    bio: profile.bio ?? "",
    preferredLanguage: profile.preferredLanguage === "en" || profile.preferredLanguage === "fr" ? profile.preferredLanguage : "",
    timezone: profile.timezone ?? "",
  };
}
