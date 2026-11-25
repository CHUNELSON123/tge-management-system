"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Save } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { AdminMembersRequestError, adminMembersService } from "../services/admin-members.service";
import type { AdminDirectMemberInput } from "../types/admin-members.types";

const emptyDraft: AdminDirectMemberInput = { firstName: "", lastName: "", email: "", phone: null, location: null, dateOfBirth: null, gender: null, nationality: null, preferredLanguage: null, timezone: null, bio: null };

export function AdminMemberRegistrationPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [countries, setCountries] = useState<string[]>([]);
  const [timezones, setTimezones] = useState<string[]>([]);
  useEffect(() => { const frame = requestAnimationFrame(() => { const names = new Intl.DisplayNames(["en"], { type: "region" }); const entries: string[] = []; for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) { const code = String.fromCharCode(a, b); const name = names.of(code); if (name && name !== code) entries.push(name); } setCountries([...new Set(entries)].sort()); setTimezones(Intl.supportedValuesOf("timeZone")); }); return () => cancelAnimationFrame(frame); }, []);
  const [draft, setDraft] = useState<AdminDirectMemberInput>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  function update<K extends keyof AdminDirectMemberInput>(key: K, value: AdminDirectMemberInput[K]) { setDraft((current) => ({ ...current, [key]: value })); setFeedback(null); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.push("/admin/login"); return; }
    setBusy(true); setFeedback(null);
    try {
      const result = await adminMembersService.register(token, { ...draft, email: draft.email.trim().toLowerCase() });
      setDraft(emptyDraft);
      setFeedback({ kind: "success", text: result.invitationSent ? t("adminMemberRegistrationSuccess") : locale === "fr" ? "Le membre a été créé, mais l’invitation n’a pas pu être envoyée. Vérifiez la configuration du fournisseur de courriel, puis renvoyez-la depuis Utilisateurs et rôles." : "The member was created, but no invitation was sent. Open Users & Roles and choose Create activation link from the member’s actions." });
    } catch (error) {
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      setFeedback({ kind: "error", text: status === 409 ? t("adminDuplicateMemberEmail") : status === 403 ? t("adminRegistrationUnavailable") : t("adminMemberRegistrationError") });
    } finally { setBusy(false); }
  }

  const inputClass = "mt-1 h-10 w-full rounded-md border border-[#DCE5DF] bg-white px-3 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15";
  return <section className="mx-auto max-w-[1100px] space-y-5">
    <nav aria-label={t("breadcrumbNavigation")} className="flex flex-wrap items-center gap-2 text-sm text-[#5B665F]"><Link href="/" className="hover:text-[#075C32]">{t("home")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href="/admin" className="hover:text-[#075C32]">{t("adminPortal")}</Link><ChevronRight aria-hidden="true" size={14} /><Link href="/admin/members" className="hover:text-[#075C32]">{t("adminMembers")}</Link><ChevronRight aria-hidden="true" size={14} /><span aria-current="page" className="font-semibold text-[#075C32]">{t("adminAddMember")}</span></nav>
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold tracking-tight text-[#17211B]">{t("adminAddMember")}</h1><p className="mt-1 text-sm text-[#52645A]">{t("adminRegisterMemberIntro")}</p></div><div className="flex gap-2"><Link href="/admin/members" className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#D7E3DA] px-4 text-sm font-semibold text-[#075C32]">{t("adminCancel")}</Link><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#006B3B] px-5 text-sm font-bold text-white hover:bg-[#075C32] disabled:opacity-60"><Save aria-hidden="true" size={16} />{busy ? t("adminSaving") : t("adminAddMember")}</button></div></div>
      {feedback && <div role={feedback.kind === "error" ? "alert" : "status"} className={`rounded-lg border p-3 text-sm ${feedback.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{feedback.text}{feedback.kind === "success" && <Link href="/admin/members" className="ml-2 font-semibold underline">{t("adminBackToMembers")}</Link>}</div>}
      <p className="rounded-lg border border-[#DCE5DF] bg-[#F7FAF8] p-3 text-sm text-[#52645A]">{locale === "fr" ? "Si les courriels sont désactivés, créez un lien d’activation privé dans Utilisateurs et rôles après avoir créé le membre." : "If email is disabled, create a private activation link in Users & Roles after creating the member."}</p>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-[#E4EBE6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-bold text-[#17211B]">{t("adminPersonalInformation")}</h2><div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-xs font-semibold">{t("adminFirstName")} *</span><input required maxLength={100} value={draft.firstName} onChange={(event) => update("firstName", event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold">{t("adminLastName")} *</span><input required maxLength={100} value={draft.lastName} onChange={(event) => update("lastName", event.target.value)} className={inputClass} /></label>
          <label className="block sm:col-span-2"><span className="text-xs font-semibold">{t("adminEmail")} *</span><input type="email" required maxLength={255} value={draft.email} onChange={(event) => update("email", event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold">{t("adminPhone")}</span><input type="tel" required maxLength={30} value={draft.phone ?? ""} onChange={(event) => update("phone", event.target.value || null)} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold">{t("adminDateOfBirth")}</span><input type="date" required max={new Date().toISOString().slice(0, 10)} value={draft.dateOfBirth ?? ""} onChange={(event) => update("dateOfBirth", event.target.value || null)} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold">{t("adminGender")}</span><select required value={draft.gender ?? ""} onChange={(event) => update("gender", event.target.value || null)} className={inputClass}><option value="">Select gender</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option><option>Self-describe</option></select></label>
          <label className="block"><span className="text-xs font-semibold">{t("adminNationality")}</span><select required value={draft.nationality ?? ""} onChange={(event) => update("nationality", event.target.value || null)} className={inputClass}><option value="">Select nationality</option>{countries.map((country) => <option key={country}>{country}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold">{t("adminLocation")}</span><input required list="member-location-suggestions" placeholder="Search or enter city and country" maxLength={255} value={draft.location ?? ""} onChange={(event) => update("location", event.target.value || null)} className={inputClass} /></label>
          <label className="block"><span className="text-xs font-semibold"><datalist id="member-location-suggestions">{[...new Set([...countries, ...timezones.map((zone) => zone.split("/").slice(1).join(", ").replaceAll("_", " ")).filter(Boolean)])].map((place) => <option key={place} value={place}/>)}</datalist>{t("adminPreferredLanguage")}</span><select value={draft.preferredLanguage ?? ""} onChange={(event) => update("preferredLanguage", (event.target.value || null) as "en" | "fr" | null)} className={inputClass}><option value="">{t("adminNotRecorded")}</option><option value="en">English</option><option value="fr">Français</option></select></label>
          <label className="block sm:col-span-2"><span className="text-xs font-semibold">{t("adminTimezone")}</span><select value={draft.timezone ?? ""} onChange={(event) => update("timezone", event.target.value || null)} className={inputClass}><option value="">Select timezone (optional)</option>{timezones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
        </div></section>
        <section className="rounded-xl border border-[#E4EBE6] bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-bold text-[#17211B]">{t("adminBiography")}</h2><p className="mb-2 text-xs text-slate-600">Briefly describe the member’s background, business interests and goals. Example: I am a small business owner interested in sustainable agriculture.</p><textarea required rows={7} maxLength={250} value={draft.bio ?? ""} onChange={(event) => update("bio", event.target.value || null)} className="w-full rounded-md border border-[#DCE5DF] p-3 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15" /><p className="mt-2 text-xs text-[#65736A]">{draft.bio?.length ?? 0}/250</p></section>
      </div>
    </form>
  </section>;
}
