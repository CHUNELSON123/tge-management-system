"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Clock3, Mail, MapPin, Phone, Send, UsersRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { contactEnquiryService, ContactEnquiryError } from "../services/contact-enquiry.service";
import messages from "../contact-messages.json";

export default function ContactPage() {
  const { locale } = useLanguage();
  const t = locale === "fr" ? messages.fr : messages.en;
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<"validation" | "rate-limit" | "unavailable" | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      await contactEnquiryService.submit({ name: String(form.get("name") || "").trim(), email: String(form.get("email") || "").trim(), subject: String(form.get("subject") || "").trim(), message: String(form.get("message") || "").trim(), consent: true });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof ContactEnquiryError ? cause.kind : "unavailable");
    } finally { setBusy(false); }
  }
  const input = "min-h-11 w-full rounded-md border border-[#DCE3DF] bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#16854D]";

  return <main className="bg-[#FAFBFA] text-[#151A18]">
    <section className="relative overflow-hidden bg-[#052719] text-white"><div className="absolute inset-y-0 right-0 hidden w-[58%] bg-[url('/public-pages/contact-design-office.webp')] bg-cover bg-center sm:block" role="img" aria-label={locale === "fr" ? "Bureau TGE de Buéa" : "TGE office in Buea"}/><div className="absolute inset-0 hidden bg-gradient-to-r from-[#052719] via-[#052719]/95 to-transparent sm:block" aria-hidden="true"/><div className="relative mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-10 lg:py-12"><nav aria-label={locale === "fr" ? "Fil d’Ariane" : "Breadcrumb"} className="mb-5 flex gap-2 text-xs text-white/80"><Link href="/">{locale === "fr" ? "Accueil" : "Home"}</Link><span>›</span><span aria-current="page">{t.eyebrow}</span></nav><p className="text-xs font-bold uppercase tracking-wide text-[#61CE88]">{t.eyebrow}</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t.heading}</h1><p className="mt-2 text-lg font-semibold text-[#61CE88]">{t.subheading}</p><p className="mt-3 max-w-xl text-sm leading-6 text-white/90">{t.intro}</p></div></section>
    <div className="mx-auto grid max-w-[1360px] gap-5 px-5 py-7 sm:px-8 lg:grid-cols-[0.7fr_1.5fr] lg:px-10">
      <section className="rounded-xl border border-[#E7ECE8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="contact-details-heading"><h2 id="contact-details-heading" className="text-lg font-bold">{t.connect}</h2><p className="mt-1 text-sm text-[#59675E]">{t.channels}</p><ul className="mt-5 space-y-5 text-sm"><li className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-[#087B49]" size={19}/><span><b className="block text-[#075C32]">{t.office}</b>{t.officeValue}</span></li><li className="flex gap-3"><Mail className="mt-0.5 shrink-0 text-[#087B49]" size={19}/><span><b className="block text-[#075C32]">{t.email}</b><a href="mailto:info@tge-cameroon.org">info@tge-cameroon.org</a></span></li><li className="flex gap-3"><Phone className="mt-0.5 shrink-0 text-[#087B49]" size={19}/><span><b className="block text-[#075C32]">{t.phone}</b><a href="tel:+237675123456">+237 675 123 456</a></span></li><li className="flex gap-3"><Clock3 className="mt-0.5 shrink-0 text-[#087B49]" size={19}/><span><b className="block text-[#075C32]">{t.hours}</b>{t.hoursValue}</span></li></ul></section>
      <section className="rounded-xl border border-[#E7ECE8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="send-contact-heading"><h2 id="send-contact-heading" className="text-lg font-bold">{t.sendMessage}</h2><p className="mt-1 text-sm text-[#59675E]">{t.formCopy}</p>
        {sent ? <div role="status" aria-live="polite" className="mt-6 rounded-lg bg-[#EFF7F1] p-5 text-sm text-[#075C32]"><b>{t.success}</b></div> : <form onSubmit={submit} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">{t.fullName} *<input name="name" required maxLength={200} autoComplete="name" className={`${input} mt-1`} /></label><label className="text-sm font-medium">{t.emailAddress} *<input name="email" type="email" required maxLength={255} autoComplete="email" className={`${input} mt-1`} /></label></div><label className="block text-sm font-medium">{t.subject} *<input name="subject" required maxLength={250} className={`${input} mt-1`} /></label><label className="block text-sm font-medium">{t.message} *<textarea name="message" required minLength={5} maxLength={10000} rows={5} className={`${input} mt-1 resize-y`} /></label><label className="flex items-start gap-2 text-xs leading-5 text-[#59675E]"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[#087B49]"/><span>{t.consent}</span></label>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{t[error === "rate-limit" ? "rateLimit" : "error"]}</p>}<button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006B3B] px-5 text-sm font-semibold text-white hover:bg-[#075C32] disabled:opacity-60"><Send aria-hidden="true" size={16}/>{busy ? t.sending : t.submit}</button></form>}
      </section>
    </div>
    <section className="mx-auto mb-10 flex max-w-[1360px] flex-col gap-3 rounded-xl bg-[#EFF6F1] px-6 py-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><UsersRound aria-hidden="true" className="text-[#087B49]" size={30}/><div><h2 className="font-bold">{t.partnerTitle}</h2><p className="mt-1 text-sm text-[#59675E]">{t.partnerCopy}</p></div></div><a href="mailto:info@tge-cameroon.org?subject=Partnership%20enquiry" className="inline-flex min-h-10 items-center rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49]">{t.partnerLink}</a></section>
  </main>;
}
