import type { Metadata } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LanguageProvider } from "@/modules/i18n/language-provider";
import { SiteChrome, SiteFooterChrome } from "@/modules/public-pages/components/site-chrome";
import { CallSessionProvider } from "@/modules/member-portal/components/call-session-provider";
import { MemberPublicPageShell } from "@/modules/member-portal/components/member-public-page-shell";

export const metadata: Metadata = {
  title: "The Green Entrepreneur",
  description: "TGE entrepreneur community and management portal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
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
