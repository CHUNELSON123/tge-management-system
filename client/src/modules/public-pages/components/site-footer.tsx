"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import type { TranslationKey } from "@/modules/i18n/messages";
import { SiteLogo } from "./site-logo";
import { NewsletterSubscriptionForm } from "./newsletter-subscription-form";

const quickLinks = [
  { label: "home", href: "/" },
  { label: "aboutUs", href: "/about" },
  { label: "programmes", href: "/programmes" },
  { label: "events", href: "/events" },
  { label: "news", href: "/news" },
  { label: "contactUs", href: "/contact" },
] as const;

const communityLinks = [
  { label: "businessDirectory", href: "/business-directory" },
  { label: "membership", href: "/membership-application" },
  { label: "mentorship", href: "mailto:info@tge-cameroon.org?subject=Mentorship" },
  { label: "volunteer", href: "mailto:info@tge-cameroon.org?subject=Volunteering" },
  { label: "supportTge", href: "mailto:info@tge-cameroon.org?subject=Support%20TGE" },
] as const;

const socialLinks = [
  { label: "Facebook", mark: "f" },
  { label: "LinkedIn", mark: "in" },
  { label: "Instagram", mark: "◎" },
  { label: "YouTube", mark: "▶" },
] as const;

function FooterLinkList({
  heading,
  label,
  links,
}: {
  heading: string;
  label: string;
  links: readonly { label: TranslationKey; href: string }[];
}) {
  const { t } = useLanguage();

  return (
    <nav aria-label={label} className="border-[#26312D] sm:border-r sm:pr-5">
      <h2 className="mb-4 text-sm font-bold text-white">{heading}</h2>
      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 text-[13px] text-white/85 transition-colors hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23A765]"
            >
              <span aria-hidden="true" className="text-[#13A568]">›</span>
              {t(item.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  const [year, setYear] = useState("");
  useEffect(() => { setYear(String(new Date().getFullYear())); }, []);
  return (
    <footer className="bg-[#07100F] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.9fr_1fr_1.3fr_1.45fr] lg:gap-6">
          <div className="border-[#26312D] sm:pr-5 lg:border-r">
            <Link href="/" aria-label={t("home")} className="inline-flex rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23A765]">
              <SiteLogo tone="dark" />
            </Link>
            <p className="mt-4 max-w-[230px] text-[13px] leading-6 text-white/80">
              {t("empoweringEntrepreneurs")}
            </p>
            <div role="group" aria-label={t("socialMedia")} className="mt-4 flex items-center gap-3">
              {socialLinks.map((item) => (
                <span
                  key={item.label}
                  aria-label={item.label}
                  title={item.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#087B49] text-xs font-bold text-white"
                >
                  <span aria-hidden="true">{item.mark}</span>
                </span>
              ))}
            </div>
          </div>

          <FooterLinkList
            heading={t("quickLinks")}
            label={t("footerNavigation")}
            links={quickLinks}
          />

          <FooterLinkList
            heading={t("community")}
            label={t("communityLinks")}
            links={communityLinks}
          />

          <section aria-labelledby="footer-contact-heading" className="border-[#26312D] lg:border-r lg:pr-5">
            <h2 id="footer-contact-heading" className="mb-4 text-sm font-bold">{t("contactUs")}</h2>
            <ul className="space-y-3 text-[13px] leading-5 text-white/85">
              <li className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#13A568]" />
                <span>{t("bueaRegion")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#13A568]" />
                <a href="mailto:info@tge-cameroon.org" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23A765]">
                  info@tge-cameroon.org
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#13A568]" />
                <a href="tel:+237675123456" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23A765]">
                  +237 675 123 456
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock3 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#13A568]" />
                <span>{t("weekdayHours")}</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-newsletter-heading">
            <h2 id="footer-newsletter-heading" className="mb-3 text-sm font-bold">{t("newsletter")}</h2>
            <p className="max-w-xs text-[13px] leading-5 text-white/85">{t("subscribeUpdates")}</p>
            <NewsletterSubscriptionForm source="public-footer" />
          </section>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/15 pt-5 text-center text-xs text-white/85 md:flex-row md:justify-between md:text-left">
          <span>© {year} The Green Entrepreneur. {t("allRightsReserved")}</span>
          <div className="flex items-center gap-5">
            <span>{t("privacyPolicy")}</span>
            <span aria-hidden="true" className="text-white/40">|</span>
            <span>{t("termsOfUse")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
