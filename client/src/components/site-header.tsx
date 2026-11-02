"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";
import { useLanguage } from "@/modules/i18n/language-provider";

const navigation = [
  { label: "home", href: "/" },
  { label: "aboutUs", href: "/about" },
  { label: "ourServices", href: "/services" },
  { label: "contact", href: "/contact" },
] as const;

export function SiteHeader() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8E5] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label={t("home")}>
          <Image
            src="/tge-logo.png"
            alt="The Green Entrepreneur"
            width={180}
            height={60}
            priority
            className="h-auto w-36 object-contain sm:w-44"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[#5F6662] transition-colors hover:text-[#147E4A]"
            >
                    {t(item.label)}
            </Link>
          ))}
        </nav>

        <LanguageSwitcher className="text-[#1C1C1A]" />
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#147E4A] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0D6339]"
        >
          {t("login")}
        </Link>
      </div>
    </header>
  );
}
