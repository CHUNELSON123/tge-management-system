"use client";

import Link from "next/link";
import { CalendarDays, Network, Store, UsersRound } from "lucide-react";
import { LoginForm } from "@/modules/auth/components/login-form";
import { useLanguage } from "@/modules/i18n/language-provider";

const benefits = [
  [UsersRound, "exclusiveProgrammes", "exclusiveProgrammesText"],
  [CalendarDays, "stayUpdated", "stayUpdatedText"],
  [Store, "growBusiness", "growBusinessText"],
  [Network, "buildConnections", "buildConnectionsText"],
] as const;

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <main className="bg-white text-[#1C1C1A]">
      <section className="relative overflow-hidden bg-[#06271C] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,#28603b_0%,#06271c_42%,#031a13_76%)]" />
        <div className="relative mx-auto flex min-h-[198px] max-w-7xl items-center px-8 py-8 sm:px-12">
          <div className="max-w-lg">
            <h1 className="text-3xl font-bold sm:text-[32px]">{t("welcomeBack")}</h1>
            <h2 className="mt-1 text-xl font-bold text-[#38B765]">{t("signInToAccount")}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/90">{t("accessDashboard")}</p>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-[57%] bg-[linear-gradient(90deg,#06271c_0%,transparent_35%),url('/login-hero.png')] bg-cover bg-center lg:block"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-7 md:grid-cols-[0.78fr_1.22fr] lg:px-12">
        <aside className="hidden border-r border-[#E2E8E5] pr-8 md:block">
          <h2 className="font-bold">{t("newToTge")}</h2>
          <p className="mt-1 max-w-xs text-xs leading-5">{t("joinCommunity")}</p>
          <div className="mt-3 space-y-3">
            {benefits.map(([Icon, title, text]) => (
              <div key={title} className="flex gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F5EE] text-[#0D6339]">
                  <Icon size={21} />
                </span>
                <p className="text-[11px] leading-4">
                  <strong className="block text-xs">{t(title)}</strong>
                  {t(text)}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/membership-application"
            className="mt-5 block rounded border border-[#147E4A] px-4 py-2.5 text-center text-xs font-semibold text-[#0D6339] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
          >
            {t("applyForMembership")}
          </Link>
        </aside>

        <div className="mx-auto w-full max-w-[600px] rounded-2xl border border-[#F0F1F0] bg-white p-6 shadow-[0_2px_12px_#00000012] sm:p-7">
          <h2 className="text-xl font-bold">{t("signIn")}</h2>
          <p className="mt-1 text-xs text-[#5F6662]">{t("enterCredentials")}</p>
          <div className="mt-4"><LoginForm /></div>
        </div>

        <div className="rounded-xl bg-[#E8F5EE] p-5 md:hidden">
          <h2 className="font-bold">{t("newToTge")}</h2>
          <p className="mt-1 text-xs">{t("joinCommunity")}</p>
          <Link
            href="/membership-application"
            className="mt-4 block rounded border border-[#147E4A] px-4 py-2 text-center text-xs font-semibold text-[#0D6339] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
          >
            {t("applyForMembership")}
          </Link>
        </div>
      </section>
    </main>
  );
}
