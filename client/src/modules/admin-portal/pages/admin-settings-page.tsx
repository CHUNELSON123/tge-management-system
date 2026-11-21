"use client";

import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { Building2, Settings, Globe2, Mail, Link2, ShieldCheck, Database, Activity, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminSettingsService, type OrganisationSettings } from "../services/admin-settings.service";
import { useAdminText } from "../hooks/use-admin-text";

const token = () => localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
const tabs = [["General", "general"], ["Email & Notifications", "email"], ["Appearance", "appearance"], ["Integrations", "integrations"], ["Security", "security"], ["Backup & Data", "backup"]] as const;
const fieldClass = "mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500";
const buttonClass = "rounded border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400";
function Card({ id, icon: Icon, title, description, children, className = "" }: { id?: string; icon: LucideIcon; title: string; description: string; children: ReactNode; className?: string }) {
  const tr = useAdminText();
  return <section id={id} className={`scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
    <div className="mb-4 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon size={21}/></span><div><h2 className="text-sm font-bold text-slate-950">{tr(title)}</h2><p className="mt-1 text-xs text-[#425b8a]">{tr(description)}</p></div></div>{children}
  </section>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { const tr = useAdminText(); return <label className="block text-xs font-medium text-[#172d57]">{tr(label)}{children}</label>; }
function Toggle({ label, checked, disabled, onChange }: { label: string; checked?: boolean; disabled?: boolean; onChange?: (value: boolean) => void }) {
  const tr = useAdminText();
  return <label className="flex items-center justify-between gap-3 py-1 text-xs text-[#172d57]"><span>{tr(label)}</span><input type="checkbox" role="switch" checked={checked ?? false} disabled={disabled} onChange={e => onChange?.(e.target.checked)} className="h-4 w-7 cursor-pointer accent-emerald-700 disabled:cursor-not-allowed"/></label>;
}
function Unavailable() { const tr = useAdminText(); return <p className="mt-3 text-xs text-slate-500">{tr("Not yet available")}</p>; }
export function AdminSettingsPage() {
  const tr = useAdminText();
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    adminSettingsService.get(token(), controller.signal).then(result => { setSettings(result.data); setCanEdit(result.canEdit); }).catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load settings."); });
    return () => controller.abort();
  }, []);
  function change<K extends keyof OrganisationSettings>(key: K, value: OrganisationSettings[K]) { setSettings(current => current ? { ...current, [key]: value } : current); setMessage(""); }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings || !canEdit || saving) return;
    setSaving(true); setError(""); setMessage("");
    try { const result = await adminSettingsService.save(token(), settings); setSettings(result.data); setMessage(tr("Changes saved.")); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }
  return <div className="mx-auto max-w-7xl text-[#101a30]">
    <form onSubmit={save}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold sm:text-3xl">{tr("Settings")}</h1><p className="mt-1 text-sm text-[#425b8a]">{tr("Manage platform settings, preferences and configurations.")}</p></div><button disabled={!settings || !canEdit || saving} className="hidden items-center gap-2 rounded bg-[#00753c] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:flex"><Save size={17}/>{tr(saving ? "Saving…" : "Save Changes")}</button></header>
      <nav aria-label="Settings sections" className="mb-3 flex gap-6 overflow-x-auto border-b border-slate-200 text-xs font-semibold text-[#172d57]">{tabs.map(([label, id], i) => <a key={id} href={`#${id}`} className={`shrink-0 px-2 py-3 ${i === 0 ? "border-b-2 border-emerald-600 text-emerald-700" : ""}`}>{tr(label)}</a>)}</nav>
      {error && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mb-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {!settings ? <p role="status" className="py-6 text-sm text-slate-600">{tr(error ? "Settings could not be loaded. Reload the page to try again." : "Loading settings…")}</p> : <>
      {!canEdit && <p className="mb-3 text-sm text-slate-600">{tr("You have read-only access to settings.")}</p>}
      <div id="general" className="grid scroll-mt-24 gap-3 lg:grid-cols-3">
        <Card icon={Building2} title="Organisation Information" description="Update your organisation details and contact information.">
          <div className="space-y-3"><Field label="Organisation Name"><input className={fieldClass} value={settings.name} maxLength={200} disabled={!canEdit || saving} onChange={e => change("name", e.target.value)}/></Field>
          <Field label="Email Address"><input type="email" className={fieldClass} value={settings.email} maxLength={255} disabled={!canEdit || saving} onChange={e => change("email", e.target.value)}/></Field>
          <Field label="Phone Number"><input type="tel" className={fieldClass} value={settings.phone} maxLength={50} disabled={!canEdit || saving} onChange={e => change("phone", e.target.value)}/></Field>
          <Field label="Address"><textarea className={fieldClass} rows={2} value={settings.address} maxLength={500} disabled={!canEdit || saving} onChange={e => change("address", e.target.value)}/></Field></div>
        </Card>
        <Card icon={Settings} title="Platform Preferences" description="Configure basic platform settings.">
          <div className="space-y-3"><Field label="Default Time Zone"><select disabled className={fieldClass}><option>{tr("Not configured")}</option></select></Field><div className="grid grid-cols-2 gap-2"><Field label="Date Format"><select disabled className={fieldClass}><option>{tr("Not configured")}</option></select></Field><Field label="Items Per Page"><select disabled className={fieldClass}><option>{tr("Not configured")}</option></select></Field></div>
          <Toggle label="Allow Public Registration" checked={settings.allowPublicRegistration} disabled={!canEdit || saving} onChange={v => change("allowPublicRegistration", v)}/><Toggle label="Require Email Verification" checked disabled/><Toggle label="Enable Newsletter Signup" disabled/><p className="text-xs text-slate-500">{tr("Registration controls membership applications. Email verification is required by the current account activation flow. Newsletter signup is unavailable.")}</p>
          <button disabled={!canEdit || saving} className="flex w-full items-center justify-center gap-2 rounded bg-[#00753c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:hidden"><Save size={16}/>{tr(saving ? "Saving…" : "Save Changes")}</button></div>
        </Card>
        <Card id="appearance" icon={Globe2} title="Language & Accessibility" description="Set language and accessibility preferences.">
          <div className="space-y-3"><Field label="Default Language"><select disabled className={fieldClass}><option>{tr("Not configured")}</option></select></Field><div className="text-xs text-[#172d57]">Supported Languages <p className="mt-2">{tr("English and French are available to users.")}</p></div><Toggle label="Enable Accessibility Features" disabled/><Toggle label="High Contrast Mode" disabled/><Field label="Font Size"><select disabled className={fieldClass}><option>{tr("Not configured")}</option></select></Field><Unavailable/></div>
        </Card>
        <Card id="email" icon={Mail} title="Email & Notifications" description="Configure email settings and notifications.">
          <div className="space-y-3"><Field label="From Email"><input disabled className={fieldClass} placeholder={tr("Managed by server configuration")}/></Field><div className="grid grid-cols-2 gap-2"><Field label="From Name"><input disabled className={fieldClass}/></Field><Field label="SMTP Server"><input disabled className={fieldClass}/></Field><Field label="SMTP Port"><input disabled className={fieldClass}/></Field><Toggle label="Use TLS" disabled/></div><button type="button" disabled className={buttonClass}>{tr("Send Test Email")}</button><p className="text-xs text-slate-500">Email is configured through the server&apos;s Resend provider.</p></div>
        </Card>
        <Card id="integrations" icon={Link2} title="Integrations" description="Manage third-party integrations.">
          <div className="space-y-3">{["Mailchimp", "Google Analytics", "Google Maps", "WhatsApp Business"].map(name => <div key={name} className="flex items-center justify-between gap-2 text-xs"><strong>{name}</strong><span className="ml-auto text-slate-500">{tr("Unavailable")}</span><button type="button" disabled className={buttonClass}>{tr("Configure")}</button></div>)}</div>
        </Card>
        <Card id="security" icon={ShieldCheck} title="Security" description="Manage security settings.">
          <div className="space-y-2"><Field label="Session Timeout"><input disabled className={fieldClass} value="14 days (server policy)" readOnly/></Field><Toggle label="Two-Factor Authentication" disabled/><Toggle label="Password Expiry (90 days)" disabled/><Toggle label="Login Notifications" disabled/><p className="text-xs text-slate-500">{tr("These security controls are not configured.")}</p><Link href="/admin/audit-log" className={`inline-block ${buttonClass}`}>{tr("View Audit Log")}</Link></div>
        </Card>
        <Card id="backup" icon={Database} title="Backup & Data" description="Manage backups, system health and data operations." className="lg:col-span-3">
          <div className="grid gap-5 md:grid-cols-3"><div><Toggle label="Automatic Backups" disabled/><Field label="Backup Frequency"><select disabled className={fieldClass}><option>{tr("Not configured")}</option></select></Field><p className="mt-3 text-xs text-slate-500">{tr("Last backup: unavailable")}</p></div>
          <div className="md:border-l md:border-slate-200 md:pl-5"><div className="flex items-center gap-2 font-bold"><Activity size={18} className="text-emerald-700"/>{tr("System Health")}</div><p className="mt-2 text-xs text-slate-500">{tr("Live health monitoring is not connected.")}</p><button type="button" disabled className={`mt-3 ${buttonClass}`}>{tr("View System Status")}</button></div>
          <div className="space-y-2 md:border-l md:border-slate-200 md:pl-5"><h3 className="text-sm font-bold">{tr("Data Management")}</h3>{["Run Manual Backup", "Restore from Backup", "Clear Cache"].map(label => <button type="button" key={label} disabled className={`block w-full ${buttonClass}`}>{tr(label)}</button>)}<Unavailable/></div></div>
        </Card>
      </div></>}
    </form>
  </div>;
}
