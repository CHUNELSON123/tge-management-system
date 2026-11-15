"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import { useLanguage } from "@/modules/i18n/language-provider";
import { MemberProfileRequestError, memberProfileService, type MemberProfile } from "../services/member-profile.service";
import {
  profileToSettingsDraft,
  type MemberSettingsFeedback,
  type MemberSettingsPasswordDraft,
  type MemberSettingsPasswordField,
  type MemberSettingsProfileDraft,
  type MemberSettingsProfileField,
} from "../types/member-settings.types";

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

function splitFullName(value: string, profile: MemberProfile) {
  const currentName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  if (value.trim() === currentName) return { firstName: profile.firstName, lastName: profile.lastName };
  const [firstName, ...lastNameParts] = value.trim().split(/\s+/);
  return { firstName: firstName ?? "", lastName: lastNameParts.join(" ") };
}

export function useMemberSettings() {
  const { t, translateMessage, setLocale } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<MemberSettingsProfileDraft | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<MemberSettingsFeedback | null>(null);
  const [preferencesFeedback, setPreferencesFeedback] = useState<MemberSettingsFeedback | null>(null);
  const [photoFeedback, setPhotoFeedback] = useState<MemberSettingsFeedback | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<MemberSettingsFeedback | null>(null);
  const [passwordDraft, setPasswordDraft] = useState<MemberSettingsPasswordDraft>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [requestVersion, setRequestVersion] = useState(0);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem("tge.accessToken");
    sessionStorage.removeItem("tge.accessToken");
    router.replace("/login");
  }, [router]);

  const load = useCallback((signal: AbortSignal) => {
    setLoading(true);
    setProfileFeedback(null);
    const token = accessToken();
    if (!token) { router.replace("/login"); return; }
    memberProfileService.getProfile(token, signal).then((result) => {
      setProfile(result);
      setProfileDraft(profileToSettingsDraft(result));
    }).catch((error: unknown) => {
      if (signal.aborted) return;
      if (error instanceof MemberProfileRequestError && error.status === 401) { redirectToLogin(); return; }
      setProfileFeedback({ type: "error", message: t(error instanceof MemberProfileRequestError && error.status === 404 ? "profileMissingError" : "settingsProfileLoadError") });
    }).finally(() => { if (!signal.aborted) setLoading(false); });
  }, [redirectToLogin, t]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, requestVersion]);

  useEffect(() => {
    const token = accessToken();
    if (!token) return;
    const controller = new AbortController();
    memberProfileService.getPhoto(token, controller.signal).then((photo) => {
      if (!controller.signal.aborted) setProfilePhotoUrl(photo ? URL.createObjectURL(photo) : null);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof MemberProfileRequestError && error.status === 401) redirectToLogin();
      else setPhotoFeedback({ type: "error", message: t("settingsPhotoError") });
    });
    return () => controller.abort();
  }, [redirectToLogin, t]);

  useEffect(() => () => {
    if (profilePhotoUrl?.startsWith("blob:")) URL.revokeObjectURL(profilePhotoUrl);
  }, [profilePhotoUrl]);

  function setProfileField<K extends MemberSettingsProfileField>(field: K, value: MemberSettingsProfileDraft[K]) {
    setProfileDraft((current) => current ? { ...current, [field]: value } : current);
    setProfileFeedback(null);
  }

  function setPasswordField<K extends MemberSettingsPasswordField>(field: K, value: MemberSettingsPasswordDraft[K]) {
    setPasswordDraft((current) => ({ ...current, [field]: value }));
    setPasswordFeedback(null);
  }

  async function saveProfile() {
    if (!profile || !profileDraft) return;
    const token = accessToken();
    if (!token) { router.replace("/login"); return; }
    const { firstName, lastName } = splitFullName(profileDraft.fullName, profile);
    if (!firstName || !lastName) {
      setProfileFeedback({ type: "error", message: t("settingsFullNameRequired") });
      return;
    }
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const updated = await memberProfileService.updateProfile(token, {
        firstName,
        lastName,
        phone: profileDraft.phone.trim() || null,
        location: profileDraft.location.trim() || null,
        bio: profileDraft.bio.trim() || null,
      });
      setProfile(updated);
      setProfileDraft((current) => current ? {
        ...current,
        fullName: [updated.firstName, updated.lastName].filter(Boolean).join(" "),
        phone: updated.phone ?? "",
        location: updated.location ?? "",
        bio: updated.bio ?? "",
      } : profileToSettingsDraft(updated));
      setProfileFeedback({ type: "success", message: t("settingsProfileSaved") });
      window.dispatchEvent(new Event("tge:member-profile-updated"));
    } catch (error) {
      if (error instanceof MemberProfileRequestError && error.status === 401) { redirectToLogin(); return; }
      setProfileFeedback({ type: "error", message: t("settingsProfileSaveError") });
    } finally { setProfileSaving(false); }
  }

  async function savePreferences() {
    if (!profile || !profileDraft) return;
    const token = accessToken();
    if (!token) { router.replace("/login"); return; }
    setPreferencesSaving(true);
    setPreferencesFeedback(null);
    try {
      const updated = await memberProfileService.updateProfile(token, {
        preferredLanguage: profileDraft.preferredLanguage || null,
        timezone: profileDraft.timezone.trim() || null,
      });
      setProfile(updated);
      setProfileDraft((current) => current ? {
        ...current,
        preferredLanguage: updated.preferredLanguage === "en" || updated.preferredLanguage === "fr" ? updated.preferredLanguage : "",
        timezone: updated.timezone ?? "",
      } : profileToSettingsDraft(updated));
      if (updated.preferredLanguage === "en" || updated.preferredLanguage === "fr") setLocale(updated.preferredLanguage);
      setPreferencesFeedback({ type: "success", message: t("settingsPreferencesSaved") });
      window.dispatchEvent(new Event("tge:member-profile-updated"));
    } catch (error) {
      if (error instanceof MemberProfileRequestError && error.status === 401) { redirectToLogin(); return; }
      setPreferencesFeedback({ type: "error", message: t("settingsPreferencesSaveError") });
    } finally { setPreferencesSaving(false); }
  }

  async function uploadPhoto(file: File) {
    const token = accessToken();
    if (!token) { router.replace("/login"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 3 * 1024 * 1024) {
      setPhotoFeedback({ type: "error", message: t("profilePhotoInvalid") });
      return;
    }
    setPhotoSaving(true);
    setPhotoFeedback(null);
    try {
      await memberProfileService.updatePhoto(token, file);
      const photo = await memberProfileService.getPhoto(token);
      setProfilePhotoUrl(photo ? URL.createObjectURL(photo) : null);
      setPhotoFeedback({ type: "success", message: t("settingsPhotoSaved") });
      window.dispatchEvent(new Event("tge:member-profile-updated"));
    } catch (error) {
      if (error instanceof MemberProfileRequestError && error.status === 401) { redirectToLogin(); return; }
      setPhotoFeedback({ type: "error", message: t(error instanceof MemberProfileRequestError && error.status === 400 ? "profilePhotoInvalid" : "settingsPhotoError") });
    } finally { setPhotoSaving(false); }
  }

  async function changePassword() {
    const { currentPassword, newPassword, confirmPassword } = passwordDraft;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback({ type: "error", message: t("settingsPasswordRequired") });
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordFeedback({ type: "error", message: t("settingsPasswordRequirements") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: t("passwordsDoNotMatch") });
      return;
    }
    const token = accessToken();
    if (!token) { router.replace("/login"); return; }
    setPasswordSaving(true);
    setPasswordFeedback(null);
    try {
      const result = await authService.changePassword(token, { currentPassword, newPassword });
      setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFeedback({ type: "success", message: translateMessage(result.message) });
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) { redirectToLogin(); return; }
      setPasswordFeedback({ type: "error", message: translateMessage(error instanceof Error ? error.message : "Unable to change the password.") });
    } finally { setPasswordSaving(false); }
  }

  return {
    profile, profileDraft, profilePhotoUrl, loading, profileSaving, preferencesSaving, photoSaving, passwordSaving,
    profileFeedback, preferencesFeedback, photoFeedback, passwordFeedback, passwordDraft,
    setProfileField, setPasswordField, saveProfile, savePreferences, uploadPhoto, changePassword,
    retry: () => setRequestVersion((version) => version + 1),
  };
}
