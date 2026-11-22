"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { adminProgrammesService } from "../services/admin-programmes.service";
import { useAdminProgrammeForm } from "../hooks/use-admin-programme-form";
import { strategicProgrammeTemplates } from "../types/admin-programme-templates";
import type { ProgrammeDetail, ProgrammeInput } from "../types/admin-programmes.types";
import { programmeCoverUrl } from "@/lib/programme-cover-url";

const blank: ProgrammeInput = {
  code: "", name: "", slug: "", description: "", programmeType: "", targetAudience: "", durationWeeks: null,
  deliveryMode: null, coverImageUrl: null, learningObjectives: [], programContent: [], eligibility: "", startDate: null, endDate: null,
};

function fromProgramme(programme: ProgrammeDetail | null): ProgrammeInput {
  if (!programme) return blank;
  return {
    code: programme.code ?? "",
    name: programme.name,
    slug: programme.slug,
    description: programme.description ?? "",
    programmeType: programme.programmeType ?? "",
    targetAudience: programme.targetAudience ?? "",
    durationWeeks: programme.durationWeeks,
    deliveryMode: programme.deliveryMode ?? null,
    coverImageUrl: programme.coverImageUrl ?? null,
    learningObjectives: programme.learningObjectives,
    programContent: programme.programContent,
    eligibility: programme.eligibility ?? "",
    startDate: programme.startDate,
    endDate: programme.endDate,
  };
}

