"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Ellipsis,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  UserCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import type { TranslationKey } from "@/modules/i18n/messages";
import { useAdminMembers } from "../hooks/use-admin-members";
import { useAdminMemberPhotos } from "../hooks/use-admin-member-photos";

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value === "active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (value === "pending" || value === "pending_activation") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (value === "inactive" || value === "suspended" || value === "deactivated") return "bg-rose-50 text-rose-800 ring-rose-200";
  if (value === "alumni") return "bg-violet-50 text-violet-800 ring-violet-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function pageNumbers(page: number, pageCount: number) {
  return [...new Set([1, page - 1, page, page + 1, pageCount].filter((value) => value >= 1 && value <= pageCount))].sort((a, b) => a - b);
}

export function AdminMembersPage() {
  const { t, locale } = useLanguage();
  const {
    data,
    loading,
    failed,
    filters,
    applyFilters,
    reset,
    page,
    setPage,
    pageSize,
    setPageSize,
    retry,
    canCreate,
    canReviewApplications,
  } = useAdminMembers();
  const [draft, setDraft] = useState(filters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => { applyFilters(draft); setSelectedIds([]); }, 350); return () => window.clearTimeout(timer); }, [draft]);
  const photos = useAdminMemberPhotos(data?.rows.map(({ id }) => id) ?? []);
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const first = data?.total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, data?.total ?? 0);
  const numberFormat = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA");
  const cards = [
    { label: t("adminMemberTotalMembers"), value: data?.summary.totalMembers, icon: Users, tone: "text-emerald-700 bg-emerald-50" },
    { label: t("adminMemberActiveMembers"), value: data?.summary.activeMembers, icon: UserCheck, tone: "text-sky-600 bg-sky-50" },
    { label: t("adminMemberPendingApproval"), value: data?.summary.pendingApproval, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
    { label: t("adminMemberInactiveMembers"), value: data?.summary.inactiveMembers, icon: UserRoundX, tone: "text-rose-600 bg-rose-50" },
    { label: t("adminMemberAlumni"), value: data?.summary.alumni, icon: GraduationCap, tone: "text-violet-600 bg-violet-50" },
  ];
  const pages = pageNumbers(page, pageCount);

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedIds([]);
    applyFilters(draft);
  }

  function clear() {
    const next = { search: "", status: "", programmeId: "", cohortId: "" };
    setDraft(next);
    setSelectedIds([]);
    reset();
  }

  function exportRows() {
    if (!data?.rows.length) return;
    const rows = selectedIds.length ? data.rows.filter(({ id }) => selectedIds.includes(id)) : data.rows;
    const headers = [t("adminMemberName"), t("adminEmail"), t("adminPhone"), t("adminProgramme"), t("adminCohort"), t("adminMembershipStatus"), t("adminBusiness"), t("adminJoinedOn")];
    const values = rows.map((member) => [member.displayName, member.email, member.phone ?? "", member.programmes[0]?.programmeName ?? "", member.programmes[0]?.cohortName ?? "", member.status, member.businesses[0] ?? "", member.joinedAt ?? ""]);
    const csvCell = (value: string) => {
      const safe = /^[\s]*[=+@\-]/.test(value) ? `'${value}` : value;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const csv = [headers, ...values].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tge-members-page-${page}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function changePage(nextPage: number) {
    setSelectedIds([]);
    setPage(nextPage);
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-5" aria-busy={loading}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211B]">{t("adminMembers")}</h1>
          <p className="mt-1 text-sm text-[#52645A]">{t("adminMembersIntro")}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          {canCreate ? (
            <Link href="/admin/members/new" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#087542] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#06663A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 sm:flex-none">
              <span aria-hidden="true" className="text-lg leading-none">+</span>{t("adminAddMember")}
            </Link>
          ) : canReviewApplications ? (
            <Link href="/admin/members/applications" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#147E4A] bg-white px-4 text-sm font-semibold text-[#075C32] hover:bg-[#EFF6F1] sm:flex-none">{t("adminReviewApplications")}</Link>
          ) : (
            <button type="button" disabled title={t("adminRegistrationUnavailable")} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#9FB8AA] px-5 text-sm font-bold text-white sm:w-auto">+ {t("adminAddMember")}</button>
          )}
          {canCreate && canReviewApplications && (
            <details className="relative">
              <summary aria-label={t("adminActions")} className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-lg border border-[#D7E3DA] bg-white text-[#075C32] hover:bg-[#F3F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] [&::-webkit-details-marker]:hidden"><ChevronDown aria-hidden="true" size={17} /></summary>
              <div className="absolute right-0 z-30 mt-2 min-w-52 rounded-lg border border-[#E0E8E3] bg-white p-1.5 shadow-lg"><Link href="/admin/members/applications" className="block rounded-md px-3 py-2 text-sm font-medium text-[#25352B] hover:bg-[#EFF6F1]">{t("adminReviewApplications")}</Link></div>
            </details>
          )}
        </div>
      </div>

      {loading && <p role="status" className="rounded-lg border border-[#DCE5DF] bg-white p-4 text-sm text-[#52645A]">{t("adminMembersLoading")}</p>}
      {failed && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{t("adminMemberListError")}</span><button type="button" onClick={retry} className="min-h-10 rounded-md border border-red-300 px-3 font-semibold">{t("retry")}</button></div>}

      {data && (
        <>
          <section aria-label={t("adminSummaryMetrics")} className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {cards.map(({ label, value, icon: Icon, tone }) => (
              <article key={label} className="flex min-h-24 min-w-0 items-center gap-2 rounded-xl border border-[#E4EBE6] bg-white p-3 shadow-[0_1px_3px_#0b3d2510] sm:gap-3 sm:p-4">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 ${tone}`}><Icon aria-hidden="true" size={21} /></span>
                <div className="min-w-0"><p className="text-xl font-bold leading-none text-[#17211B] sm:text-2xl">{numberFormat.format(value ?? 0)}</p><p className="mt-2 text-[11px] font-semibold leading-4 text-[#52645A] sm:text-xs">{label}</p></div>
              </article>
            ))}
          </section>

          <form onSubmit={apply} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border border-[#E4EBE6] bg-white p-3 lg:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(9rem,1fr))_auto_auto]">
            <label className="relative block min-w-0">
              <Search aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65736A]" />
              <input aria-label={t("adminSearchMembers")} value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} placeholder={t("adminSearchMembers")} className="h-10 w-full min-w-0 rounded-md border border-[#DCE5DF] pl-9 pr-3 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15" />
            </label>
            <div className="col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:contents">
              <label className="sr-only" htmlFor="member-status-filter">{t("adminAllMembershipStatuses")}</label>
              <select id="member-status-filter" aria-label={t("adminAllMembershipStatuses")} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className="h-10 min-w-0 rounded-md border border-[#DCE5DF] bg-white px-2 text-sm"><option value="">{t("adminAllMembershipStatuses")}</option>{data.membershipStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
              <label className="sr-only" htmlFor="member-programme-filter">{t("adminAllProgrammes")}</label>
              <select id="member-programme-filter" aria-label={t("adminAllProgrammes")} value={draft.programmeId} onChange={(event) => setDraft({ ...draft, programmeId: event.target.value, cohortId: "" })} className="h-10 min-w-0 rounded-md border border-[#DCE5DF] bg-white px-2 text-sm"><option value="">{t("adminAllProgrammes")}</option>{data.programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}</select>
              <label className="sr-only" htmlFor="member-cohort-filter">{t("adminAllCohorts")}</label>
              <select id="member-cohort-filter" aria-label={t("adminAllCohorts")} value={draft.cohortId} onChange={(event) => setDraft({ ...draft, cohortId: event.target.value })} className="h-10 min-w-0 rounded-md border border-[#DCE5DF] bg-white px-2 text-sm"><option value="">{t("adminAllCohorts")}</option>{data.programmes.flatMap((programme) => !draft.programmeId || programme.id === draft.programmeId ? programme.cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>) : [])}</select>
              <button type="button" onClick={clear} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-[#52645A] hover:bg-[#F3F7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><RotateCcw aria-hidden="true" size={15} />{t("adminResetFilters")}</button>
            </div>
          </form>

          <section className="overflow-hidden rounded-xl border border-[#E4EBE6] bg-white shadow-[0_1px_3px_#0b3d2510]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6ECE8] px-4 py-3">
              <h2 className="font-bold text-[#17211B]">{t("adminMembersCount")} ({numberFormat.format(data.total)})</h2>
              <button type="button" onClick={exportRows} disabled={data.rows.length === 0} title={t("adminExportCurrentPage")} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#5CB985] px-3 text-xs font-semibold text-[#075C32] hover:bg-[#F3F8F4] disabled:cursor-not-allowed disabled:opacity-50"><Download aria-hidden="true" size={15} />{t("adminExport")}<ChevronDown aria-hidden="true" size={14} /></button>
            </div>

            {data.rows.length === 0 ? (
              <p className="m-4 rounded-lg border border-dashed border-[#C9D8CE] bg-[#F7FAF8] p-8 text-center text-sm text-[#65736A]">{t("adminNoMembers")}</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1080px] text-left text-xs">
                    <thead className="bg-[#F7FAF8] text-[11px] font-semibold text-[#65736A]"><tr>
                      <th scope="col" className="w-10 px-3 py-3"><input className="accent-[#087B49]" type="checkbox" aria-label={t("adminSelectAllMembers")} checked={data.rows.length > 0 && data.rows.every(({ id }) => selectedIds.includes(id))} onChange={(event) => setSelectedIds(event.target.checked ? data.rows.map(({ id }) => id) : [])} /></th>
                      {["adminMemberName", "adminEmail", "adminPhone", "adminProgramme", "adminCohort", "adminMembershipStatus", "adminBusiness", "adminJoinedOn", "adminActions"].map((key) => <th key={key} scope="col" className="whitespace-nowrap px-3 py-3">{t(key as TranslationKey)}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-[#EDF1EE]">{data.rows.map((member) => (
                      <tr key={member.id} className="hover:bg-[#FBFCFB]">
                        <td className="px-3 py-3"><input className="accent-[#087B49]" type="checkbox" aria-label={`${t("adminSelectMember")} ${member.displayName}`} checked={selectedIds.includes(member.id)} onChange={(event) => setSelectedIds((selected) => event.target.checked ? [...new Set([...selected, member.id])] : selected.filter((id) => id !== member.id))} /></td>
                        <td className="px-3 py-3"><Link href={`/admin/members/${member.id}`} className="flex min-w-36 items-center gap-2 font-semibold text-[#17211B] hover:text-[#075C32]"><MemberAvatar name={member.displayName} photo={photos[member.id]} size="small" />{member.displayName}</Link></td>
                        <td className="max-w-44 truncate px-3 py-3 text-[#075C32]">{member.email}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-[#52645A]">{member.phone || t("adminNotRecorded")}</td>
                        <td className="max-w-36 truncate px-3 py-3">{member.programmes[0]?.programmeName ?? t("adminNoProgramme")}</td>
                        <td className="max-w-28 truncate px-3 py-3">{member.programmes[0]?.cohortName ?? "—"}</td>
                        <td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${statusTone(member.status)}`}>{statusLabel(member.status)}</span></td>
                        <td className="max-w-32 truncate px-3 py-3">{member.businesses[0] ?? t("adminNoBusiness")}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-[#52645A]">{dateLabel(member.joinedAt, locale) ?? t("adminNotRecorded")}</td>
                        <td className="px-3 py-3"><MemberActions memberId={member.id} t={t} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>

                <ul className="divide-y divide-[#EDF1EE] lg:hidden">{data.rows.map((member) => (
                  <li key={member.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <MemberAvatar name={member.displayName} photo={photos[member.id]} size="large" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/admin/members/${member.id}`} className="min-w-0 font-semibold text-[#17211B] hover:text-[#075C32]">{member.displayName}</Link>
                          <div className="flex shrink-0 items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusTone(member.status)}`}>{statusLabel(member.status)}</span><MemberActions memberId={member.id} t={t} /></div>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#075C32]">{member.email}</p>
                        <p className="mt-1 text-xs text-[#52645A]">{member.programmes[0] ? `${member.programmes[0].programmeName} · ${member.programmes[0].cohortName}` : t("adminNoProgramme")}</p>
                      </div>
                    </div>
                  </li>
                ))}</ul>
              </>
            )}

            <div className="flex flex-col gap-3 border-t border-[#E6ECE8] px-4 py-3 text-xs text-[#65736A] sm:flex-row sm:items-center sm:justify-between">
              <p>{t("adminShowingRange").replace("{start}", String(first)).replace("{end}", String(last)).replace("{total}", String(data.total))}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page <= 1} aria-label={t("adminPreviousPage")} onClick={() => changePage(page - 1)} className="grid h-9 w-9 place-items-center rounded-md border border-[#DCE5DF] disabled:opacity-40"><ChevronLeft aria-hidden="true" size={16} /></button>
                  {pages.map((number, index) => <span key={number} className="flex items-center gap-1">{index > 0 && number - pages[index - 1] > 1 && <span className="px-1">…</span>}<button type="button" aria-current={number === page ? "page" : undefined} onClick={() => changePage(number)} className={`grid h-9 min-w-9 place-items-center rounded-md border px-2 font-semibold ${number === page ? "border-[#087542] bg-[#087542] text-white" : "border-[#DCE5DF] bg-white text-[#25352B] hover:bg-[#F3F8F4]"}`}>{number}</button></span>)}
                  <button type="button" disabled={page >= pageCount} aria-label={t("adminNextPage")} onClick={() => changePage(page + 1)} className="grid h-9 w-9 place-items-center rounded-md border border-[#DCE5DF] disabled:opacity-40"><ChevronRight aria-hidden="true" size={16} /></button>
                </div>
                <label className="flex items-center gap-2">{t("adminRowsPerPage")}<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); changePage(1); }} className="h-9 rounded-md border border-[#DCE5DF] bg-white px-2"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function MemberAvatar({ name, photo, size }: { name: string; photo?: string; size: "small" | "large" }) {
  const dimension = size === "small" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF3ED] font-bold text-[#075C32] ${dimension}`}>
    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials(name)}
  </span>;
}

function MemberActions({ memberId, t }: { memberId: string; t: (key: TranslationKey) => string }) {
  return (
    <details className="relative">
      <summary aria-label={t("adminActions")} className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-md text-[#075C32] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] [&::-webkit-details-marker]:hidden"><Ellipsis aria-hidden="true" size={18} /></summary>
      <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-md border border-[#E0E8E3] bg-white p-1 shadow-lg"><Link href={`/admin/members/${memberId}`} className="block rounded px-3 py-2 text-xs text-[#17211B] hover:bg-[#EFF6F1]">{t("adminViewMember")}</Link><Link href={`/admin/members/${memberId}/edit`} className="block rounded px-3 py-2 text-xs text-[#17211B] hover:bg-[#EFF6F1]">{t("adminEditMember")}</Link></div>
    </details>
  );
}
