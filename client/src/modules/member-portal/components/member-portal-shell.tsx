"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Settings,
  UserRound,
  UsersRound,
  BookOpen,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { authService } from "@/modules/auth/services/auth.service";
import { useLanguage } from "@/modules/i18n/language-provider";

const memberDestinations: Array<{
  label: "memberDashboard" | "memberProfile" | "memberProgrammes" | "memberEvents" | "memberMentorship" | "memberResources" | "memberMessages" | "memberNotifications" | "memberBusinesses" | "memberSettings" | "memberHelp";
  href: string;
  icon: LucideIcon;
}> = [
  { label: "memberDashboard", href: "/portal", icon: LayoutDashboard },
  { label: "memberProfile", href: "/portal/profile", icon: UserRound },
  { label: "memberProgrammes", href: "/portal/programmes", icon: BookOpen },
  { label: "memberEvents", href: "/portal/events", icon: CalendarDays },
  { label: "memberMentorship", href: "/portal/mentorship", icon: UsersRound },
  { label: "memberResources", href: "/portal/resources", icon: FolderOpen },
  { label: "memberMessages", href: "/portal/messages", icon: MessageSquare },
  { label: "memberNotifications", href: "/portal/notifications", icon: Bell },
  { label: "memberBusinesses", href: "/portal/businesses", icon: BriefcaseBusiness },
  { label: "memberSettings", href: "/portal/settings", icon: Settings },
  { label: "memberHelp", href: "/portal/help", icon: CircleHelp },
];

const mobilePrimaryHrefs = new Set(["/portal", "/portal/programmes", "/portal/events", "/portal/messages"]);

function isCurrentPage(pathname: string, href: string) {
  return href === "/portal" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberPortalShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const currentDestination = memberDestinations.find(({ href }) => isCurrentPage(pathname, href)) ?? memberDestinations[0];
  const additionalDestinations = memberDestinations.filter(({ href }) => !mobilePrimaryHrefs.has(href));

  useEffect(() => {
    if (!moreOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSidebarHidden(localStorage.getItem("tge.memberSidebarHidden") === "true");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function toggleSidebar() {
    setSidebarHidden((hidden) => {
      const nextHidden = !hidden;
      localStorage.setItem("tge.memberSidebarHidden", String(nextHidden));
      return nextHidden;
    });
  }

  async function signOut() {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    try {
      if (token) await authService.logout(token);
    } catch {
      // Clear local credentials even when the logout endpoint is unavailable.
    } finally {
      localStorage.removeItem("tge.accessToken");
      sessionStorage.removeItem("tge.accessToken");
      router.replace("/login");
    }
  }

  function destinationLink(destination: (typeof memberDestinations)[number], mobile = false) {
    const { label, href, icon: Icon } = destination;
    const active = isCurrentPage(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={mobile ? () => setMoreOpen(false) : undefined}
        className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 ${
          active ? "bg-[#006B3B] text-white shadow-sm" : "text-[#17211B] hover:bg-[#EFF6F1] hover:text-[#075C32]"
        }`}
      >
        <Icon aria-hidden="true" size={18} className={active ? "shrink-0" : "shrink-0 text-[#52645A] group-hover:text-[#075C32]"} />
        <span>{t(label)}</span>
        {active && <span className="sr-only">({t("currentPage")})</span>}
      </Link>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-3 pb-20 sm:px-6 lg:px-8 lg:pb-0">
      <div className="relative flex min-h-[calc(100vh-5rem)] gap-5 lg:gap-7">
        {!sidebarHidden && <aside className="sticky top-[72px] hidden h-[calc(100dvh-72px)] w-56 shrink-0 self-start md:block lg:w-60">
          <nav aria-label={t("memberNavigation")} className="flex h-full flex-col border-r border-[#E6ECE8] bg-white px-3 py-5">
            <button type="button" onClick={toggleSidebar} aria-label={t("hideMemberSidebar")} className="mb-3 flex min-h-10 items-center justify-end gap-2 rounded-md px-2 text-xs font-semibold text-[#52645A] hover:bg-[#EFF6F1] hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
              <span>{t("hideSidebar")}</span><PanelLeftClose aria-hidden="true" size={17} />
            </button>
            <div className="flex flex-col gap-1 overflow-y-auto">{memberDestinations.map((destination) => destinationLink(destination))}</div>
            <button
              type="button"
              onClick={signOut}
              className="mt-auto flex min-h-11 shrink-0 items-center gap-3 border-t border-[#E6ECE8] px-3 pt-3 text-left text-sm font-semibold text-[#17211B] hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"
            >
              <LogOut aria-hidden="true" size={18} />
              {t("signOut")}
            </button>
          </nav>
        </aside>}

        <main className="min-w-0 flex-1 bg-white px-1 py-5 sm:px-2 lg:px-2 lg:py-8">
          {sidebarHidden && <button type="button" onClick={toggleSidebar} aria-label={t("showMemberSidebar")} className="mb-4 hidden min-h-10 items-center gap-2 rounded-md border border-[#E0E8E3] px-3 text-sm font-semibold text-[#075C32] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] md:inline-flex"><PanelLeftOpen aria-hidden="true" size={17} />{t("showSidebar")}</button>}
          {pathname.startsWith("/portal") && pathname !== "/portal" && <nav aria-label={t("breadcrumbNavigation")} className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[#5B665F]">
              <li><Link href="/portal" className="rounded hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("memberPortal")}</Link></li>
              <li className="flex items-center gap-2" aria-current="page"><ChevronRight aria-hidden="true" size={15} /><span className="font-semibold text-[#075C32]">{t(currentDestination.label)}</span></li>
              {pathname.startsWith("/portal/events/") && <li className="flex items-center gap-2" aria-current="page"><ChevronRight aria-hidden="true" size={15} /><span className="font-semibold text-[#075C32]">{t("memberEventDetails")}</span></li>}
            </ol>
          </nav>}
          {children}
        </main>
      </div>

      <nav aria-label={t("memberNavigation")} className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E0E8E3] bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-3px_12px_#0000000D] md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 py-2">
          {memberDestinations.filter(({ href }) => mobilePrimaryHrefs.has(href)).map(({ label, href, icon: Icon }) => {
            const active = isCurrentPage(pathname, href);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] ${active ? "text-[#006B3B]" : "text-[#39443D]"}`}><Icon aria-hidden="true" size={19} /><span>{t(label)}</span></Link>;
          })}
          <button type="button" aria-expanded={moreOpen} aria-controls="member-more-navigation" onClick={() => setMoreOpen((open) => !open)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] ${additionalDestinations.some(({ href }) => isCurrentPage(pathname, href)) ? "text-[#006B3B]" : "text-[#39443D]"}`}><MoreHorizontal aria-hidden="true" size={19} /><span>{t("more")}</span></button>
        </div>
      </nav>

      {moreOpen && <>
        <button type="button" aria-label={t("closeMemberNavigation")} className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMoreOpen(false)} />
        <div id="member-more-navigation" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 max-h-[70dvh] overflow-y-auto rounded-xl border border-[#E0E8E3] bg-white p-3 shadow-xl md:hidden">
          <nav aria-label={t("memberNavigation")} className="grid gap-1">{additionalDestinations.map((destination) => destinationLink(destination, true))}</nav>
          <button type="button" onClick={signOut} className="mt-2 flex min-h-11 w-full items-center gap-3 border-t border-[#E6ECE8] px-3 pt-3 text-left text-sm font-semibold text-[#17211B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><LogOut aria-hidden="true" size={18} />{t("signOut")}</button>
        </div>
      </>}
    </div>
  );
}
