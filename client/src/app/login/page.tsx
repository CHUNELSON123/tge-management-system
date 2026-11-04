"use client";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Network, Store, UsersRound } from "lucide-react";
import { LoginForm } from "@/modules/auth/components/login-form";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";
import { useLanguage } from "@/modules/i18n/language-provider";

const benefits = [
  [UsersRound, "exclusiveProgrammes", "exclusiveProgrammesText"],
  [CalendarDays, "stayUpdated", "stayUpdatedText"],
  [Store, "growBusiness", "growBusinessText"],
  [Network, "buildConnections", "buildConnectionsText"],
] as const;
const navigation = [
  ["home", "/"], ["aboutUs", "/about"], ["programmes", "/programmes"],
  ["events", "/events"], ["news", "/news"], ["businessDirectory", "/business-directory"], ["contactUs", "/contact"],
] as const;

function LoginHeader() {
  const { t } = useLanguage();
  return <header className="flex min-h-[68px] items-center justify-between gap-3 bg-white px-4 sm:px-10">
    <Link href="/" aria-label="The Green Entrepreneur home"><Image src="/tge-logo.png" alt="The Green Entrepreneur" width={180} height={60} priority className="h-auto w-32 sm:w-36" /></Link>
    <nav className="hidden items-center gap-5 text-xs font-semibold text-[#1C1C1A] xl:flex">{navigation.map(([key, href]) => <Link key={key} href={href}>{t(key)}</Link>)}</nav>
    <div className="flex shrink-0 items-center gap-2"><LanguageSwitcher className="text-[#1C1C1A]" /><Link href="/login" className="rounded-md bg-[#006B3B] px-3 py-2 text-xs font-semibold text-white sm:px-5">{t("login")}</Link></div>
  </header>;
}

function LoginFooter() {
  const { t } = useLanguage();
  return <footer className="bg-[#07100F] px-7 py-8 text-white sm:px-10"><div className="mx-auto grid max-w-7xl gap-7 text-xs sm:grid-cols-2 lg:grid-cols-5">
    <div><Image src="/tge-logo.png" alt="The Green Entrepreneur" width={190} height={65} className="h-auto w-40 brightness-0 invert" /><p className="mt-4 leading-6 text-white/80">{t("empoweringEntrepreneurs")}</p></div>
    <div><h3 className="mb-3 font-bold">{t("quickLinks")}</h3><p>{t("home")}<br />{t("aboutUs")}<br />{t("programmes")}<br />{t("events")}<br />{t("news")}<br />{t("contactUs")}</p></div>
    <div><h3 className="mb-3 font-bold">{t("community")}</h3><p>{t("businessDirectory")}<br />{t("membership")}<br />{t("mentorship")}<br />{t("volunteer")}<br />{t("supportTge")}</p></div>
    <div><h3 className="mb-3 font-bold">{t("contactUs")}</h3><p>{t("bueaRegion")}<br />info@tge-cameroon.org<br />+237 675 123 456<br />{t("weekdayHours")}<br />{t("saturdayHours")}</p></div>
    <div><h3 className="mb-3 font-bold">{t("newsletter")}</h3><p>{t("subscribeUpdates")}</p><input aria-label={t("newsletterEmail")} placeholder={t("newsletterEmail")} className="mt-3 min-w-0 rounded bg-white px-3 py-2 text-[#1C1C1A]" /><button className="ml-1 rounded bg-[#006B3B] px-3 py-2">{t("subscribe")}</button></div>
  </div><div className="mx-auto mt-7 flex max-w-7xl justify-between border-t border-white/20 pt-4 text-[11px] text-white/75"><span>© 2026 The Green Entrepreneur. {t("allRightsReserved")}</span><span>{t("privacyPolicy")} | {t("termsOfUse")}</span></div></footer>;
}

export default function LoginPage() {
  const { t } = useLanguage();
  return <div className="min-h-screen bg-white text-[#1C1C1A]"><LoginHeader /><main>
    <section className="relative overflow-hidden bg-[#06271C] text-white"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,#28603b_0%,#06271c_42%,#031a13_76%)]" /><div className="relative mx-auto flex min-h-[198px] max-w-7xl items-center px-8 py-8 sm:px-12"><div className="max-w-lg"><h1 className="text-3xl font-bold sm:text-[32px]">{t("welcomeBack")}</h1><h2 className="mt-1 text-xl font-bold text-[#38B765]">{t("signInToAccount")}</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/90">{t("accessDashboard")}</p></div><div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 hidden h-full w-[57%] bg-[linear-gradient(90deg,#06271c_0%,transparent_35%),url('/login-hero.png')] bg-cover bg-center lg:block" /></div></section>
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-7 md:grid-cols-[0.78fr_1.22fr] lg:px-12"><aside className="hidden border-r border-[#E2E8E5] pr-8 md:block"><h2 className="font-bold">{t("newToTge")}</h2><p className="mt-1 max-w-xs text-xs leading-5">{t("joinCommunity")}</p><div className="mt-3 space-y-3">{benefits.map(([Icon, title, text]) => <div key={title} className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F5EE] text-[#0D6339]"><Icon size={21} /></span><p className="text-[11px] leading-4"><strong className="block text-xs">{t(title)}</strong>{t(text)}</p></div>)}</div><Link href="/signup" className="mt-5 block rounded border border-[#147E4A] px-4 py-2.5 text-center text-xs font-semibold text-[#0D6339]">{t("createAccount")}</Link></aside>
      <div className="mx-auto w-full max-w-[600px] rounded-2xl border border-[#F0F1F0] bg-white p-6 shadow-[0_2px_12px_#00000012] sm:p-7"><h2 className="text-xl font-bold">{t("signIn")}</h2><p className="mt-1 text-xs text-[#5F6662]">{t("enterCredentials")}</p><div className="mt-4"><LoginForm /></div></div>
      <div className="rounded-xl bg-[#E8F5EE] p-5 md:hidden"><h2 className="font-bold">{t("newToTge")}</h2><p className="mt-1 text-xs">{t("joinCommunity")}</p><Link href="/signup" className="mt-4 block rounded border border-[#147E4A] px-4 py-2 text-center text-xs font-semibold text-[#0D6339]">{t("createAccount")}</Link></div>
    </section></main><LoginFooter /></div>;
}
