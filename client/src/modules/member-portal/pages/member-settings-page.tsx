"use client";

import { useState } from "react";
import { AlertTriangle, Bell, Camera, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Monitor, Phone, Save, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberSettings } from "../hooks/use-member-settings";
import type { MemberSettingsTab } from "../types/member-settings.types";

const tabs: Array<{ id: MemberSettingsTab; key: "settingsTabAccount" | "settingsTabNotifications" | "settingsTabPrivacy" | "settingsTabAppearance" }> = [
  { id: "account", key: "settingsTabAccount" },
  { id: "notifications", key: "settingsTabNotifications" },
  { id: "privacy", key: "settingsTabPrivacy" },
  { id: "appearance", key: "settingsTabAppearance" },
];

function Feedback({ value }: { value: { type: "success" | "error"; message: string } | null }) {
  if (!value) return null;
  return <p role={value.type === "error" ? "alert" : "status"} className={`mt-3 rounded-md px-3 py-2 text-sm ${value.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{value.message}</p>;
}

export function MemberSettingsPage() {
  const { t } = useLanguage();
  const settings = useMemberSettings();
  const [tab, setTab] = useState<MemberSettingsTab>("account");
  const [showPasswords, setShowPasswords] = useState(false);
  const draft = settings.profileDraft;
  const initials = (draft?.fullName ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join("") || "?";
  const newPassword = settings.passwordDraft.newPassword;

  return (
    <section aria-labelledby="member-settings-title" aria-busy={settings.loading}>
      <header>
        <h1 id="member-settings-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{t("settingsTitle")}</h1>
        <p className="mt-1 text-sm text-[#59645D]">{t("settingsDescription")}</p>
      </header>

      {settings.loading && !settings.profile && <div className="mt-6 grid gap-4 xl:grid-cols-2" aria-label={t("loading")}><div className="h-80 animate-pulse rounded-xl bg-[#F1F5F2]" /><div className="h-80 animate-pulse rounded-xl bg-[#F1F5F2]" /></div>}
      {settings.profileFeedback?.type === "error" && !settings.profile && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">{settings.profileFeedback.message}<button type="button" onClick={settings.retry} className="ml-3 font-semibold underline">{t("retry")}</button></div>}

      {settings.profile && <>
        <div className="mt-5 overflow-x-auto border-b border-[#E3EAE5]">
          <div role="tablist" aria-label={t("settingsTabs")} className="flex min-w-max gap-2">
            {tabs.map(({ id, key }) => <button key={id} type="button" role="tab" id={`settings-tab-${id}`} aria-selected={tab === id} aria-controls="settings-tab-panel" onClick={() => setTab(id)} className={`min-h-11 border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] ${tab === id ? "border-[#087340] text-[#075C32]" : "border-transparent text-[#39443D] hover:text-[#075C32]"}`}>{t(key)}</button>)}
          </div>
        </div>

        <div id="settings-tab-panel" role="tabpanel" aria-labelledby={`settings-tab-${tab}`} className="mt-5">
          {tab === "account" && draft && <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-[#E6ECE8] bg-white p-4 sm:p-5" aria-labelledby="settings-profile-heading">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><UserRound aria-hidden="true" size={20} /></span><div><h2 id="settings-profile-heading" className="font-bold text-[#17211B]">{t("settingsProfileInformation")}</h2><p className="mt-1 text-sm text-[#59645D]">{t("settingsProfileDescription")}</p></div></div>
              <div className="mt-4 flex items-center gap-3">
                <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF3ED] text-xl font-bold text-[#075C32]">{settings.profilePhotoUrl ? <img src={settings.profilePhotoUrl} alt={draft.fullName} className="h-full w-full object-cover" /> : initials}<label title={t("profilePhotoChange")} className="absolute bottom-0 right-0 grid h-7 w-7 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#F2F6F4] text-[#075C32]"><input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t("profilePhotoChange")} disabled={settings.photoSaving} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void settings.uploadPhoto(file); }} className="sr-only" />{settings.photoSaving ? <span className="text-[10px]" aria-hidden="true">…</span> : <Camera aria-hidden="true" size={14} />}</label></div>
                <div><p className="text-sm font-semibold text-[#075C32]">{t("profilePhotoChange")}</p><p className="text-xs text-[#68736C]">{t("settingsPhotoFormats")}</p></div>
              </div>
              <Feedback value={settings.photoFeedback} />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#17211B]">{t("settingsFullName")}<input disabled={settings.profileSaving} maxLength={201} value={draft.fullName} onChange={(event) => settings.setProfileField("fullName", event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20 disabled:bg-[#F4F6F4]" /></label>
                <label className="text-xs font-semibold text-[#17211B]">{t("settingsEmail")}<input type="email" value={settings.profile.email} readOnly aria-describedby="settings-email-readonly" className="mt-1 min-h-10 w-full rounded-md border border-[#D7E0DA] bg-[#F4F6F4] px-3 text-sm font-normal text-[#68736C]" /><span id="settings-email-readonly" className="mt-1 block text-[11px] font-normal text-[#68736C]">{t("settingsEmailReadOnly")}</span></label>
                <label className="text-xs font-semibold text-[#17211B]">{t("settingsPhone")}<span className="relative mt-1 block"><Phone aria-hidden="true" size={15} className="absolute left-3 top-3 text-[#68736C]" /><input disabled={settings.profileSaving} type="tel" maxLength={30} value={draft.phone} onChange={(event) => settings.setProfileField("phone", event.target.value)} className="min-h-10 w-full rounded-md border border-[#D7E0DA] pl-9 pr-3 text-sm font-normal focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20 disabled:bg-[#F4F6F4]" /></span></label>
                <label className="text-xs font-semibold text-[#17211B]">{t("settingsLocation")}<input disabled={settings.profileSaving} maxLength={255} value={draft.location} onChange={(event) => settings.setProfileField("location", event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20 disabled:bg-[#F4F6F4]" /></label>
                <label className="text-xs font-semibold text-[#17211B] sm:col-span-2">{t("settingsBio")}<textarea disabled={settings.profileSaving} maxLength={250} rows={3} value={draft.bio} onChange={(event) => settings.setProfileField("bio", event.target.value)} className="mt-1 w-full resize-y rounded-md border border-[#D7E0DA] p-3 text-sm font-normal focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20 disabled:bg-[#F4F6F4]" /><span className="mt-1 block text-right text-[11px] font-normal text-[#68736C]">{draft.bio.length}/250</span></label>
              </div>
              <Feedback value={settings.profileFeedback} />
              <div className="mt-3 flex justify-end"><button type="button" onClick={() => void settings.saveProfile()} disabled={settings.profileSaving || settings.loading} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] disabled:cursor-wait disabled:opacity-60"><Save aria-hidden="true" size={16} />{settings.profileSaving ? t("saving") : t("settingsSaveChanges")}</button></div>
            </section>

            <section className="rounded-xl border border-[#E6ECE8] bg-white p-4 sm:p-5" aria-labelledby="settings-password-heading">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><LockKeyhole aria-hidden="true" size={20} /></span><div><h2 id="settings-password-heading" className="font-bold text-[#17211B]">{t("settingsChangePassword")}</h2><p className="mt-1 text-sm text-[#59645D]">{t("settingsPasswordDescription")}</p></div></div>
              <div className="mt-4 space-y-3">
                {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => <label key={field} className="block text-xs font-semibold text-[#17211B]">{t(field === "currentPassword" ? "currentPassword" : field === "newPassword" ? "newPassword" : "confirmPassword")}<span className="relative mt-1 block"><input disabled={settings.passwordSaving} autoComplete={field === "currentPassword" ? "current-password" : "new-password"} type={showPasswords ? "text" : "password"} maxLength={128} value={settings.passwordDraft[field]} onChange={(event) => settings.setPasswordField(field, event.target.value)} className="min-h-10 w-full rounded-md border border-[#D7E0DA] px-3 pr-10 text-sm font-normal focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20 disabled:bg-[#F4F6F4]" /><button disabled={settings.passwordSaving} type="button" onClick={() => setShowPasswords((show) => !show)} aria-label={t(showPasswords ? "hidePassword" : "showPassword")} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded text-[#59645D] hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{showPasswords ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}</button></span></label>)}
              </div>
              <div className="mt-4"><p className="text-xs font-semibold text-[#39443D]">{t("settingsPasswordRequirementsTitle")}</p><ul className="mt-2 grid gap-1 text-xs text-[#59645D] sm:grid-cols-2">{[
                [newPassword.length >= 8, "settingsPasswordMin"],
                [/[A-Z]/.test(newPassword), "settingsPasswordUpper"],
                [/[a-z]/.test(newPassword), "settingsPasswordLower"],
                [/[0-9]/.test(newPassword), "settingsPasswordNumber"],
              ].map(([passed, key]) => <li key={key as string} className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={14} className={passed ? "text-[#087340]" : "text-[#9AA49D]"} />{t(key as "settingsPasswordMin" | "settingsPasswordUpper" | "settingsPasswordLower" | "settingsPasswordNumber")}</li>)}</ul></div>
              <Feedback value={settings.passwordFeedback} />
              <div className="mt-3 flex justify-end"><button type="button" onClick={() => void settings.changePassword()} disabled={settings.passwordSaving} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] disabled:cursor-wait disabled:opacity-60"><ShieldCheck aria-hidden="true" size={16} />{settings.passwordSaving ? t("saving") : t("settingsUpdatePassword")}</button></div>
            </section>

            <section className="rounded-xl border border-[#E6ECE8] bg-white p-4 sm:p-5" aria-labelledby="settings-preferences-heading">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><Settings2 aria-hidden="true" size={20} /></span><div><h2 id="settings-preferences-heading" className="font-bold text-[#17211B]">{t("settingsAccountPreferences")}</h2><p className="mt-1 text-sm text-[#59645D]">{t("settingsPreferencesDescription")}</p></div></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#17211B]">{t("settingsLanguage")}<select disabled={settings.preferencesSaving} value={draft.preferredLanguage} onChange={(event) => settings.setProfileField("preferredLanguage", event.target.value as "en" | "fr" | "")} className="mt-1 min-h-10 w-full rounded-md border border-[#D7E0DA] bg-white px-3 text-sm font-normal disabled:bg-[#F4F6F4]"><option value="">{t("profileNotProvided")}</option><option value="en">{t("profileEnglish")}</option><option value="fr">{t("profileFrench")}</option></select></label>
                <label className="text-xs font-semibold text-[#17211B]">{t("settingsTimezone")}<input disabled={settings.preferencesSaving} maxLength={100} value={draft.timezone} onChange={(event) => settings.setProfileField("timezone", event.target.value)} placeholder="Africa/Douala" className="mt-1 min-h-10 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal placeholder:text-[#9AA49D] disabled:bg-[#F4F6F4]" /></label>
              </div>
              <Feedback value={settings.preferencesFeedback} />
              <div className="mt-3 flex justify-end"><button type="button" onClick={() => void settings.savePreferences()} disabled={settings.preferencesSaving} className="min-h-10 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] disabled:opacity-60">{settings.preferencesSaving ? t("saving") : t("settingsSavePreferences")}</button></div>
            </section>

            <section className="rounded-xl border border-[#E8B4B4] bg-[#FFF9F9] p-4 sm:p-5" aria-labelledby="settings-closure-heading">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-700"><AlertTriangle aria-hidden="true" size={20} /></span><div><h2 id="settings-closure-heading" className="font-bold text-[#7F1D1D]">{t("settingsAccountClosure")}</h2><p className="mt-2 text-sm leading-5 text-[#6F3636]">{t("settingsAccountClosureUnavailable")}</p></div></div>
            </section>
          </div>}

          {tab === "notifications" && <section className="rounded-xl border border-[#E6ECE8] bg-white p-5 sm:p-6" aria-labelledby="settings-notifications-heading">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><Bell aria-hidden="true" size={20} /></span><div><h2 id="settings-notifications-heading" className="font-bold text-[#17211B]">{t("settingsNotificationPreferences")}</h2><p className="mt-1 text-sm text-[#59645D]">{t("settingsNotSaved")}</p></div></div>
            <div className="mt-5 divide-y divide-[#E8ECE9]">{[["settingsEmailUpdates", "settingsEmailUpdatesDescription"], ["settingsMarketing", "settingsMarketingDescription"]].map(([title, description]) => <div key={title} className="flex items-center justify-between gap-4 py-4"><div><h3 className="text-sm font-semibold text-[#17211B]">{t(title as "settingsEmailUpdates" | "settingsMarketing")}</h3><p className="mt-1 text-xs text-[#68736C]">{t(description as "settingsEmailUpdatesDescription" | "settingsMarketingDescription")}</p></div><span className="rounded-full bg-[#F1F3F1] px-2.5 py-1 text-[11px] font-semibold text-[#68736C]">{t("settingsUnavailable")}</span></div>)}</div>
          </section>}

          {tab === "privacy" && <section className="rounded-xl border border-[#E6ECE8] bg-white p-5 sm:p-6" aria-labelledby="settings-privacy-heading"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><ShieldCheck aria-hidden="true" size={20} /></span><div><h2 id="settings-privacy-heading" className="font-bold text-[#17211B]">{t("settingsPrivacy")}</h2><p className="mt-1 text-sm leading-6 text-[#59645D]">{t("settingsPrivacyUnavailable")}</p></div></div></section>}

          {tab === "appearance" && <section className="rounded-xl border border-[#E6ECE8] bg-white p-5 sm:p-6" aria-labelledby="settings-appearance-heading"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><Monitor aria-hidden="true" size={20} /></span><div><h2 id="settings-appearance-heading" className="font-bold text-[#17211B]">{t("settingsAppearance")}</h2><p className="mt-1 text-sm leading-6 text-[#59645D]">{t("settingsAppearanceUnavailable")}</p><p className="mt-3 text-sm text-[#39443D]">{t("settingsLanguageTimezoneInAccount")}</p></div></div></section>}
        </div>
      </>}
    </section>
  );
}
