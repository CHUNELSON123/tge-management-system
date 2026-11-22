"use client";
import Image from "next/image";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, CalendarDays, CheckCircle2, ChevronRight, Edit3, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useAdminMember } from "../hooks/use-admin-member";
import { useAdminMemberPhoto } from "../hooks/use-admin-member-photo";
import { useAdminMemberProgrammes } from "../hooks/use-admin-member";
import type { AdminMemberAccountStatus } from "../types/admin-members.types";
import type { TranslationKey } from "@/modules/i18n/messages";

const accountStatusLabel: Record<AdminMemberAccountStatus, TranslationKey> = {
  ACTIVE: "adminAccountActive", PENDING_ACTIVATION: "adminAccountPendingActivation", SUSPENDED: "adminAccountSuspended", DEACTIVATED: "adminAccountDeactivated",
};

function dateLabel(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""); }
function valueOrRecorded(value: string | null | undefined, fallback: string) { return value?.trim() || fallback; }

export function AdminMemberDetailPage() {
  const params = useParams<{ memberId: string }>();
  const memberId = params.memberId;
  const { t, locale } = useLanguage();
  const { member, loading, failed, retry } = useAdminMember(memberId);
  const { programmes } = useAdminMemberProgrammes(memberId);
  const { photoUrl } = useAdminMemberPhoto(memberId);

  if (loading) return <main role="status" className="p-5 text-sm text-[#52645A]">{t("adminMembersLoading")}</main>;
  if (failed || !member) return <main className="space-y-4 rounded-xl border border-[#E4EBE6] bg-white p-6"><p role="alert" className="text-sm text-[#52645A]">{failed ? t("adminMemberProfileError") : t("adminMemberProfileUnavailable")}</p>{failed && <button type="button" onClick={retry} className="min-h-10 rounded-md border border-[#147E4A] px-4 text-sm font-semibold text-[#075C32]">{t("retry")}</button>}<Link href="/admin/members" className="block text-sm font-semibold text-[#075C32]">{t("adminBackToMembers")}</Link></main>;

  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
  const verified = Boolean(member.emailVerifiedAt);
  return <section className="mx-auto max-w-[1400px] space-y-5">
    <nav aria-label={t("breadcrumbNavigation")} className="flex flex-wrap items-center gap-2 text-sm text-[#5B665F]"><Link href="/" className="hover:text-[#075C32]">{t("home")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href="/admin" className="hover:text-[#075C32]">{t("adminPortal")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href="/admin/members" className="hover:text-[#075C32]">{t("adminMembers")}</Link><ChevronRight aria-hidden="true" size={14} /><span aria-current="page" className="font-semibold text-[#075C32]">{t("adminMemberDetailTitle")}</span></nav>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold tracking-tight text-[#17211B]">{t("adminMemberDetailTitle")}</h1><p className="mt-1 text-sm text-[#52645A]">{t("adminMemberDetailIntro")}</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/members" className="inline-flex min-h-10 items-center rounded-md border border-[#D7E3DA] bg-white px-4 text-sm font-semibold text-[#075C32] hover:bg-[#F2F7F3]">{t("adminBackToMembers")}</Link><Link href={`/admin/members/${member.id}/edit`} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#006B3B] px-4 text-sm font-bold text-white hover:bg-[#075C32]"><Edit3 aria-hidden="true" size={16} />{t("adminEditMember")}</Link></div></div>

    <article className="grid gap-4 rounded-xl border border-[#E4EBE6] bg-white p-4 shadow-[0_1px_3px_#0b3d2510] md:grid-cols-[auto_1fr_1fr] md:items-center md:p-5">
      <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-xl bg-[#EAF3ED] text-2xl font-bold text-[#075C32]">{photoUrl ? <Image unoptimized width={128} height={128} src={photoUrl} alt={fullName} className="h-full w-full object-cover" /> : initials(fullName) || <UserRound aria-hidden="true" size={32} />}</div>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-[#17211B]">{fullName}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.accountStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : member.accountStatus === "PENDING_ACTIVATION" ? "bg-amber-50 text-amber-800" : member.accountStatus === "SUSPENDED" ? "bg-orange-50 text-orange-800" : "bg-slate-100 text-slate-700"}`}>{t(accountStatusLabel[member.accountStatus])}</span></div><p className="mt-1 text-xs text-[#52645A]">{t("adminMemberId")}: {member.membershipNumber || member.id}</p><p className="mt-3 flex items-center gap-2 text-sm text-[#075C32]"><Mail aria-hidden="true" size={15} />{member.email}</p><p className="mt-2 flex items-center gap-2 text-sm text-[#52645A]"><Phone aria-hidden="true" size={15} />{valueOrRecorded(member.phone, t("adminNotRecorded"))}</p><p className="mt-2 flex items-center gap-2 text-sm text-[#52645A]"><MapPin aria-hidden="true" size={15} />{valueOrRecorded(member.location, t("adminNotRecorded"))}</p><p className="mt-2 flex items-center gap-2 text-xs text-[#52645A]"><CalendarDays aria-hidden="true" size={15} />{t("adminJoinedOn")}: {dateLabel(member.joinedAt, locale) ?? t("adminNotRecorded")}</p></div>
      <div className="grid gap-3 rounded-lg bg-[#F7FAF8] p-4 sm:grid-cols-2 md:grid-cols-1"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#65736A]">{t("adminMembershipStatus")}</p><p className="mt-1 inline-flex rounded-full bg-[#EAF3ED] px-2.5 py-1 text-sm font-semibold capitalize text-[#075C32]">{member.membershipStatus.replaceAll("_", " ")}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#65736A]">{t("adminEmailVerified")}</p><p className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${verified ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}><CheckCircle2 aria-hidden="true" size={14} />{verified ? t("adminYes") : t("adminNo")}</p></div></div>
    </article>

    <nav aria-label={t("adminMemberOverview")} className="flex gap-5 overflow-x-auto border-b border-[#DCE5DF]"><span aria-current="page" className="border-b-2 border-[#087B49] px-2 py-3 text-sm font-semibold text-[#075C32]">{t("adminMemberOverview")}</span><Link href={`/admin/members/${member.id}/programmes`} className="border-b-2 border-transparent px-2 py-3 text-sm font-semibold text-[#52645A] hover:border-[#087B49] hover:text-[#075C32]">{t("adminMemberProgrammes")}</Link></nav>

    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-xl border border-[#E4EBE6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-bold text-[#17211B]">{t("adminPersonalInformation")}</h2><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{[
        ["adminFirstName", member.firstName], ["adminLastName", member.lastName], ["adminEmail", member.email], ["adminPhone", member.phone], ["adminDateOfBirth", member.dateOfBirth ? dateLabel(member.dateOfBirth, locale) : null], ["adminGender", member.gender], ["adminNationality", member.nationality], ["adminLocation", member.location], ["adminPreferredLanguage", member.preferredLanguage], ["adminTimezone", member.timezone],
      ].map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-[#65736A]">{t(label as TranslationKey)}</dt><dd className="mt-1 break-words text-sm font-medium text-[#25352B]">{valueOrRecorded(value, t("adminNotRecorded"))}</dd></div>)}</dl>{member.bio && <div className="mt-5 border-t border-[#EDF1EE] pt-4"><h3 className="text-xs font-semibold text-[#65736A]">{t("adminBiography")}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#25352B]">{member.bio}</p></div>}</section>

      <div className="space-y-4"><section className="rounded-xl border border-[#E4EBE6] bg-white p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-[#17211B]">{t("adminMemberProgrammes")}</h2><Link href={`/admin/members/${member.id}/programmes`} className="text-xs font-semibold text-[#075C32] hover:underline">{t("adminViewMember")}</Link></div>{programmes.length === 0 ? <p className="rounded-lg bg-[#F7FAF8] p-4 text-sm text-[#65736A]">{t("adminNoMemberEnrollments")}</p> : <ul className="space-y-3">{programmes.slice(0, 3).map((enrollment) => <li key={enrollment.id} className="flex items-start gap-3 border-b border-[#EDF1EE] pb-3 last:border-0 last:pb-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EAF3ED] text-[#075C32]"><CalendarDays aria-hidden="true" size={17} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#25352B]">{enrollment.programmeName}</p><p className="mt-1 text-xs text-[#65736A]">{enrollment.cohortName} · <span className="capitalize">{enrollment.enrollmentStatus.replaceAll("_", " ")}</span></p></div></li>)}</ul>}</section>

      <section className="rounded-xl border border-[#E4EBE6] bg-white p-4 sm:p-5"><h2 className="mb-3 text-sm font-bold text-[#17211B]">{t("adminMemberBusinesses")}</h2>{member.businesses.length === 0 ? <p className="rounded-lg bg-[#F7FAF8] p-4 text-sm text-[#65736A]">{t("adminNoMemberBusinesses")}</p> : <ul className="space-y-3">{member.businesses.map((business) => <li key={business.id} className="flex items-start gap-3 border-b border-[#EDF1EE] pb-3 last:border-0 last:pb-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EAF3ED] text-[#075C32]"><Building2 aria-hidden="true" size={17} /></span><div><p className="text-sm font-semibold text-[#25352B]">{business.name}</p><p className="mt-1 text-xs capitalize text-[#65736A]">{business.status} · {business.publicationStatus}</p></div></li>)}</ul>}</section></div>
    </div>
  </section>;
}
