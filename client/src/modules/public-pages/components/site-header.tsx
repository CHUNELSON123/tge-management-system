"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, UserRound, X } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { SiteLogo } from "./site-logo";

const navigation = [
  { label: "home", href: "/" },
  { label: "aboutUs", href: "/about" },
  { label: "programmes", href: "/programmes" },
  { label: "events", href: "/events" },
  { label: "news", href: "/news" },
  { label: "businessDirectory", href: "/business-directory" },
  { label: "contactUs", href: "/contact" },
] as const;

export function SiteHeader() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  function isActive(href: string) {
    return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  function navigationLinkClass(href: string) {
    return `border-b-2 px-0.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-4 ${
      isActive(href)
        ? "border-[#147E4A] text-[#075C32]"
        : "border-transparent text-[#1C1C1A] hover:border-[#147E4A] hover:text-[#075C32]"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8E5] bg-white shadow-[0_1px_5px_#00000008]">
      <div className="relative mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[72px] lg:px-10">
        <Link href="/" aria-label={t("home")} className="shrink-0 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
          <SiteLogo priority />
        </Link>

        <nav aria-label={t("primaryNavigation")} className="hidden items-center gap-4 lg:flex xl:gap-6">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={navigationLinkClass(item.href)}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#006B3B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
          >
            <UserRound aria-hidden="true" size={16} />
            {t("login")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[#1C1C1A] hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] lg:hidden"
          aria-label={t(mobileMenuOpen ? "closeMenu" : "openMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-primary-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X aria-hidden="true" size={25} /> : <Menu aria-hidden="true" size={25} />}
        </button>
      </div>

      <div
        id="mobile-primary-navigation"
        hidden={!mobileMenuOpen}
        className="max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-[#E2E8E5] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden"
      >
        <nav aria-label={t("primaryNavigation")} className="mx-auto flex max-w-7xl flex-col">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`border-b border-[#E8ECE9] px-2 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] ${isActive(item.href) ? "text-[#075C32]" : "text-[#1C1C1A]"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="mx-auto mt-4 flex max-w-7xl items-center justify-end px-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#006B3B] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8E5] bg-white shadow-[0_1px_5px_#00000008]">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[72px] lg:px-10">
        <Link href="/" aria-label={t("home")} className="shrink-0">
          <SiteLogo priority />
        </Link>
        <nav aria-label={t("primaryNavigation")} className="hidden items-center gap-4 lg:flex xl:gap-6">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} className="px-0.5 py-2 text-sm font-semibold text-[#1C1C1A]">
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-md bg-[#006B3B] px-5 py-3 text-sm font-semibold text-white">
            {t("login")}
          </Link>
        </div>
        <Menu aria-hidden="true" className="text-[#1C1C1A] lg:hidden" size={25} />
      </div>
    </header>
  );
}
