"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Mail, Phone, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { membershipApplicationService, MembershipApplicationRequestError } from "../services/membership-application.service";

export default function MembershipApplicationPage() {
  const { t } = useLanguage();
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
      });
      setSubmitted(true);
    } catch (error: unknown) {
      setFailure(error instanceof MembershipApplicationRequestError ? error.kind : "unavailable");
    } finally { setSubmitting(false); }
  }

  const inputClass = "mt-1.5 min-h-11 w-full rounded-md border border-[#DCE3DF] bg-white py-2.5 pl-10 pr-3 text-sm font-normal text-[#26352C] placeholder:text-[#69736D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16854D] disabled:bg-[#F3F5F3]";

  return <main className="bg-[#FAFBFA] text-[#141B17]">
    <div className="mx-auto max-w-[1280px] px-5 pb-12 pt-5 sm:px-8 lg:px-10">
      <nav aria-label={t("breadcrumbNavigation")} className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#59675E]"><Link href="/" className="hover:text-[#087B49]">{t("home")}</Link><span aria-hidden="true">›</span><span aria-current="page" className="font-semibold text-[#087B49]">{t("applyForMembership")}</span></nav>
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <section className="pt-3 lg:pt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("membershipApplicationEyebrow")}</p>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">{t("membershipApplicationHeading")}<span className="mt-1 block text-[#086B3E]">{t("membershipApplicationHeadingGreen")}</span></h1>
          <div className="mt-4 h-0.5 w-12 bg-[#16854D]" />
          <p className="mt-5 max-w-md text-sm leading-7 text-[#47534B]">{t("membershipApplicationIntro")}</p>
          <div className="mt-7 hidden space-y-6 sm:block">
            <div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF2EC] text-[#087B49]"><UsersRound aria-hidden="true" size={26}/></span><div><h2 className="text-sm font-bold">{t("membershipApplicationCommunityTitle")}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#58645D]">{t("membershipApplicationCommunityCopy")}</p></div></div>
            <div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF2EC] text-[#087B49]"><BookOpen aria-hidden="true" size={25}/></span><div><h2 className="text-sm font-bold">{t("membershipApplicationReviewTitle")}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#58645D]">{t("membershipApplicationReviewCopy")}</p></div></div>
            <div className="flex gap-4 rounded-lg border border-[#E1E9E3] bg-white p-4"><ShieldCheck aria-hidden="true" size={28} className="shrink-0 text-[#087B49]"/><p className="text-sm leading-6 text-[#58645D]">{t("membershipApplicationAccessCopy")}</p></div>
          </div>
        </section>

        <section aria-labelledby="application-form-heading" className="rounded-2xl border border-[#EDF0ED] bg-white px-5 py-7 shadow-[0_4px_20px_#122e1a0a] sm:px-7 lg:px-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#2C8753] text-[#087B49]"><UserRound aria-hidden="true" size={31}/></span>
          <h2 id="application-form-heading" className="mt-4 text-center text-xl font-bold">{t("membershipApplicationFormTitle")}</h2>
          <p className="mt-2 text-center text-sm leading-6 text-[#59635D]">{t("membershipApplicationFormCopy")}</p>
          {submitted ? <div className="mt-7 rounded-xl bg-[#EFF7F1] p-6" role="status" aria-live="polite"><CheckCircle2 aria-hidden="true" size={35} className="text-[#087B49]"/><h3 className="mt-4 text-lg font-bold text-[#075C32]">{t("membershipApplicationReceivedTitle")}</h3><p className="mt-3 text-sm leading-7 text-[#43534A]">{t("membershipApplicationReceivedCopy")}</p><Link href="/" className="mt-6 inline-flex min-h-10 items-center rounded-md bg-[#087B49] px-4 text-sm font-semibold text-white hover:bg-[#075C32]">{t("home")}</Link></div> : <form onSubmit={submit} className="mt-7 space-y-5">
            <fieldset disabled={submitting} className="space-y-5 disabled:opacity-70">
              <legend className="sr-only">{t("membershipApplicationFormTitle")}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold" htmlFor="app-first-name">{t("membershipApplicationFirstName")} <span aria-hidden="true">*</span><span className="relative block"><UserRound aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-[19px] text-[#727D76]"/><input id="app-first-name" name="firstName" required maxLength={100} autoComplete="given-name" className={inputClass}/></span></label>
                <label className="block text-sm font-semibold" htmlFor="app-last-name">{t("membershipApplicationLastName")} <span aria-hidden="true">*</span><span className="relative block"><UserRound aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-[19px] text-[#727D76]"/><input id="app-last-name" name="lastName" required maxLength={100} autoComplete="family-name" className={inputClass}/></span></label>
                <label className="block text-sm font-semibold" htmlFor="app-email">{t("emailAddress")} <span aria-hidden="true">*</span><span className="relative block"><Mail aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-[19px] text-[#727D76]"/><input id="app-email" name="email" type="email" required maxLength={255} autoComplete="email" className={inputClass}/></span></label>
                <label className="block text-sm font-semibold" htmlFor="app-phone">{t("membershipApplicationPhone")}<span className="relative block"><Phone aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-[19px] text-[#727D76]"/><input id="app-phone" name="phone" type="tel" maxLength={30} autoComplete="tel" className={inputClass}/></span></label>
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
