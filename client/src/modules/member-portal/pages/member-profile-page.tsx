"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BriefcaseBusiness, CalendarDays, Camera, CircleUserRound, Clock3, Mail, MapPin, Pencil, Phone, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { MemberProfileRequestError, memberProfileService, type MemberProfile, type MemberProfileUpdate } from "../services/member-profile.service";

type ProfileSection = "personal" | "professional" | "business" | "account";
type EditableProfile = Pick<MemberProfileUpdate, "firstName" | "lastName" | "phone" | "location" | "dateOfBirth" | "gender" | "nationality" | "preferredLanguage" | "timezone" | "bio">;

const sections: Array<{ id: ProfileSection; key: "profilePersonalInformation" | "profileProfessionalDetails" | "profileBusinessInformation" | "profileAccountSettings" }> = [
  { id: "personal", key: "profilePersonalInformation" },
  { id: "professional", key: "profileProfessionalDetails" },
  { id: "business", key: "profileBusinessInformation" },
  { id: "account", key: "profileAccountSettings" },
];

function asEditableProfile(profile: MemberProfile): EditableProfile {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    location: profile.location,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    nationality: profile.nationality,
    preferredLanguage: profile.preferredLanguage,
    timezone: profile.timezone,
    bio: profile.bio,
  };
}

function formattedDate(value: string | null, locale: string, unavailable: string, options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }) {
  if (!value) return unavailable;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? unavailable : new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
}

