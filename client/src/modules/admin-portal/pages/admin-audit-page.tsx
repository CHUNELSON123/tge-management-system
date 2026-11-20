"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Search } from "lucide-react";
import { useAdminText } from "../hooks/use-admin-text";
import { adminAuditService } from "../services/admin-audit.service";
import type { AuditLogRow, AuditPage } from "../types/admin-audit.types";

const token = () => typeof window === "undefined" ? "" : localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
type AuditFilters = { search: string; actorUserId: string; action: string; entityType: string; dateFrom: string; dateTo: string };
const emptyFilters: AuditFilters = { search: "", actorUserId: "", action: "", entityType: "", dateFrom: "", dateTo: "" };
const toIso = (value: string) => value ? new Date(value).toISOString() : "";
const csv = (value: string) => {
  const safe = /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
};

function exportPage(rows: AuditLogRow[]) {
  const content = [
    ["Date & time", "Actor", "Action", "Module", "Entity ID", "Status"].map(csv).join(","),
    ...rows.map((row) => [row.createdAt, row.actorName, row.action, row.entityType, row.entityId || "", String(row.details.status || row.details.decision || "")].map(csv).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = "audit-logs-current-page.csv"; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdminAuditPage() {
  const tr = useAdminText();
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters);
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const [data, setData] = useState<AuditPage | null>(null);
  const [actors, setActors] = useState<Array<{ id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actorError, setActorError] = useState("");
  const [expanded, setExpanded] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { setFilters(draft); setPage(1); setExpanded(""); }, 350); return () => window.clearTimeout(timer); }, [draft]);

  useEffect(() => {
    const controller = new AbortController();
    void adminAuditService.actors(token(), controller.signal)
      .then(setActors)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setActorError(reason instanceof Error ? reason.message : "Actor filters are unavailable."); });
    return () => controller.abort();
  }, []);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const result = await adminAuditService.list(token(), {
        ...(filters.dateFrom ? { dateFrom: toIso(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { dateTo: toIso(filters.dateTo) } : {}),
        ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
        ...(filters.action.trim() ? { action: filters.action.trim() } : {}),
        ...(filters.entityType.trim() ? { entityType: filters.entityType.trim() } : {}),
        ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
        page, pageSize: 10,
      }, signal);
      if (!signal.aborted) { setData(result); setError(""); }
    } catch (reason) {
      if (!signal.aborted) setError(reason instanceof Error ? reason.message : "Audit logs could not be loaded.");
    } finally { if (!signal.aborted) setLoading(false); }
  }, [filters, page]);

  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => void load(controller.signal));
    return () => { cancelAnimationFrame(frame); controller.abort(); };
  }, [load, reload]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1); setExpanded(""); setFilters({ ...draft });
  }

  function clearFilters() {
    setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); setExpanded("");
  }

  function setFilter<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const input = "min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm";

  return <section className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><Link href="/admin/users-roles" className="text-sm text-blue-700 hover:underline">← {tr("Back to Users")}</Link><h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{tr("Audit Logs")}</h1><p className="mt-1 text-sm text-[#31558F]">{tr("Read system activity and account changes. Audit records cannot be edited here.")}</p></div>
      <button disabled={!data?.rows.length} onClick={() => data && exportPage(data.rows)} className="inline-flex min-h-10 items-center gap-2 rounded border border-blue-700 px-3 text-sm font-semibold text-blue-800 disabled:opacity-40"><ArrowDownToLine size={16} />{tr("Export Current Page")}</button>
    </header>

    <form onSubmit={applyFilters} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold">{tr("Date From")}<input aria-label="Date from" type="datetime-local" value={draft.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} className={`${input} mt-1 w-full`} /></label>
        <label className="text-xs font-semibold">{tr("Date To")}<input aria-label="Date to" type="datetime-local" value={draft.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} className={`${input} mt-1 w-full`} /></label>
        <label className="text-xs font-semibold">{tr("User")}<select aria-label="Filter actor" value={draft.actorUserId} onChange={(event) => setFilter("actorUserId", event.target.value)} className={`${input} mt-1 w-full`}><option value="">{tr("All users")}</option>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select>{actorError && <span className="mt-1 block font-normal text-slate-500">{tr("Actor choices unavailable; other filters still work.")}</span>}</label>
        <label className="text-xs font-semibold">{tr("Action Type")}<input aria-label="Action type" placeholder={tr("All actions")} value={draft.action} onChange={(event) => setFilter("action", event.target.value)} className={`${input} mt-1 w-full`} /></label>
        <label className="text-xs font-semibold">{tr("Module")}<input aria-label="Module" placeholder={tr("All modules")} value={draft.entityType} onChange={(event) => setFilter("entityType", event.target.value)} className={`${input} mt-1 w-full`} /></label>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-500" /><input aria-label="Search logs" placeholder={tr("Search action, module or entity ID…")} value={draft.search} onChange={(event) => setFilter("search", event.target.value)} className="min-h-10 w-full rounded-md border pl-9 pr-3 text-sm" /></label>
        
        <button type="button" onClick={clearFilters} className="min-h-10 rounded border px-4 text-sm">{tr("Clear Filters")}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{tr("Searches default to the last 30 days. The server caps ranges at 90 days and pages at 50 records.")}</p>
    </form>

    {error && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}<button onClick={() => setReload((value) => value + 1)} className="ml-3 underline">{tr("Try again")}</button></div>}

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h2 className="border-b px-4 py-4 font-bold">{tr("Activity")} ({data?.total ?? 0})</h2>
      {loading ? <p role="status" className="p-12 text-center text-sm text-slate-600">{tr("Loading audit logs…")}</p> : error ? null : data?.rows.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr>{["Date & Time", "User", "Action", "Module", "Details", "Status", ""].map((label) => <th key={label} className="px-3 py-3">{tr(label)}</th>)}</tr></thead><tbody className="divide-y">{data.rows.map((row) => <tr key={row.id} className="align-top"><td className="whitespace-nowrap px-3 py-3">{new Date(row.createdAt).toLocaleString()}</td><td className="px-3 py-3 font-medium">{row.actorName}</td><td className="px-3 py-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-800">{row.action.replaceAll("_", " ")}</span></td><td className="px-3 py-3">{row.entityType}</td><td className="max-w-56 truncate px-3 py-3">{row.entityId || "—"}</td><td className="px-3 py-3">{String(row.details.status || row.details.decision || "—")}</td><td className="px-3 py-3"><button onClick={() => setExpanded(expanded === row.id ? "" : row.id)} aria-expanded={expanded === row.id} className="text-blue-700 underline">{tr("Details")}</button></td></tr>)}</tbody></table>{expanded && data.rows.some((row) => row.id === expanded) && <AuditDetails row={data.rows.find((row) => row.id === expanded)!} onClose={() => setExpanded("")} />}</div>
        <ul className="divide-y md:hidden">{data.rows.map((row) => <li key={row.id} className="p-4"><button onClick={() => setExpanded(expanded === row.id ? "" : row.id)} aria-expanded={expanded === row.id} className="w-full text-left"><span className="flex items-start justify-between gap-2"><strong>{row.actorName}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] text-blue-800">{row.action.replaceAll("_", " ")}</span></span><span className="mt-1 block text-xs text-slate-600">{new Date(row.createdAt).toLocaleString()} · {row.entityType}</span><span className="mt-1 block truncate text-xs text-slate-500">{row.entityId || tr("No entity ID")}</span></button>{expanded === row.id && <div className="mt-3"><AuditDetails row={row} onClose={() => setExpanded("")} /></div>}</li>)}</ul>
        <footer className="flex items-center justify-between border-t px-4 py-3 text-xs text-slate-600"><span>{tr("Showing")} {(page - 1) * 10 + 1}–{(page - 1) * 10 + data.rows.length} {tr("of")} {data.total} {tr("logs")}</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="min-h-9 rounded border px-3 disabled:opacity-40">{tr("Previous")}</button><span>{page}/{Math.max(1, Math.ceil(data.total / 10))}</span><button disabled={page * 10 >= data.total} onClick={() => setPage((value) => value + 1)} className="min-h-9 rounded border px-3 disabled:opacity-40">{tr("Next")}</button></div></footer>
      </> : <p className="p-12 text-center text-sm text-slate-600">{tr("No audit records match this date range and filter set.")}</p>}
    </section>
  </section>;
}

function AuditDetails({ row, onClose }: { row: AuditLogRow; onClose: () => void }) {
  const tr = useAdminText();
  const details = [
    ["Actor", row.actorName], ["Action", row.action], ["Entity", `${row.entityType}${row.entityId ? ` · ${row.entityId}` : ""}`], ["Recorded", new Date(row.createdAt).toLocaleString()],
    ...Object.entries(row.details).map(([key, value]) => [key, value]),
  ];
  return <div className="rounded-lg bg-slate-50 p-4 text-sm"><div className="flex items-center justify-between"><h3 className="font-bold">{tr("Safe event details")}</h3><button onClick={onClose} className="text-xs text-blue-700 underline">{tr("Close")}</button></div><dl className="mt-3 grid gap-3 sm:grid-cols-2">{details.map(([key, value]) => <div key={key}><dt className="text-xs capitalize text-slate-500">{tr(String(key))}</dt><dd className="mt-1 break-all">{value}</dd></div>)}</dl><p className="mt-3 text-xs text-slate-500">{tr("Credentials, tokens, IP addresses and private payloads are not returned.")}</p></div>;
}
