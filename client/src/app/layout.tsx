import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/modules/i18n/language-provider";
import { SiteFooter } from "@/modules/public-pages/components/site-footer";
import { SiteHeader, SiteHeaderFallback } from "@/modules/public-pages/components/site-header";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Green Entrepreneur",
  description: "TGE entrepreneur community and management portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <LanguageProvider>
          <Suspense fallback={<SiteHeaderFallback />}>
            <SiteHeader />
          </Suspense>
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[60] rounded-lg border border-[#D1DDD4] bg-white/95 p-1 text-[#1C1C1A] shadow-lg backdrop-blur sm:right-6">
            <LanguageSwitcher className="border-0 p-0" />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
