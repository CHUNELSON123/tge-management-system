import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/modules/i18n/language-provider";
import { SiteChrome, SiteFooterChrome } from "@/modules/public-pages/components/site-chrome";
import { CallSessionProvider } from "@/modules/member-portal/components/call-session-provider";
import { MemberPublicPageShell } from "@/modules/member-portal/components/member-public-page-shell";

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
          <CallSessionProvider>
          <Suspense fallback={null}><SiteChrome /></Suspense>
          <div className="flex-1">
            <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
              <MemberPublicPageShell>{children}</MemberPublicPageShell>
            </Suspense>
          </div>
          <Suspense fallback={null}><SiteFooterChrome /></Suspense>
          </CallSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
