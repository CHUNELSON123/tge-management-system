"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { AdminLoginForm } from "../components/admin-login-form";

export function AdminLoginPage() {
  const { t } = useLanguage();
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
    <section className="grid w-full overflow-hidden rounded-2xl border border-[#E1E9E3] bg-white shadow-[0_12px_36px_#06271c18] md:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-between bg-[#06271C] p-7 text-white sm:p-10">
        <div className="flex items-center gap-3"><ShieldCheck aria-hidden="true" size={28} className="text-[#54C77A]" /><span className="text-lg font-bold">{t("adminPortal")}</span></div>
        <div className="mt-12"><h1 className="text-3xl font-bold">{t("adminLoginTitle")}</h1><p className="mt-3 max-w-sm text-sm leading-6 text-white/80">{t("adminLoginDescription")}</p></div>
        <Link href="/" className="mt-10 w-fit rounded text-sm font-semibold text-[#8FE0AA] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{t("adminReturnToWebsite")}</Link>
      </div>
      <div className="p-6 sm:p-10"><h2 className="text-xl font-bold text-[#17211B]">{t("signIn")}</h2><p className="mb-6 mt-1 text-sm text-[#65736A]">{t("adminLoginDescription")}</p><AdminLoginForm /><p className="mt-5 text-center text-sm text-[#65736A]">Setting up TGE? <Link href="/admin/setup" className="font-semibold text-[#006B3B] hover:underline">Create the first administrator</Link></p></div>
    </section>
  </main>;
}