const inputClass = "min-h-11 w-full rounded-md border border-[#DCE4E0] bg-white px-3 text-sm";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminProgrammeFormPage({ programmeId }: { programmeId?: string }) {
  const router = useRouter();
  const vm = useAdminProgrammeForm(programmeId);
  const [formDraft, setFormDraft] = useState<ProgrammeInput | null>(null);
  const [templateKeyDraft, setTemplateKeyDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverModeDraft, setCoverModeDraft] = useState<"upload" | "url" | null>(null);
  const form = formDraft ?? fromProgramme(vm.data);
  const coverMode = coverModeDraft ?? (form.coverImageUrl?.startsWith("/api/public/website-media/") ? "upload" : "url");
  const savedTemplateKey = strategicProgrammeTemplates.find((item) => `TGE-${item.key.toUpperCase()}` === vm.data?.code)?.key ?? strategicProgrammeTemplates.find((item) => item.name === vm.data?.name)?.key ?? "";
  const templateKey = templateKeyDraft ?? savedTemplateKey;

  function updateForm(update: (current: ProgrammeInput) => ProgrammeInput) {
    setFormDraft((current) => update(current ?? fromProgramme(vm.data)));
  }

  function selectTemplate(key: string) {
    setTemplateKeyDraft(key);
    const template = strategicProgrammeTemplates.find((item) => item.key === key);
    if (!template) { setFormDraft(blank); return; }
    const current = form;
    setFormDraft({
      ...current,
      name: template.name,
      code: `TGE-${key.toUpperCase()}`,
      slug: slugify(template.name),
      programmeType: template.programmeType,
      targetAudience: template.targetAudience,
      description: template.description,
      programContent: template.programContent,
      eligibility: template.eligibility,
      learningObjectives: [],
    });
  }

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) { setError("Choose a PNG, JPEG or WebP image up to 3 MB."); return; }
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { setError("Please sign in again before uploading."); return; }
    setUploading(true); setError("");
    try { const result = await adminProgrammesService.uploadCover(token, file); updateForm((current) => ({ ...current, coverImageUrl: result.url })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Cover image could not be uploaded."); }
    finally { setUploading(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!accessToken) return;
    setSaving(true);
    setError("");
    try {
      const input = {
        ...form,
        code: templateKey === "foundation" || templateKey === "young-entrepreneur" || templateKey === "the-entrepreneur" ? `TGE-${templateKey.toUpperCase()}` : form.code || null,
        programContent: form.programContent.map((item) => item.trim()).filter(Boolean),
        deliveryMode: form.deliveryMode || null,
        coverImageUrl: form.coverImageUrl || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const saved = await adminProgrammesService.save(accessToken, programmeId ?? null, input);
      router.push(`/admin/programmes/${saved.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Programme details could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (vm.loading) return <p className="p-8 text-center">Loading programme…</p>;
  if (programmeId && vm.failed) return <div className="p-8 text-center"><p>Programme could not be loaded.</p><button onClick={vm.retry} className="mt-3 text-[#007A43]">Try again</button></div>;
  if (programmeId && vm.data?.status === "archived") return <div className="rounded-lg border bg-white p-8 text-center"><p className="text-sm text-slate-600">Archived programmes are read-only.</p><button type="button" onClick={() => router.push(`/admin/programmes/${vm.data?.id}`)} className="mt-3 text-sm font-semibold text-[#007A43]">Return to programme</button></div>;

  const selectedTemplate = strategicProgrammeTemplates.find((item) => item.key === templateKey);
  return <section className="mx-auto max-w-4xl">
    <div className="mb-5"><h1 className="text-2xl font-bold">{programmeId ? "Edit Programme" : "Create Programme"}</h1><p className="mt-1 text-sm text-[#52645A]">Select a pathway from TGE’s strategic plan. Its audience, entry requirements, and content are filled in for you.</p></div>
    {error && <p role="alert" className="mb-4 rounded bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <form onSubmit={submit} className="space-y-5 rounded-lg border border-[#E2E9E5] bg-white p-4 sm:p-6">
      <label className="grid gap-1.5 text-sm font-semibold">Programme Pathway
        <select required disabled={Boolean(programmeId && vm.data?.code && ["TGE-FOUNDATION", "TGE-YOUNG-ENTREPRENEUR", "TGE-THE-ENTREPRENEUR"].includes(vm.data.code))} value={templateKey} onChange={(event) => selectTemplate(event.target.value)} className={inputClass}>
          <option value="">Choose a TGE programme</option>
          {strategicProgrammeTemplates.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
        </select>
      </label>
      {selectedTemplate && <>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Programme Name<input required maxLength={200} value={form.name} onChange={(event) => updateForm((current) => ({ ...current, name: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Programme URL Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={220} value={form.slug} onChange={(event) => updateForm((current) => ({ ...current, slug: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Programme Type<input required maxLength={100} value={form.programmeType} onChange={(event) => updateForm((current) => ({ ...current, programmeType: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Target Audience<input required maxLength={500} value={form.targetAudience} onChange={(event) => updateForm((current) => ({ ...current, targetAudience: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Description<textarea required maxLength={10000} value={form.description} onChange={(event) => updateForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Eligibility<textarea required maxLength={10000} value={form.eligibility} onChange={(event) => updateForm((current) => ({ ...current, eligibility: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Programme Content (one item per line)<textarea required value={form.programContent.join("\n")} onChange={(event) => updateForm((current) => ({ ...current, programContent: event.target.value.split("\n") }))} className={inputClass} rows={5} /></label>
        </div>
        <div className="grid gap-4 rounded-lg bg-[#F5F8F6] p-4 sm:grid-cols-2">
          <div><p className="text-xs text-[#65716A]">Programme Type</p><p className="mt-1 font-semibold">{form.programmeType}</p></div>
          <div><p className="text-xs text-[#65716A]">Programme Code</p><p className="mt-1 font-semibold">{form.code}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-[#65716A]">Target Audience</p><p className="mt-1 text-sm">{form.targetAudience}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-[#65716A]">Description</p><p className="mt-1 text-sm">{form.description}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-[#65716A]">Eligibility and Entry Requirements</p><p className="mt-1 text-sm">{form.eligibility}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-[#65716A]">Programme Content</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{form.programContent.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Duration (weeks)<input required type="number" min="1" max="520" value={form.durationWeeks ?? ""} onChange={(event) => updateForm((current) => ({ ...current, durationWeeks: event.target.value ? Number(event.target.value) : null }))} className={inputClass} placeholder="Not specified in the strategic plan" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Delivery Mode<select required value={form.deliveryMode ?? ""} onChange={(event) => updateForm((current) => ({ ...current, deliveryMode: event.target.value || null }))} className={inputClass}><option value="">Select when confirmed</option><option>Online</option><option>In-person</option><option>Hybrid</option></select></label>
          <label className="grid gap-1.5 text-sm font-semibold">Start Date<input required type="date" max={form.endDate ?? undefined} value={form.startDate ?? ""} onChange={(event) => updateForm((current) => ({ ...current, startDate: event.target.value || null }))} className={inputClass} /></label>
          <label className="grid gap-1.5 text-sm font-semibold">End Date<input required type="date" min={form.startDate ?? undefined} value={form.endDate ?? ""} onChange={(event) => updateForm((current) => ({ ...current, endDate: event.target.value || null }))} className={inputClass} /></label>
          <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold">Cover image source</legend><label className="mr-4 text-sm"><input type="radio" checked={coverMode === "upload"} onChange={() => { setCoverModeDraft("upload"); updateForm((current) => ({ ...current, coverImageUrl: null })); }}/> Upload from computer</label><label className="text-sm"><input type="radio" checked={coverMode === "url"} onChange={() => { setCoverModeDraft("url"); updateForm((current) => ({ ...current, coverImageUrl: null })); }}/> Image URL</label></fieldset>
          {coverMode === "upload" ? (<label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Upload Cover Image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => { void uploadCover(event.target.files?.[0]); event.target.value = ""; }} className={inputClass} /><span className="text-xs font-normal text-slate-600">PNG, JPEG or WebP, up to 3 MB. {uploading ? "Uploading…" : ""}</span></label>) : (<label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Cover Image URL (optional)<input type="text" maxLength={500} value={form.coverImageUrl ?? ""} onChange={(event) => updateForm((current) => ({ ...current, coverImageUrl: event.target.value || null }))} className={inputClass} placeholder="https://…" /></label>)}
          {form.coverImageUrl && /^(https?:\/\/|\/api\/public\/website-media\/)/i.test(form.coverImageUrl) && <div className="relative h-40 overflow-hidden rounded-md bg-slate-100 sm:col-span-2"><Image src={programmeCoverUrl(form.coverImageUrl)} alt="Cover image preview" fill unoptimized sizes="(max-width: 640px) 100vw, 800px" className="object-cover" /></div>}
        </div>
      </>}
      <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#EDF1EE] pt-4 sm:flex-row"><button type="button" onClick={() => router.back()} className="min-h-11 rounded-md border px-4">Cancel</button><button disabled={saving || uploading || !selectedTemplate} className="min-h-11 rounded-md bg-[#007A43] px-5 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : programmeId ? "Save Changes" : "Create Programme"}</button></div>
    </form>
  </section>;
}
