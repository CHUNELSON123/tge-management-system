"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Mail, Phone, ShieldCheck, UserRound, UsersRound, CalendarDays, ChartNoAxesCombined } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { membershipApplicationService, MembershipApplicationRequestError } from "../services/membership-application.service";

export default function MembershipApplicationPage() {
  const { t, locale } = useLanguage();
  const [countries, setCountries] = useState<string[]>([]); const [timezones, setTimezones] = useState<string[]>([]);
  useEffect(() => { const names = new Intl.DisplayNames(["en"], { type: "region" }); const entries: string[] = []; for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) { const code = String.fromCharCode(a, b); const name = names.of(code); if (name && name !== code) entries.push(name); } const timer = requestAnimationFrame(() => { setCountries([...new Set(entries)].sort()); setTimezones(Intl.supportedValuesOf("timeZone")); }); return () => cancelAnimationFrame(timer); }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<"validation" | "unavailable" | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    setFailure(null);
    setSubmitting(true);
    try {
      await membershipApplicationService.submit({
        firstName: String(form.get("firstName") || "").trim(),
        lastName: String(form.get("lastName") || "").trim(),
        email: String(form.get("email") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        location: String(form.get("location") || "").trim(), dateOfBirth: String(form.get("dateOfBirth") || ""), gender: String(form.get("gender") || ""), nationality: String(form.get("nationality") || ""), preferredLanguage: String(form.get("preferredLanguage") || "") || null, timezone: String(form.get("timezone") || "") || null, bio: String(form.get("bio") || "").trim(),
      });
      setSubmitted(true);
    } catch (error: unknown) {
      setFailure(error instanceof MembershipApplicationRequestError ? error.kind : "unavailable");
    } finally { setSubmitting(false); }
  }

  const inputClass = "mt-1.5 min-h-11 w-full rounded-md border border-[#DCE3DF] bg-white py-2.5 pl-10 pr-3 text-sm font-normal text-[#26352C] placeholder:text-[#69736D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16854D] disabled:bg-[#F3F5F3]";
  const benefitIcon = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF2EC] text-[#087B49]";

  return <main className="bg-[#FAFBFA] text-[#141B17]">
    <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-5 sm:px-8 lg:px-12">
      <nav aria-label={t("breadcrumbNavigation")} className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#59675E]"><Link href="/" className="hover:text-[#087B49]">{t("home")}</Link><span aria-hidden="true">›</span><span aria-current="page" className="font-semibold text-[#087B49]">{t("applyForMembership")}</span></nav>
      <div className="grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 xl:gap-24">
        <section className="py-3 lg:py-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("membershipApplicationEyebrow")}</p>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">{t("membershipApplicationHeading")}<span className="mt-1 block text-[#086B3E]">{t("membershipApplicationHeadingGreen")}</span></h1>
          <div className="mt-4 h-0.5 w-12 bg-[#16854D]" />
          <p className="mt-5 max-w-md text-sm leading-7 text-[#47534B]">{t("membershipApplicationIntro")}</p>
          <div className="mt-7 space-y-5 sm:space-y-6">
            <div className="flex gap-4"><span className={benefitIcon}><UsersRound aria-hidden="true" size={25}/></span><div><h2 className="text-sm font-bold">{t("membershipApplicationCommunityTitle")}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#58645D]">{t("membershipApplicationCommunityCopy")}</p></div></div>
            <div className="flex gap-4"><span className={benefitIcon}><BookOpen aria-hidden="true" size={24}/></span><div><h2 className="text-sm font-bold">{t("membershipApplicationResourcesTitle")}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#58645D]">{t("membershipApplicationResourcesCopy")}</p></div></div>
            <div className="flex gap-4"><span className={benefitIcon}><CalendarDays aria-hidden="true" size={24}/></span><div><h2 className="text-sm font-bold">{t("membershipApplicationEventsTitle")}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#58645D]">{t("membershipApplicationEventsCopy")}</p></div></div>
            <div className="flex gap-4"><span className={benefitIcon}><ChartNoAxesCombined aria-hidden="true" size={24}/></span><div><h2 className="text-sm font-bold">{t("membershipApplicationGrowthTitle")}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#58645D]">{t("membershipApplicationGrowthCopy")}</p></div></div>
          </div>
          <div className="mt-6 flex gap-3 rounded-lg border border-[#E1E9E3] bg-white p-4"><ShieldCheck aria-hidden="true" size={27} className="shrink-0 text-[#087B49]"/><div><h2 className="text-sm font-bold">{t("membershipApplicationSafetyTitle")}</h2><p className="mt-1 text-sm leading-6 text-[#58645D]">{t("membershipApplicationAccessCopy")}</p></div></div>
        </section>

        <section aria-labelledby="application-form-heading" className="rounded-2xl border border-[#EDF0ED] bg-white px-5 py-7 shadow-[0_4px_20px_#122e1a0a] sm:px-7 sm:py-8 lg:px-8 lg:py-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#2C8753] text-[#087B49]"><UserRound aria-hidden="true" size={31}/></span>
          <h2 id="application-form-heading" className="mt-3 text-center text-xl font-bold">{t("membershipApplicationFormTitle")}</h2>
          <p className="mt-2 text-center text-sm leading-6 text-[#59635D]">{t("membershipApplicationFormCopy")}</p>
          {submitted ? <div className="mt-7 rounded-xl bg-[#EFF7F1] p-6" role="status" aria-live="polite"><CheckCircle2 aria-hidden="true" size={35} className="text-[#087B49]"/><h3 className="mt-4 text-lg font-bold text-[#075C32]">{t("membershipApplicationReceivedTitle")}</h3><p className="mt-3 text-sm leading-7 text-[#43534A]">{t("membershipApplicationReceivedCopy")}</p><Link href="/" className="mt-6 inline-flex min-h-10 items-center rounded-md bg-[#087B49] px-4 text-sm font-semibold text-white hover:bg-[#075C32]">{t("home")}</Link></div> : <form onSubmit={submit} className="mt-6 space-y-5">
            <fieldset disabled={submitting} className="space-y-5 disabled:opacity-70">
              <legend className="sr-only">{t("membershipApplicationFormTitle")}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold">{t("adminFirstName")} *<input name="firstName" required maxLength={100} autoComplete="given-name" className={`${inputClass} !pl-3`}/></label><label className="block text-sm font-semibold">{t("adminLastName")} *<input name="lastName" required maxLength={100} autoComplete="family-name" className={`${inputClass} !pl-3`}/></label>
                <label className="block text-sm font-semibold" htmlFor="app-email">{t("emailAddress")} <span aria-hidden="true">*</span><span className="relative block"><Mail aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-[19px] text-[#727D76]"/><input id="app-email" name="email" type="email" required maxLength={255} autoComplete="email" placeholder={t("membershipApplicationEmailPlaceholder")} className={inputClass}/></span></label>
                <label className="block text-sm font-semibold" htmlFor="app-phone">{t("membershipApplicationPhone")} *<span className="relative block"><Phone aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-[19px] text-[#727D76]"/><input id="app-phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder={t("membershipApplicationPhonePlaceholder")} className={inputClass}/></span></label>
                <label className="block text-sm font-semibold">{t("adminDateOfBirth")} *<input type="date" name="dateOfBirth" required max={new Date().toISOString().slice(0,10)} className={`${inputClass} !pl-3`}/></label>
                <label className="block text-sm font-semibold">{t("adminGender")} *<select name="gender" required defaultValue="" className={`${inputClass} !pl-3`}><option value="">{locale === "fr" ? "Choisir" : "Select"}</option>{["Woman", "Man", "Non-binary", "Prefer not to say", "Self-describe"].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="block text-sm font-semibold">{t("adminNationality")} *<select name="nationality" required defaultValue="" className={`${inputClass} !pl-3`}><option value="">{locale === "fr" ? "Choisir" : "Select"}</option>{countries.map((country) => <option key={country}>{country}</option>)}</select></label>
                <label className="block text-sm font-semibold">{t("adminLocation")} *<input name="location" required maxLength={255} list="application-location-suggestions" className={`${inputClass} !pl-3`}/><datalist id="application-location-suggestions">{[...new Set([...countries, ...timezones.map((zone) => zone.split("/").slice(1).join(", ").replaceAll("_", " ")).filter(Boolean)])].map((place) => <option key={place} value={place}/>)}</datalist></label>
                <label className="block text-sm font-semibold">{t("adminPreferredLanguage")}<select name="preferredLanguage" className={`${inputClass} !pl-3`} defaultValue=""><option value="">{t("adminNotRecorded")}</option><option value="en">English</option><option value="fr">Français</option></select></label>
                <label className="block text-sm font-semibold">{t("adminTimezone")}<select name="timezone" className={`${inputClass} !pl-3`} defaultValue=""><option value="">{t("adminNotRecorded")}</option>{timezones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
                <label className="block text-sm font-semibold sm:col-span-2">{t("adminBiography")} *<span className="mt-1 block text-xs font-normal text-slate-600">{locale === "fr" ? "Présentez brièvement votre parcours, vos intérêts et vos objectifs." : "Briefly describe your background, business interests and goals."}</span><textarea name="bio" required maxLength={250} rows={4} className={`${inputClass} !pl-3`}/></label>
              </div>
              <label className="flex items-start gap-2 text-xs leading-6 text-[#48574E]"><input type="checkbox" name="acknowledgement" required className="mt-1 h-4 w-4 shrink-0 accent-[#087B49]"/><span>{t("membershipApplicationAcknowledgement")}</span></label>
            </fieldset>
            {failure && <p role="alert" className="rounded-md bg-[#FFF3F1] px-3 py-3 text-sm leading-6 text-[#8B2E24]">{t(failure === "validation" ? "membershipApplicationInvalid" : "membershipApplicationUnavailable")}</p>}
            <button type="submit" disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"><UserRound aria-hidden="true" size={18}/>{t(submitting ? "membershipApplicationSubmitting" : "membershipApplicationSubmit")}</button>
          </form>}
          <p className="mt-6 text-center text-sm text-[#5C675F]">{t("membershipApplicationExistingAccount")} <Link href="/login" className="font-semibold text-[#087B49] hover:underline">{t("login")}</Link></p>
        </section>
      </div>
    </div>
  </main>;
}