export function MemberProfilePage() {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSaved, setPhotoSaved] = useState(false);
  const [draft, setDraft] = useState<EditableProfile | null>(null);
  const [section, setSection] = useState<ProfileSection>("personal");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const load = useCallback((signal: AbortSignal) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    memberProfileService.getProfile(token, signal).then((data) => {
      setProfile(data);
      setDraft(asEditableProfile(data));
    }).catch((reason: unknown) => {
      if (signal.aborted) return;
      if (reason instanceof MemberProfileRequestError && reason.status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/login");
        return;
      }
      setError(reason instanceof MemberProfileRequestError && reason.status === 404 ? t("profileMissingError") : t("profileLoadError"));
    }).finally(() => {
      if (!signal.aborted) setLoading(false);
    });
  }, [router, t]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, requestVersion]);

  useEffect(() => () => {
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) return;
    const controller = new AbortController();
    memberProfileService.getPhoto(token, controller.signal).then((photo) => {
      if (!controller.signal.aborted) setPhotoUrl(photo ? URL.createObjectURL(photo) : null);
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return;
      if (reason instanceof MemberProfileRequestError && reason.status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/login");
      } else setPhotoError(t("profilePhotoError"));
    });
    return () => controller.abort();
  }, [router, t]);

  function beginEditing() {
    if (!profile) return;
    setDraft(asEditableProfile(profile));
    setSection("personal");
    setEditing(true);
    setSaved(false);
    setError("");
  }

  function cancelEditing() {
    if (profile) setDraft(asEditableProfile(profile));
    setEditing(false);
    setError("");
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.firstName?.trim() || !draft.lastName?.trim()) {
      setError(t("profileRequiredFields"));
      return;
    }
    if (draft.dateOfBirth && draft.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      setError(t("profileFutureBirthDate"));
      return;
    }
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await memberProfileService.updateProfile(token, draft);
      setProfile(updated);
      setDraft(asEditableProfile(updated));
      setEditing(false);
      setSaved(true);
      window.dispatchEvent(new Event("tge:member-profile-updated"));
    } catch (reason) {
      if (reason instanceof MemberProfileRequestError && reason.status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/login");
        return;
      }
      setError(reason instanceof MemberProfileRequestError && reason.status === 400 ? t("profileValidationError") : t("profileSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 3 * 1024 * 1024) {
      setPhotoError(t("profilePhotoInvalid"));
      setPhotoSaved(false);
      return;
    }
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return; }
    setPhotoSaving(true);
    setPhotoError("");
    setPhotoSaved(false);
    try {
      await memberProfileService.updatePhoto(token, file);
      const photo = await memberProfileService.getPhoto(token);
      setPhotoUrl(photo ? URL.createObjectURL(photo) : null);
      setPhotoSaved(true);
      window.dispatchEvent(new Event("tge:member-profile-updated"));
    } catch (reason) {
      if (reason instanceof MemberProfileRequestError && reason.status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/login");
        return;
      }
      setPhotoError(reason instanceof MemberProfileRequestError && reason.status === 400 ? t("profilePhotoInvalid") : t("profilePhotoError"));
    } finally {
      setPhotoSaving(false);
    }
  }

  function change<K extends keyof EditableProfile>(key: K, value: NonNullable<EditableProfile[K]> | null) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join("") || "?";
  const membershipStatus = profile?.membership?.status?.toLowerCase();
  const statusLabel = membershipStatus === "active" ? t("profileStatusActive") : membershipStatus === "pending" ? t("profileStatusPending") : membershipStatus === "suspended" ? t("profileStatusSuspended") : profile?.membership?.status || t("profileUnavailable");

  return (
    <section aria-labelledby="member-profile-title" aria-busy={loading}>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 id="member-profile-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{t("profileTitle")}</h1>
          <p className="mt-1 text-sm text-[#59645D]">{t("profileDescription")}</p>
        </div>
        {profile && <div className="flex items-center gap-2 self-start sm:self-auto">
          {editing ? <>
            <button type="button" onClick={cancelEditing} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C8D8CD] px-4 text-sm font-semibold text-[#075C32] hover:bg-[#EFF6F1] disabled:opacity-60"><X aria-hidden="true" size={16} />{t("profileCancel")}</button>
            <button type="submit" form="member-profile-form" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] disabled:opacity-60"><Save aria-hidden="true" size={16} />{saving ? t("saving") : t("profileSave")}</button>
          </> : <button type="button" onClick={beginEditing} className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 sm:self-auto"><Pencil aria-hidden="true" size={16} />{t("profileEdit")}</button>}
        </div>}
      </header>

      {loading && !profile && <div className="mt-6 grid gap-4 lg:grid-cols-3" aria-label={t("loading")}><div className="h-52 animate-pulse rounded-xl bg-[#F1F5F2] lg:col-span-2" /><div className="h-52 animate-pulse rounded-xl bg-[#F1F5F2]" /></div>}

      {error && !profile && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert"><p>{error}</p><button type="button" onClick={() => setRequestVersion((version) => version + 1)} className="mt-3 min-h-10 rounded-lg bg-[#006B3B] px-4 font-semibold text-white">{t("retry")}</button></div>}

      {profile && <>
        <article className="mt-5 grid gap-5 rounded-xl border border-[#E6ECE8] bg-white p-4 shadow-[0_2px_12px_#00000008] sm:p-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(250px,0.9fr)] lg:items-center">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center self-center overflow-hidden rounded-full bg-[#EAF3ED] text-3xl font-bold text-[#075C32] sm:h-28 sm:w-28">
              {photoUrl ? <img src={photoUrl} alt={fullName || t("profileTitle")} className="h-full w-full object-cover" /> : initials}
              <label className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#F2F6F4] text-[#075C32] hover:bg-[#E4F3E9] focus-within:ring-2 focus-within:ring-[#147E4A]" title={t("profilePhotoChange")}>
                <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t("profilePhotoChange")} onChange={uploadPhoto} disabled={photoSaving} className="sr-only" />
                {photoSaving ? <span className="text-xs" aria-hidden="true">…</span> : <Camera aria-hidden="true" size={17} />}
              </label>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-[#111B16]">{fullName || t("profileUnavailable")}</h2>
              <span className="mt-2 inline-flex rounded-md bg-[#EAF3ED] px-3 py-1 text-xs font-semibold text-[#075C32]">{t("memberRole")}</span>
              <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm text-[#59645D] sm:grid-cols-2">
                <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start"><Mail aria-hidden="true" size={15} className="shrink-0" /><dd className="truncate">{profile.email}</dd></div>
                <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start"><Phone aria-hidden="true" size={15} className="shrink-0" /><dd>{profile.phone || t("profileNotProvided")}</dd></div>
                <div className="flex items-center justify-center gap-2 sm:justify-start"><CalendarDays aria-hidden="true" size={15} /><dd>{t("profileMemberSince")}: {formattedDate(profile.membership?.joinedAt ?? null, locale, t("profileUnavailable"))}</dd></div>
                <div className="flex items-center justify-center gap-2 sm:justify-start"><MapPin aria-hidden="true" size={15} /><dd>{profile.location || t("profileNotProvided")}</dd></div>
              </dl>
              {(photoError || photoSaved) && <p role={photoError ? "alert" : "status"} className={`mt-3 text-sm ${photoError ? "text-red-800" : "text-green-800"}`}>{photoError || t("profilePhotoSaved")}</p>}
            </div>
          </div>
          <section className="rounded-lg bg-[#F7FAF8] p-4" aria-labelledby="profile-membership-title">
            <div className="flex items-center gap-2"><Award aria-hidden="true" size={20} className="text-[#087340]" /><h2 id="profile-membership-title" className="font-bold text-[#17211B]">{t("profileMembershipDetails")}</h2></div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
              <div><dt className="text-xs text-[#68736C]">{t("profileMemberType")}</dt><dd className="mt-1 font-medium text-[#17211B]">{t("memberRole")}</dd></div>
              <div><dt className="text-xs text-[#68736C]">{t("profileMembershipStatus")}</dt><dd className="mt-1"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${membershipStatus === "active" ? "bg-[#E4F3E9] text-[#075C32]" : "bg-[#F1F3F1] text-[#39443D]"}`}>{statusLabel}</span></dd></div>
              <div className="col-span-2"><dt className="text-xs text-[#68736C]">{t("profileMemberNumber")}</dt><dd className="mt-1 font-medium text-[#17211B]">{profile.membership?.membershipNumber || t("profileUnavailable")}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-[#68736C]">{t("profileMemberSince")}</dt><dd className="mt-1 font-medium text-[#17211B]">{formattedDate(profile.membership?.joinedAt ?? null, locale, t("profileUnavailable"))}</dd></div>
            </dl>
          </section>
        </article>

        <div className="mt-5 overflow-x-auto border-b border-[#E3EAE5]">
          <div role="tablist" aria-label={t("profileSections")} className="flex min-w-max gap-2">
            {sections.map(({ id, key }) => <button key={id} type="button" role="tab" id={`profile-tab-${id}`} aria-selected={section === id} aria-controls="profile-tab-panel" disabled={editing && id !== "personal"} onClick={() => setSection(id)} className={`min-h-11 border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] disabled:cursor-not-allowed disabled:opacity-50 ${section === id ? "border-[#087340] text-[#075C32]" : "border-transparent text-[#39443D] hover:text-[#075C32]"}`}>{t(key)}</button>)}
          </div>
        </div>

        {error && profile && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>}
        {saved && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{t("profileSaved")}</p>}

        <div id="profile-tab-panel" role="tabpanel" aria-labelledby={`profile-tab-${section}`} className="mt-4">
          {section === "personal" && draft && <form id="member-profile-form" noValidate onSubmit={saveProfile} className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(240px,0.9fr)]">
            <div className="space-y-4">
              <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="profile-personal-heading">
                <h2 id="profile-personal-heading" className="font-bold text-[#17211B]">{t("profilePersonalInformation")}</h2>
                {editing ? <fieldset disabled={saving} className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileFirstName")} *<input required maxLength={100} value={draft.firstName ?? ""} onChange={(event) => change("firstName", event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileLastName")} *<input required maxLength={100} value={draft.lastName ?? ""} onChange={(event) => change("lastName", event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileDateOfBirth")}<input type="date" max={new Date().toISOString().slice(0, 10)} value={draft.dateOfBirth ?? ""} onChange={(event) => change("dateOfBirth", event.target.value || null)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileGender")}<input maxLength={50} value={draft.gender ?? ""} onChange={(event) => change("gender", event.target.value || null)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileNationality")}<input maxLength={100} value={draft.nationality ?? ""} onChange={(event) => change("nationality", event.target.value || null)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profilePreferredLanguage")}<select value={draft.preferredLanguage ?? ""} onChange={(event) => change("preferredLanguage", event.target.value === "" ? null : event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] bg-white px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20"><option value="">{t("profileNotProvided")}</option><option value="en">{t("profileEnglish")}</option><option value="fr">{t("profileFrench")}</option></select></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profilePhone")}<input type="tel" maxLength={30} value={draft.phone ?? ""} onChange={(event) => change("phone", event.target.value || null)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileLocation")}<input maxLength={255} value={draft.location ?? ""} onChange={(event) => change("location", event.target.value || null)} className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <label className="text-xs font-semibold text-[#075C32]">{t("profileTimezone")}<input maxLength={100} value={draft.timezone ?? ""} onChange={(event) => change("timezone", event.target.value || null)} placeholder="Africa/Douala" className="mt-1 min-h-11 w-full rounded-md border border-[#D7E0DA] px-3 text-sm font-normal text-[#17211B] placeholder:text-[#9AA49D] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /></label>
                  <div className="sm:col-span-2"><p className="text-xs font-semibold text-[#075C32]">{t("profileEmail")}</p><p className="mt-1 flex min-h-11 items-center rounded-md bg-[#F4F6F4] px-3 text-sm text-[#68736C]">{profile.email}</p><p className="mt-1 text-xs text-[#68736C]">{t("profileEmailReadOnly")}</p></div>
                </fieldset> : <dl className="mt-4 grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileFullName")}</dt><dd className="mt-1 text-sm text-[#17211B]">{fullName || t("profileNotProvided")}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileDateOfBirth")}</dt><dd className="mt-1 text-sm text-[#17211B]">{formattedDate(profile.dateOfBirth, locale, t("profileNotProvided"))}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileGender")}</dt><dd className="mt-1 text-sm text-[#17211B]">{profile.gender || t("profileNotProvided")}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileNationality")}</dt><dd className="mt-1 text-sm text-[#17211B]">{profile.nationality || t("profileNotProvided")}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profilePreferredLanguage")}</dt><dd className="mt-1 text-sm text-[#17211B]">{profile.preferredLanguage === "en" ? "English" : profile.preferredLanguage === "fr" ? "Français" : t("profileNotProvided")}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileTimezone")}</dt><dd className="mt-1 text-sm text-[#17211B]">{profile.timezone || t("profileNotProvided")}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileEmail")}</dt><dd className="mt-1 break-all text-sm text-[#17211B]">{profile.email}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profilePhone")}</dt><dd className="mt-1 text-sm text-[#17211B]">{profile.phone || t("profileNotProvided")}</dd></div>
                  <div><dt className="text-xs font-medium text-[#075C32]">{t("profileLocation")}</dt><dd className="mt-1 text-sm text-[#17211B]">{profile.location || t("profileNotProvided")}</dd></div>
                </dl>}
              </section>

              <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="profile-about-heading">
                <h2 id="profile-about-heading" className="font-bold text-[#17211B]">{t("profileAboutMe")}</h2>
                {editing ? <label className="mt-3 block text-xs font-semibold text-[#075C32]">{t("profileBio")}<textarea maxLength={250} rows={3} value={draft.bio ?? ""} onChange={(event) => change("bio", event.target.value || null)} className="mt-1 w-full resize-y rounded-md border border-[#D7E0DA] p-3 text-sm font-normal text-[#17211B] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20" /><span className="mt-1 block text-right text-xs font-normal text-[#68736C]">{(draft.bio ?? "").length}/250</span></label> : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#39443D]">{profile.bio || t("profileNotProvided")}</p>}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="profile-quick-actions-heading">
                <h2 id="profile-quick-actions-heading" className="font-bold text-[#17211B]">{t("profileQuickActions")}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={beginEditing} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-[#E4E9E5] text-xs font-semibold text-[#075C32] hover:bg-[#F5F9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><UserRound aria-hidden="true" size={19} />{t("profileUpdateProfile")}</button>
                  <Link href="/change-password" className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-[#E4E9E5] text-xs font-semibold text-[#075C32] hover:bg-[#F5F9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><ShieldCheck aria-hidden="true" size={19} />{t("changePassword")}</Link>
                  <button type="button" disabled className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-[#E4E9E5] text-xs font-semibold text-[#819087] disabled:cursor-not-allowed"><CircleUserRound aria-hidden="true" size={19} />{t("profileManageNotifications")}</button>
                  <button type="button" disabled className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-[#E4E9E5] text-xs font-semibold text-[#819087] disabled:cursor-not-allowed"><ShieldCheck aria-hidden="true" size={19} />{t("profilePrivacySettings")}</button>
                </div>
              </section>
              <section className="rounded-xl border border-[#E6ECE8] bg-[#F7FAF8] p-4 sm:p-5" aria-labelledby="profile-contact-heading">
                <h2 id="profile-contact-heading" className="font-bold text-[#17211B]">{t("profileContactInformation")}</h2>
                <p className="mt-3 flex items-center gap-2 break-all text-sm text-[#39443D]"><Mail aria-hidden="true" size={16} className="shrink-0 text-[#087340]" />{profile.email}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#39443D]"><Phone aria-hidden="true" size={16} className="shrink-0 text-[#087340]" />{profile.phone || t("profileNotProvided")}</p>
                <p className="mt-3 text-xs text-[#68736C]">{t("profileEmailReadOnly")}</p>
              </section>
            </aside>
          </form>}

          {section === "business" ? <section className="rounded-xl border border-[#E6ECE8] bg-white p-5 sm:p-6" aria-labelledby="profile-business-heading">
            <div className="flex items-center gap-3 text-[#087340]"><BriefcaseBusiness aria-hidden="true" size={22} /><h2 id="profile-business-heading" className="font-bold text-[#17211B]">{t("profileBusinessInformation")}</h2></div>
            {profile.businesses.length === 0 ? <p className="mt-3 text-sm leading-6 text-[#59645D]">{t("profileNoBusinesses")}</p> : <ul className="mt-4 divide-y divide-[#E8ECE9]">{profile.businesses.map((business) => <li key={business.id} className="py-4 first:pt-0 last:pb-0"><h3 className="font-semibold text-[#17211B]">{business.name}</h3>{business.description && <p className="mt-1 text-sm leading-6 text-[#59645D]">{business.description}</p>}<dl className="mt-3 grid gap-2 text-sm text-[#39443D] sm:grid-cols-2">{business.websiteUrl && <div><dt className="text-xs text-[#68736C]">{t("profileWebsite")}</dt><dd className="break-all">{business.websiteUrl}</dd></div>}{business.email && <div><dt className="text-xs text-[#68736C]">{t("profileEmail")}</dt><dd className="break-all">{business.email}</dd></div>}{business.phone && <div><dt className="text-xs text-[#68736C]">{t("profilePhone")}</dt><dd>{business.phone}</dd></div>}{business.address && <div className="flex items-start gap-1"><MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-[#087340]" /><dd>{business.address}</dd></div>}</dl></li>)}</ul>}
          </section> : section !== "personal" && <section className="rounded-xl border border-[#E6ECE8] bg-white p-5 sm:p-6" aria-live="polite">
            <div className="flex items-center gap-3 text-[#087340]">{section === "professional" ? <UserRound aria-hidden="true" size={22} /> : <Clock3 aria-hidden="true" size={22} />}<h2 className="font-bold text-[#17211B]">{t(sections.find((item) => item.id === section)!.key)}</h2></div>
            <p className="mt-3 text-sm leading-6 text-[#59645D]">{section === "professional" ? t("profileProfessionalUnavailable") : t("profileAccountUnavailable")}</p>
          </section>}
        </div>
      </>}
    </section>
  );
}
