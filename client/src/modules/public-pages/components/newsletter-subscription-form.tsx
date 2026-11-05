"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { newsletterSubscriptionService } from "../services/newsletter-subscription.service";

export function NewsletterSubscriptionForm({ source, compact = false }: { source: "public-footer" | "news-sidebar"; compact?: boolean }) {
  const { t } = useLanguage();
  const [state, setState] = useState<"idle" | "submitting" | "success" | "already" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim();
    setState("submitting");
    try {
      const result = await newsletterSubscriptionService.subscribe(email, source);
      setState(result === "already-subscribed" ? "already" : "success");
      form.reset();
    } catch { setState("error"); }
  }

  const feedback = { submitting: "newsletterSubmitting", success: "newsletterSuccess", already: "newsletterAlreadySubscribed", error: "newsletterError" } as const;
  return <form onSubmit={submit} className={compact ? "" : "mt-3"}>
    <div className="flex overflow-hidden rounded-md bg-white">
      <label className="sr-only" htmlFor={`newsletter-${source}`}>{t("newsletterEmail")}</label>
      <input id={`newsletter-${source}`} type="email" name="email" aria-label={t("newsletterEmail")} placeholder={t("newsletterEmail")} autoComplete="email" required maxLength={255} className="min-w-0 flex-1 px-3 py-2.5 text-xs text-[#1C1C1A] outline-none placeholder:text-[#68716C] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A]" />
      <button type="submit" disabled={state === "submitting"} className="inline-flex shrink-0 items-center justify-center gap-1.5 bg-[#006B3B] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:opacity-60">{t(state === "submitting" ? feedback.submitting : "subscribe")}{compact && <Send aria-hidden="true" size={14}/>}</button>
    </div>
    {state !== "idle" && <p className="mt-2 text-xs" role={state === "error" ? "alert" : "status"} aria-live="polite">{t(feedback[state])}</p>}
  </form>;
}
