"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, RotateCw, Search, Shield, UserPlus, UserRoundX, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminText } from "../hooks/use-admin-text";
import { adminUsersService } from "../services/admin-users.service";
import { adminAccessService } from "../services/admin-access.service";
import type { AdminUserRow, AdminUsersList } from "../types/admin-users.types";

type RoleOption = { id: string; name: string };
const token = () => localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
const statusText = (s: string) => ({ ACTIVE: "Active", PENDING_ACTIVATION: "Pending invitation", SUSPENDED: "Suspended", DEACTIVATED: "Deactivated" }[s] || s);
const statusClass = (s: string) => s === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : s === "PENDING_ACTIVATION" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700";
const roleClass = (role: string) => /admin/i.test(role) ? "bg-violet-100 text-violet-800" : /mentor/i.test(role) ? "bg-amber-100 text-amber-800" : /member/i.test(role) ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-700";
const inputClass = "min-h-10 w-full rounded-md border border-[#e0e8f0] bg-white px-3 text-sm text-[#142b60]";
const initialFilters = { search: "", roleId: "", status: "" };
function Avatar({ user }: { user: AdminUserRow }) {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!user.hasProfilePhoto) return;
    const controller = new AbortController(); let url: string | null = null;
    adminUsersService.photo(token(), user.id, controller.signal).then(blob => { if (!controller.signal.aborted) { url = URL.createObjectURL(blob); setPhoto(url); } }).catch(() => {});
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [user.id, user.hasProfilePhoto]);
  return <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 bg-cover bg-center text-xs font-bold text-[#183263]" style={photo ? { backgroundImage: `url("${photo}")` } : undefined}>{!photo && <>{(user.firstName[0] || "").toUpperCase()}{(user.lastName[0] || "").toUpperCase()}</>}</span>;
}
function RoleBadge({ role }: { role: string }) { return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${roleClass(role)}`}>{role}</span>; }
function Actions({ user, resend }: { user: AdminUserRow; resend: (email: string) => void }) {
  const tr = useAdminText();
  return <details className="relative"><summary aria-label={`Actions for ${user.firstName} ${user.lastName}`} className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded text-blue-800 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"><MoreHorizontal size={19}/></summary><div className="absolute right-0 z-20 w-40 rounded-md border bg-white p-1 text-sm shadow-lg"><Link href={`/admin/users-roles/${user.id}`} className="block rounded px-3 py-2 hover:bg-slate-50">{tr("View details")}</Link>{user.status === "PENDING_ACTIVATION" && <button type="button" onClick={() => resend(user.email)} className="w-full rounded px-3 py-2 text-left hover:bg-slate-50">{tr("Resend invitation")}</button>}</div></details>;
}
export function AdminUsersPage() {
  const tr = useAdminText();
  const [data, setData] = useState<AdminUsersList | null>(null);
  const [filterRoles, setFilterRoles] = useState<RoleOption[]>([]);
  const [inviteRoles, setInviteRoles] = useState<RoleOption[]>([]);
  const [canManageRoles, setCanManageRoles] = useState(false);
  const [canViewAudit, setCanViewAudit] = useState(false);
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [invite, setInvite] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => { setFilters(draft); setPage(1); setSelected([]); }, 350); return () => window.clearTimeout(timer); }, [draft]);
  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try { const result = await adminUsersService.list(token(), { ...filters, page, pageSize }, signal); if (!signal.aborted) { setData(result); setError(""); } }
    catch (e) { if (!signal.aborted) { setData(null); setError(e instanceof Error ? e.message : "Users could not be loaded."); } }
    finally { if (!signal.aborted) setLoading(false); }
  }, [filters, page, pageSize]);
  useEffect(() => { const c = new AbortController(); const frame = requestAnimationFrame(() => void load(c.signal)); return () => { cancelAnimationFrame(frame); c.abort(); }; }, [load, version]);
  useEffect(() => {
    const c = new AbortController();
    void Promise.all([adminUsersService.filterRoles(token(), c.signal), adminUsersService.assignableRoles(token(), c.signal), adminAccessService.getAccess(token(), c.signal)])
      .then(([allRoles, assignable, access]) => { if (!c.signal.aborted) { setFilterRoles(allRoles); setInviteRoles(assignable); setCanManageRoles(access.roleName === "System Administrator" && access.permissions.includes("roles.manage")); setCanViewAudit(access.permissions.includes("audit.view")); setOptionsError(""); } })
      .catch(() => { if (!c.signal.aborted) setOptionsError("Role options could not be loaded. Reload the page to try again."); });
    return () => c.abort();
  }, []);
  function apply(e?: FormEvent) { e?.preventDefault(); setPage(1); setSelected([]); setFilters({...draft}); }
  function reset() { setDraft(initialFilters); setFilters({...initialFilters}); setPage(1); setSelected([]); }
  async function resend(email: string) { setNotice(""); setError(""); try { await adminUsersService.resendInvitation(token(), email); setNotice(`Invitation resent to ${email}.`); } catch (e) { setError(e instanceof Error ? e.message : "Invitation could not be resent."); } }
  const summary = data?.summary;
  const stats: Array<{title: string; value: number | undefined; note: string; icon: LucideIcon; color: string}> = [
    {title:"Total Users",value:summary?.totalUsers,note:"Current accounts",icon:UsersRound,color:"text-green-700"},
    {title:"User Roles",value:summary?.roles,note:"Configured roles",icon:Shield,color:"text-violet-700"},
    {title:"New Users",value:summary?.newUsers,note:"Last 30 days",icon:UserPlus,color:"text-blue-600"},
    {title:"Inactive Users",value:summary?.inactiveUsers,note:"Suspended or deactivated",icon:UserRoundX,color:"text-red-600"},
  ];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  const allSelected = !!data?.rows.length && data.rows.every(row => selected.includes(row.id));
  function toggleAll() { setSelected(allSelected ? [] : data?.rows.map(row => row.id) || []); }
  function toggleOne(id: string) { setSelected(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); }
  return <section className="mx-auto max-w-7xl space-y-4 text-[#101a30]">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{tr("Users & Roles")}</h1><p className="mt-1 text-sm text-[#31558f]">{tr("Manage user accounts, roles and permissions across the platform.")}</p></div><button type="button" disabled={!inviteRoles.length} onClick={() => setInvite(true)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#006b3b] px-5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"><Plus size={18}/>{tr("Add User")}</button></header>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map(({title,value,note,icon:Icon,color}) => <article key={title} className="flex min-h-24 items-center gap-4 rounded-md border border-[#eff4f5] bg-[#f6faf9] p-4"><Icon className={`shrink-0 ${color}`} size={31}/><div><strong className="block text-xl text-slate-950">{loading || value === undefined ? "—" : value.toLocaleString()}</strong><span className="block text-xs text-[#294b85]">{tr(title)}</span><span className="text-[11px] text-slate-500">{tr(note)}</span></div></article>)}</div>
    <form onSubmit={apply} className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(200px,2fr)_1fr_1fr_auto_auto]"><label className="relative col-span-2 lg:col-span-1"><Search aria-hidden="true" className="absolute left-3 top-3 text-[#506aa0]" size={18}/><input aria-label="Search users" placeholder={tr("Search users by name, email or role…")} maxLength={120} value={draft.search} onChange={e => setDraft({...draft,search:e.target.value})} className={`${inputClass} pl-10`}/></label><select aria-label="Filter by role" value={draft.roleId} onChange={e => setDraft({...draft,roleId:e.target.value})} className={inputClass}><option value="">{tr("All Roles")}</option>{filterRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select aria-label="Filter by status" value={draft.status} onChange={e => setDraft({...draft,status:e.target.value})} className={inputClass}><option value="">{tr("All Statuses")}</option><option value="ACTIVE">{tr("Active")}</option><option value="PENDING_ACTIVATION">{tr("Pending invitation")}</option><option value="SUSPENDED">{tr("Suspended")}</option><option value="DEACTIVATED">{tr("Deactivated")}</option></select><button type="button" onClick={reset} className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#e0e8f0] bg-white px-4 text-sm text-[#142b60]"><RotateCw size={15}/>{tr("Reset")}</button></form>
    {(canManageRoles || canViewAudit) && <div className="flex gap-4 text-sm">{canManageRoles && <Link href="/admin/users-roles/roles" className="font-medium text-emerald-700 hover:underline">{tr("Manage roles & permissions")}</Link>}{canViewAudit && <Link href="/admin/audit-log" className="font-medium text-emerald-700 hover:underline">{tr("Audit log")}</Link>}</div>}
    {optionsError && <p role="alert" className="rounded bg-amber-50 p-3 text-sm text-amber-900">{optionsError}</p>}{notice && <p role="status" className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}{error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-800">{error}<button type="button" onClick={() => setVersion(v => v+1)} className="ml-2 underline">Try again</button></p>}
    <section aria-label="Users" className="rounded-md border border-[#e6edf3] bg-white">{loading ? <p role="status" className="p-12 text-center text-sm text-slate-600">{tr("Loading users…")}</p> : data?.rows.length ? <>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f4f6f8] text-xs text-[#122958]"><tr><th className="px-4 py-3"><input type="checkbox" aria-label="Select all users on this page" checked={allSelected} onChange={toggleAll}/></th>{["Name","Email","Role","Status","Last Login","Actions"].map(value => <th key={value} className="px-3 py-3">{tr(value)}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.rows.map(user => <tr key={user.id}><td className="px-4"><input type="checkbox" aria-label={`Select ${user.firstName} ${user.lastName}`} checked={selected.includes(user.id)} onChange={() => toggleOne(user.id)}/></td><td className="px-3 py-2"><Link href={`/admin/users-roles/${user.id}`} className="flex items-center gap-3 font-semibold text-[#122958] hover:underline"><Avatar user={user}/>{user.firstName} {user.lastName}</Link></td><td className="px-3 py-2 text-xs text-[#31558f]">{user.email}</td><td className="px-3 py-2"><RoleBadge role={user.role.name}/></td><td className="px-3 py-2"><span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(user.status)}`}>{tr(statusText(user.status))}</span></td><td className="px-3 py-2 text-xs text-[#31558f]">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td><td className="px-3 py-2"><Actions user={user} resend={email => void resend(email)}/></td></tr>)}</tbody></table></div>
      <ul className="divide-y divide-slate-100 md:hidden">{data.rows.map(user => <li key={user.id} className="flex items-center gap-3 px-3 py-2"><Avatar user={user}/><Link href={`/admin/users-roles/${user.id}`} className="min-w-0 flex-1 text-xs font-semibold text-[#122958]">{user.firstName} {user.lastName}<span className="block truncate pt-1 font-normal text-[#31558f]">{user.email}</span></Link><div className="w-28"><RoleBadge role={user.role.name}/><span className="mt-1 block text-xs text-[#122958]"><span className={`mr-1 inline-block h-2 w-2 rounded-full ${user.status === "ACTIVE" ? "bg-green-700" : "bg-rose-500"}`}/>{tr(statusText(user.status))}</span></div><Actions user={user} resend={email => void resend(email)}/></li>)}</ul>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-[#31558f]"><span>Showing {(page-1)*pageSize+1}–{(page-1)*pageSize+data.rows.length} of {data.total.toLocaleString()} users{selected.length ? ` · ${selected.length} selected` : ""}</span><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={page<=1} onClick={() => {setPage(v => v-1);setSelected([]);}} className="grid h-9 w-9 place-items-center rounded border disabled:opacity-40"><ChevronLeft size={16}/></button><span>Page {page} of {totalPages}</span><button type="button" aria-label="Next page" disabled={page>=totalPages} onClick={() => {setPage(v => v+1);setSelected([]);}} className="grid h-9 w-9 place-items-center rounded border disabled:opacity-40"><ChevronRight size={16}/></button><select aria-label="Users per page" value={pageSize} onChange={e => {setPageSize(Number(e.target.value));setPage(1);setSelected([]);}} className="h-9 rounded border bg-white px-2"><option value={10}>10 per page</option><option value={20}>20 per page</option><option value={50}>50 per page</option></select></div></footer>
    </> : <p className="p-12 text-center text-sm text-slate-600">{tr(error ? "Unable to display users." : "No users match these filters.")}</p>}</section>
    {invite && <InviteUser roles={inviteRoles} onClose={() => setInvite(false)} onCreated={(sent) => {setInvite(false);setPage(1);setVersion(v => v+1);setNotice(sent ? "Invitation sent successfully." : "The account was created, but the invitation could not be sent. Use Resend invitation to try again.");}}/>}
  </section>;
}
function InviteUser({ roles, onClose, onCreated }: { roles: RoleOption[]; onClose: () => void; onCreated: (sent: boolean) => void }) {
  const tr = useAdminText();
  const [firstName,setFirst] = useState(""); const [lastName,setLast] = useState(""); const [email,setEmail] = useState(""); const [phone,setPhone] = useState(""); const [roleId,setRole] = useState(""); const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const result = await adminUsersService.create(token(), { firstName:firstName.trim(), lastName:lastName.trim(), email:email.trim(), phone:phone.trim() || undefined, roleId }); onCreated(result.invitationSent); } catch (reason) { setError(reason instanceof Error ? reason.message : "Invitation could not be sent."); } finally { setBusy(false); } }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-5"><form onSubmit={e => void submit(e)} role="dialog" aria-modal="true" aria-labelledby="invite-title" className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"><h2 id="invite-title" className="text-xl font-bold">{tr("Invite User")}</h2><p className="text-sm text-slate-600">{tr("The user receives an activation email and sets their own password.")}</p>{error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">{tr("First name")}<input required maxLength={100} value={firstName} onChange={e => setFirst(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"/></label><label className="text-sm font-semibold">{tr("Last name")}<input required maxLength={100} value={lastName} onChange={e => setLast(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"/></label></div><label className="block text-sm font-semibold">{tr("Email")}<input required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"/></label><label className="block text-sm font-semibold">{tr("Phone (optional)")}<input maxLength={30} value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"/></label><label className="block text-sm font-semibold">{tr("Role")}<select required value={roleId} onChange={e => setRole(e.target.value)} className="mt-1 min-h-11 w-full rounded border bg-white px-3"><option value="">{tr("Select role")}</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded border px-4">{tr("Cancel")}</button><button disabled={busy || !roleId} className="min-h-11 rounded bg-[#006b3b] px-4 font-semibold text-white disabled:opacity-50">{tr(busy ? "Sending…" : "Send Invitation")}</button></div></form></div>;
}
