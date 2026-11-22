"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Download, GraduationCap, UserRound, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminText } from "../hooks/use-admin-text";
import { adminReportsService, exportAdminReport } from "../services/admin-reports.service";
import { adminDashboardService } from "../services/admin-dashboard.service";
import type { AdminReportsData, CountByStatus } from "../types/admin-reports.types";
import type { AdminDashboard } from "../types/admin-dashboard.types";

type MonthCount = { month: string; count: number };
const tabs = ["Overview", "Members", "Programmes", "Events", "Mentorship", "Business Directory", "Website Content"] as const;
type Tab = typeof tabs[number];
const accessToken = () => localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
const dateRange = () => { const now = new Date(); return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) }; };
const label = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const monthLabel = (s: string) => new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${s}-01T00:00:00Z`));
const number = (n: number) => new Intl.NumberFormat("en").format(n);
const card = "rounded-md border border-[#e6edf3] bg-white p-4";

function Chart({ title, description, rows, comparison, kind = "bar" }: { title: string; description: string; rows: MonthCount[]; comparison?: MonthCount[]; kind?: "line" | "bar" }) {
  const tr = useAdminText();
  const max = Math.max(1, ...rows.map(r => r.count), ...(comparison || []).map(r => r.count));
  const width = 600, height = 200, left = 40, top = 12, plotW = 540, plotH = 145;
  const x = (i: number) => left + plotW * (i + .5) / Math.max(rows.length, 1);
  const y = (n: number) => top + plotH - n / max * plotH;
  const points = rows.map((r, i) => `${x(i)},${y(r.count)}`).join(" ");
  return <section className={card}><h2 className="font-bold text-slate-950">{tr(title)}</h2><p className="mt-1 text-xs text-[#53678d]">{tr(description)}</p>
    <div className="mt-3 overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-52 min-w-[400px] w-full" role="img" aria-label={`${title}. ${rows.map(r => `${r.month}: ${r.count}`).join(", ")}${comparison ? `; completions: ${comparison.map(r => `${r.month}: ${r.count}`).join(", ")}` : ""}`}>
      {[0,1,2,3,4].map(i => <g key={i}><line x1={left} x2={left+plotW} y1={top+plotH*i/4} y2={top+plotH*i/4} stroke="#edf1f6"/><text x={left-7} y={top+plotH*i/4+4} textAnchor="end" fontSize="11" fill="#435c8e">{number(Math.round(max*(4-i)/4))}</text></g>)}
      {kind === "line" ? <><polygon points={`${x(0)},${top+plotH} ${points} ${x(rows.length-1)},${top+plotH}`} fill="#e1f4e9"/><polyline points={points} fill="none" stroke="#008a3d" strokeWidth="3"/>{rows.map((r,i) => <circle key={r.month} cx={x(i)} cy={y(r.count)} r="4" fill="#008a3d"/>)}</> : rows.map((r,i) => { const bw = Math.min(22, plotW / Math.max(rows.length,1) / 3); return <g key={r.month}><rect x={x(i)-bw-1} y={y(r.count)} width={bw} height={top+plotH-y(r.count)} fill="#00753d"/><rect x={x(i)+1} y={y(comparison?.[i]?.count || 0)} width={bw} height={top+plotH-y(comparison?.[i]?.count || 0)} fill="#76d5a4"/></g>; })}
      {rows.map((r,i) => <text key={r.month} x={x(i)} y={top+plotH+22} textAnchor="middle" fontSize="10" fill="#435c8e">{monthLabel(r.month)}</text>)}
    </svg></div><div className="flex justify-center gap-5 text-xs text-[#243b6b]"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-700"/>{tr(kind === "line" ? "Accounts created" : "Enrollments")}</span>{comparison && <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-300"/>{tr("Completions")}</span>}</div>
  </section>;
}
function StatusPanel({ title, note, rows }: { title: string; note: string; rows: CountByStatus[] }) {
  const tr = useAdminText();
  const max = Math.max(1, ...rows.map(r => r.count));
  return <section className={card}><h2 className="font-bold">{tr(title)}</h2><p className="mt-1 text-xs text-[#53678d]">{tr(note)}</p><div className="mt-4 space-y-3">{rows.length ? rows.map(row => <div key={row.status} className="grid grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3 text-sm"><span>{label(row.status)}</span><span className="h-2 rounded bg-slate-100"><span className="block h-full rounded bg-emerald-700" style={{ width: `${row.count/max*100}%` }}/></span><strong>{number(row.count)}</strong></div>) : <p className="py-5 text-sm text-slate-500">{tr("No records for this view.")}</p>}</div></section>;
}
function Distribution({ rows }: { rows: CountByStatus[] }) {
  const tr = useAdminText();
  const colors = ["#087344", "#006dff", "#48aaf3", "#ffad27"];
  const total = rows.reduce((n,r) => n+r.count, 0);
  let start = 0;
  const segments = rows.map((r,i) => { const previous = start; start += total ? r.count/total*100 : 0; return `${colors[i%colors.length]} ${previous}% ${start}%`; });
  return <section className={card}><h2 className="font-bold">{tr("Member Distribution")}</h2><p className="mt-1 text-xs text-[#53678d]">{tr("By account status")}</p><div className="mt-5 flex flex-wrap items-center justify-center gap-5"><div className="grid h-32 w-32 place-items-center rounded-full" style={{ background: total ? `conic-gradient(${segments.join(",")})` : "#e9eef1" }}><div className="grid h-20 w-20 place-content-center rounded-full bg-white text-center"><strong>{number(total)}</strong><span className="text-[10px] text-[#425b8a]">{tr("Member accounts")}</span></div></div><ul className="space-y-2 text-xs">{rows.map((row,i) => <li key={row.status}><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{background:colors[i%colors.length]}}/>{label(row.status)} <strong>{number(row.count)}</strong></li>)}</ul></div></section>;
}
export function AdminReportsPage() {
  const tr = useAdminText();
  const [draft, setDraft] = useState(dateRange);
  const [range, setRange] = useState(dateRange);
  const [tab, setTab] = useState<Tab>("Overview");
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [activity, setActivity] = useState<AdminDashboard["recentActivity"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    adminReportsService.load(accessToken(), range.from, range.to, controller.signal).then(result => { setData(result); setError(""); }).catch((e: unknown) => { if (!controller.signal.aborted) { setData(null); setError(e instanceof Error ? e.message : "Reports could not be loaded."); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    adminDashboardService.getDashboard(accessToken(), range, controller.signal).then(result => setActivity(result.recentActivity)).catch(() => { if (!controller.signal.aborted) setActivity(null); });
    return () => controller.abort();
  }, [range, version]);
  function apply() {
    if (!draft.from || !draft.to || draft.from > draft.to || Date.parse(draft.to)-Date.parse(draft.from)>365*86400000) { setError("Choose a valid date range of up to 366 days."); return; }
    setLoading(true); setError(""); setRange({ ...draft });
  }
  async function download() {
    setExporting(true); setError("");
    try { const blob = await exportAdminReport(accessToken(), range.from, range.to); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `tge-report-${range.from}-${range.to}.csv`; a.click(); URL.revokeObjectURL(url); }
    catch (e) { setError(e instanceof Error ? e.message : "Report export failed."); }
    finally { setExporting(false); }
  }
  const s = data?.snapshot;
  const cards: Array<{ title: string; value: number | undefined; note: string; icon: LucideIcon; color: string }> = [
    {title:"Total Users",value:s?.totalUsers,note:"Current accounts",icon:UsersRound,color:"text-green-700"},
    {title:"Active Members",value:s?.activeMemberAccounts,note:"Active accounts",icon:UserRound,color:"text-blue-600"},
    {title:"Programmes",value:s?.publishedProgrammes,note:"Published",icon:GraduationCap,color:"text-violet-600"},
    {title:"Events",value:s?.publishedEventsInRange,note:"Published in range",icon:CalendarDays,color:"text-green-700"},
    {title:"Website Visits",value:undefined,note:"Tracking unavailable",icon:BarChart3,color:"text-orange-500"},
  ];
  return <section className="mx-auto max-w-7xl space-y-4 text-[#101a30]">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{tr("Reports & Analytics")}</h1><p className="mt-1 text-sm text-[#31558f]">{tr("Track platform performance, user engagement and generate detailed reports.")}</p></div><div className="flex w-full flex-wrap items-end gap-2 xl:w-auto"><label className="text-xs text-[#31558f]">{tr("From (UTC)")}<input type="date" value={draft.from} onChange={e => setDraft({...draft,from:e.target.value})} className="mt-1 block h-10 rounded border border-slate-200 bg-white px-2 text-sm"/></label><label className="text-xs text-[#31558f]">{tr("To (UTC)")}<input type="date" value={draft.to} onChange={e => setDraft({...draft,to:e.target.value})} className="mt-1 block h-10 rounded border border-slate-200 bg-white px-2 text-sm"/></label><button type="button" onClick={apply} className="h-10 rounded border border-emerald-700 px-3 text-sm font-medium text-emerald-800">{tr("Apply")}</button><button type="button" onClick={download} disabled={!data || loading || exporting} className="flex h-10 flex-1 items-center justify-center gap-2 rounded bg-[#006b3b] px-4 text-sm font-semibold text-white disabled:opacity-50 xl:flex-none"><Download size={16}/>{tr(exporting ? "Exporting…" : "Export Report")}</button></div></header>
    {error && <div role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-800">{error}<button onClick={() => { setLoading(true); setVersion(v => v+1); }} className="ml-3 underline">Try again</button></div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{cards.map(({title,value,note,icon:Icon,color}) => <article key={title} className="flex min-h-24 items-center gap-3 rounded-md border border-[#edf3f5] bg-[#f6faf9] p-4"><Icon size={30} className={`shrink-0 ${color}`}/><div><strong className="block text-xl text-slate-950">{loading ? "—" : value === undefined ? "—" : number(value)}</strong><span className="block text-xs text-[#234479]">{tr(title)}</span><span className="text-[11px] text-slate-500">{tr(note)}</span></div></article>)}</div>
    <nav aria-label="Report sections" className="flex gap-4 overflow-x-auto border-b border-slate-200">{tabs.map(t => <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab===t ? "page" : undefined} className={`min-h-11 shrink-0 border-b-2 px-2 text-sm ${tab===t ? "border-emerald-700 font-semibold text-emerald-800" : "border-transparent text-[#31558f]"}`}>{tr(t)}</button>)}</nav>
    {loading ? <p role="status" className={`${card} py-12 text-center text-sm`}>{tr("Loading reports…")}</p> : !data ? <p className="text-sm text-slate-600">{tr("Reports are unavailable.")}</p> : <>
      {(tab==="Overview" || tab==="Members" || tab==="Programmes") && <div className="grid gap-3 lg:grid-cols-2">{(tab==="Overview" || tab==="Members") && <Chart title="User Growth" description="New non-deleted user accounts created per month in the selected range." rows={data.userRegistrationsByMonth} kind="line"/>}{(tab==="Overview" || tab==="Programmes") && <Chart title="Programme Registrations" description="Enrollments and recorded completions by month in the selected range." rows={data.programmeEnrollmentsByMonth} comparison={data.programmeCompletionsByMonth}/>}</div>}
      {tab==="Overview" && <div className="grid gap-3 lg:grid-cols-3"><section className={card}><h2 className="font-bold">{tr("Top Content Pages")}</h2><p className="mt-5 text-sm text-slate-500">{tr("Page view tracking is not available yet.")}</p></section><Distribution rows={data.memberAccountsByStatus}/><section className={card}><div className="flex justify-between gap-2"><h2 className="font-bold">{tr("Recent Activity")}</h2><Link href="/admin" className="text-xs text-emerald-700 underline">{tr("View dashboard")}</Link></div>{activity?.length ? <ul className="mt-4 space-y-3">{activity.slice(0,5).map(item => <li key={item.id} className="text-xs text-[#31558f]"><span className="block font-medium text-[#132b59]">{label(item.kind.replaceAll("-"," "))}{item.subject ? ` · ${item.subject}` : ""}</span>{new Date(item.occurredAt).toLocaleString()}</li>)}</ul> : <p className="mt-5 text-sm text-slate-500">{tr(activity ? "No recent activity." : "Activity unavailable.")}</p>}</section></div>}
      {tab==="Members" && <StatusPanel title="Member Account Status" note="Current account status, separate from membership approval." rows={data.memberAccountsByStatus}/>}
      {tab==="Programmes" && <div className="grid gap-3 lg:grid-cols-2"><StatusPanel title="Programmes by Status" note="Current programme status." rows={data.programmesByStatus}/><StatusPanel title="Enrollments by Status" note="Enrollments created in the selected range." rows={data.enrollmentsByStatusInRange}/></div>}
      {tab==="Events" && <div className="grid gap-3 lg:grid-cols-2"><StatusPanel title="Events by Status" note="Current event status." rows={data.eventsByStatus}/><StatusPanel title="Event Registrations" note="Registrations created in the selected range." rows={data.eventRegistrationsByStatusInRange}/></div>}
      {tab==="Mentorship" && <div className="grid gap-3 lg:grid-cols-2"><StatusPanel title="Mentoring Sessions" note="Scheduled in the selected range." rows={data.mentoringSessionsByStatusInRange}/><StatusPanel title="Mentoring Objectives" note="Current objective status." rows={data.mentoringObjectivesByStatus}/></div>}
      {tab==="Business Directory" && <StatusPanel title="Businesses by Status" note="Operational and publication statuses." rows={data.businessesByStatus.map(r => ({status:`${r.operationalStatus} · ${r.publicationStatus}`,count:r.count}))}/>}
      {tab==="Website Content" && <StatusPanel title="Website Content" note="Pages and news by status. Page view tracking is unavailable." rows={data.websiteContentByStatus.map(r => ({status:`${r.type} · ${r.status}`,count:r.count}))}/>}
      <p className="text-xs text-slate-500">Dates use UTC. Snapshot totals reflect current records; monthly charts use the selected range.</p>
    </>}
  </section>;
}
