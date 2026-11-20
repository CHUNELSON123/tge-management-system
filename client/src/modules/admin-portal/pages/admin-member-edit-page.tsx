"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ImagePlus, Save, UserRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useAdminMember } from "../hooks/use-admin-member";
import { useAdminMemberPhoto } from "../hooks/use-admin-member-photo";
import type { AdminMemberProfileUpdate } from "../types/admin-members.types";
import type { TranslationKey } from "@/modules/i18n/messages";

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""); }

export function AdminMemberEditPage() {
  const params = useParams<{ memberId: string }>();
  const memberId = params.memberId;
  const { t } = useLanguage();
  const { member, loading, failed, saving, saveError, save, retry } = useAdminMember(memberId);
  const photo = useAdminMemberPhoto(memberId);
  const [draftState, setDraftState] = useState<{ memberId: string; value: AdminMemberProfileUpdate } | null>(null);
  const [saved, setSaved] = useState(false);

  const memberDraft = member ? {
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    location: member.location,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    nationality: member.nationality,
    preferredLanguage: member.preferredLanguage as "en" | "fr" | null,
    timezone: member.timezone,
    bio: member.bio,
  } : null;
  const draft = member && draftState?.memberId === member.id ? draftState.value : memberDraft;

  function field<K extends keyof AdminMemberProfileUpdate>(key: K, value: AdminMemberProfileUpdate[K]) {
    if (!member) return;
    setSaved(false);
    const current = draftState?.memberId === member.id ? draftState.value : memberDraft;
    if (current) setDraftState({ memberId: member.id, value: { ...current, [key]: value } });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const didSave = await save(draft);
    if (didSave) setSaved(true);
  }

  if (loading || !draft) return <main role="status" className="p-5 text-sm text-[#52645A]">{t("adminMembersLoading")}</main>;
  if (failed || !member) return <main className="space-y-4 rounded-xl border border-[#E4EBE6] bg-white p-6"><p role="alert" className="text-sm text-[#52645A]">{t("adminMemberProfileError")}</p><button type="button" onClick={retry} className="min-h-10 rounded-md border border-[#147E4A] px-4 text-sm font-semibold text-[#075C32]">{t("retry")}</button></main>;

  const editDraft = draft;
  const currentName = [member.firstName, member.lastName].filter(Boolean).join(" ");
  const inputClass = "mt-1 h-10 w-full rounded-md border border-[#DCE5DF] bg-white px-3 text-sm text-[#17211B] outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15";
  const label = (key: TranslationKey, required = false) => <span className="text-xs font-semibold text-[#36453B]">{t(key)}{required && <span className="ml-1 text-[#087B49]">*</span>}</span>;
  function textInput(key: keyof AdminMemberProfileUpdate, labelKey: TranslationKey, required = false) {
    return <label className="block">{label(labelKey, required)}<input required={required} maxLength={key === "firstName" || key === "lastName" ? 100 : key === "phone" ? 30 : key === "location" ? 255 : key === "nationality" ? 100 : key === "gender" ? 50 : key === "timezone" ? 100 : 250} value={(editDraft[key] as string | null) ?? ""} onChange={(event) => field(key, (event.target.value || null) as AdminMemberProfileUpdate[typeof key])} className={inputClass} /></label>;
  }

  return <section className="mx-auto max-w-[1200px] space-y-5">
    <nav aria-label={t("breadcrumbNavigation")} className="flex flex-wrap items-center gap-2 text-sm text-[#5B665F]"><Link href="/" className="hover:text-[#075C32]">{t("home")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href="/admin" className="hover:text-[#075C32]">{t("adminPortal")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href="/admin/members" className="hover:text-[#075C32]">{t("adminMembers")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href={`/admin/members/${member.id}`} className="hover:text-[#075C32]">{currentName}</Link><ChevronRight aria-hidden="true" size={14} /><span aria-current="page" className="font-semibold text-[#075C32]">{t("adminEditMemberTitle")}</span></nav>
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold tracking-tight text-[#17211B]">{t("adminEditMemberTitle")}</h1><p className="mt-1 text-sm text-[#52645A]">{t("adminEditMemberIntro")}</p></div><div className="flex gap-2"><Link href={`/admin/members/${member.id}`} className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#D7E3DA] bg-white px-4 text-sm font-semibold text-[#075C32]">{t("adminCancel")}</Link><button type="submit" disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#006B3B] px-5 text-sm font-bold text-white hover:bg-[#075C32] disabled:opacity-60"><Save aria-hidden="true" size={16} />{saving ? t("adminSaving") : t("adminSaveChanges")}</button></div></div>

      {(saveError || photo.feedback) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{photo.feedback || (saveError ? t("adminMemberSaveFailed") : "")}</p>}
      {saved && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{t("adminMemberSaved")}</p>}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <section className="rounded-xl border border-[#E4EBE6] bg-white p-4"><h2 className="text-sm font-bold text-[#17211B]">{t("profilePhotoChange")}</h2><div className="mx-auto mt-4 grid h-36 w-36 place-items-center overflow-hidden rounded-xl bg-[#EAF3ED] text-3xl font-bold text-[#075C32]">{photo.photoUrl ? <img src={photo.photoUrl} alt={currentName} className="h-full w-full object-cover" /> : initials(currentName) || <UserRound aria-hidden="true" size={36} />}</div><label className="mt-4 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#16864D] px-3 text-sm font-semibold text-[#075C32] hover:bg-[#EFF6F1]">{photo.saving ? t("adminSaving") : <><ImagePlus aria-hidden="true" size={16} />{t("profilePhotoChange")}</>}<input type="file" accept="image/jpeg,image/png" disabled={photo.saving} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void photo.upload(file); }} className="sr-only" /></label><p className="mt-2 text-center text-[11px] text-[#65736A]">JPG, PNG · 2 MB</p></section>

        <section className="rounded-xl border border-[#E4EBE6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-bold text-[#17211B]">{t("adminPersonalInformation")}</h2><div className="grid gap-4 sm:grid-cols-2">
          {textInput("firstName", "adminFirstName", true)}{textInput("lastName", "adminLastName", true)}
          <label className="block">{label("adminEmail")}<input value={member.email} readOnly aria-describedby="admin-member-email-note" className={`${inputClass} bg-[#F4F7F5] text-[#65736A]`} /><span id="admin-member-email-note" className="mt-1 block text-[11px] text-[#65736A]">{t("adminEmailReadOnly")}</span></label>
          {textInput("phone", "adminPhone")}
          <label className="block">{label("adminDateOfBirth")}<input type="date" value={editDraft.dateOfBirth ?? ""} onChange={(event) => field("dateOfBirth", event.target.value || null)} className={inputClass} /></label>
          {textInput("gender", "adminGender")}{textInput("nationality", "adminNationality")}{textInput("location", "adminLocation")}
          <label className="block">{label("adminPreferredLanguage")}<select value={editDraft.preferredLanguage ?? ""} onChange={(event) => field("preferredLanguage", (event.target.value || null) as "en" | "fr" | null)} className={inputClass}><option value="">{t("adminNotRecorded")}</option><option value="en">English</option><option value="fr">Français</option></select></label>
          {textInput("timezone", "adminTimezone")}
        </div><label className="mt-4 block">{label("adminBiography")}<textarea maxLength={250} rows={4} value={editDraft.bio ?? ""} onChange={(event) => field("bio", event.target.value || null)} className="mt-1 w-full rounded-md border border-[#DCE5DF] p-3 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15" /></label></section>
      </div>

      <div className="grid gap-4 md:grid-cols-2"><section className="rounded-xl border border-[#E4EBE6] bg-white p-4"><h2 className="text-sm font-bold text-[#17211B]">{t("adminMemberId")}</h2><p className="mt-2 text-sm text-[#52645A]">{member.membershipNumber || member.id}</p></section><section className="rounded-xl border border-[#E4EBE6] bg-white p-4"><h2 className="text-sm font-bold text-[#17211B]">{t("adminAccountStatus")} · {t("adminMembershipStatus")}</h2><p className="mt-2 text-sm text-[#52645A]">{t("adminReadonlyAccountStatus")}</p><p className="mt-1 text-sm text-[#52645A]">{t("adminReadonlyMembershipStatus")}</p><p className="mt-2 text-xs font-semibold text-[#075C32]">{member.accountStatus} · {member.membershipStatus}</p></section></div>
    </form>
  </section>;
}
