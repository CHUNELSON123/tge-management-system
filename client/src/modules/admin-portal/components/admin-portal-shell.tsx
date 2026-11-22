"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, ChevronRight, CreditCard, FileText,
  FolderOpen, Handshake, LayoutDashboard, LifeBuoy, LogOut, MoreHorizontal,
  PanelLeftClose, PanelLeftOpen, Settings, Users, UserRound, MessageSquare, Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { authService } from "@/modules/auth/services/auth.service";
import { useUnreadMessages } from "@/modules/member-portal/hooks/use-unread-messages";
import { useUnreadNotifications } from "@/modules/member-portal/hooks/use-unread-notifications";

const adminLinks: Array<{ label: "memberNotifications" | "memberMessages" | "adminDashboard" | "adminMembers" | "adminProgrammes" | "adminEvents" | "adminMentorship" | "adminResources" | "adminBusinesses" | "adminReports" | "adminWebsite" | "adminUsersRoles" | "adminSettings" | "adminPayments"; href: string; permission: string; icon: LucideIcon; implemented: boolean }> = [
  { label: "adminDashboard", href: "/admin", permission: "reports.view", icon: LayoutDashboard, implemented: true },
  { label: "adminMembers", href: "/admin/members", permission: "members.manage", icon: Users, implemented: true },
  { label: "adminPayments", href: "/admin/payments", permission: "payments.manage", icon: CreditCard, implemented: true },
  { label: "adminProgrammes", href: "/admin/programmes", permission: "programmes.manage", icon: BookOpen, implemented: true },
  { label: "adminResources", href: "/admin/resources", permission: "resources.manage", icon: FolderOpen, implemented: true },
  { label: "adminEvents", href: "/admin/events", permission: "events.manage", icon: CalendarDays, implemented: true },
  { label: "adminMentorship", href: "/admin/mentorship", permission: "mentorship.manage", icon: Handshake, implemented: true },
  { label: "adminBusinesses", href: "/admin/businesses", permission: "businesses.manage", icon: BriefcaseBusiness, implemented: true },
  { label: "adminWebsite", href: "/admin/website", permission: "website.manage", icon: FileText, implemented: true },
  { label: "adminReports", href: "/admin/reports", permission: "reports.view", icon: BarChart3, implemented: true },
  { label: "adminUsersRoles", href: "/admin/users-roles", permission: "users.manage", icon: UserRound, implemented: true },
  { label: "adminSettings", href: "/admin/settings", permission: "system.manage", icon: Settings, implemented: true },
  { label: "memberMessages", href: "/admin/messages", permission: "reports.view", icon: MessageSquare, implemented: true },
  { label: "memberNotifications", href: "/admin/notifications", permission: "reports.view", icon: Bell, implemented: true },
];

const mobilePrimary = [
  { label: "adminDashboard" as const, href: "/admin", icon: LayoutDashboard },
  { label: "adminMembers" as const, href: "/admin/members", icon: Users },
  { label: "adminProgrammesShort" as const, href: "/admin/programmes", icon: BookOpen },
  { label: "adminEvents" as const, href: "/admin/events", icon: CalendarDays },
];

function isCurrentPage(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminPortalShell({ children, permissions, roleName }: { children: React.ReactNode; permissions: string[]; roleName: string }) {
  const unreadMessages = useUnreadMessages();
  const unreadNotifications = useUnreadNotifications();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const currentLink = [...adminLinks].sort((left, right) => right.href.length - left.href.length).find(({ href }) => isCurrentPage(pathname, href));
  useEffect(() => { const frame = requestAnimationFrame(() => setMoreOpen(false)); return () => cancelAnimationFrame(frame); }, [pathname]);

  useEffect(() => { const frame=window.requestAnimationFrame(()=>setSidebarHidden(localStorage.getItem("tge.adminSidebarHidden") === "true")); return()=>window.cancelAnimationFrame(frame); }, []);
  useEffect(() => {
    if (!moreOpen) return;
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setMoreOpen(false); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  function setDesktopSidebarHidden(hidden: boolean) {
    setSidebarHidden(hidden);
    localStorage.setItem("tge.adminSidebarHidden", String(hidden));
  }

  async function signOut() {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    try { if (token) await authService.logout(token); } catch { /* Clear local credentials even if logout is unavailable. */ }
    finally {
      localStorage.removeItem("tge.accessToken");
      sessionStorage.removeItem("tge.accessToken");
      router.replace("/admin/login");
    }
  }

  function sidebarLink(item: (typeof adminLinks)[number], mobile = false) {
    const active = isCurrentPage(pathname, item.href);
    const settingsRoleCanView = item.href === "/admin/settings" && roleName === "Organisation Administrator";
    const authorized = permissions.includes(item.permission) || settingsRoleCanView;
    const enabled = authorized && item.implemented;
    const Icon = item.icon;
    const compact = sidebarHidden && !mobile;
    const className = `group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-normal leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 ${compact ? "justify-center" : ""} ${active ? "bg-[#006B3B] font-semibold text-white" : enabled ? "text-[#17211B] hover:bg-[#EFF6F1] hover:text-[#075C32]" : "cursor-not-allowed text-[#839087]"}`;
    const content = <><Icon aria-hidden="true" size={18} className="shrink-0" /><span className={compact ? "sr-only" : "min-w-0 whitespace-normal break-words"}>{t(item.label)}</span>{item.href === "/admin/messages" && unreadMessages > 0 && <span aria-label={`${unreadMessages} unread messages`} className={`${compact ? "absolute right-0 top-0" : "ml-auto"} rounded-full bg-green-700 px-1 text-xs text-white`}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}{item.href === "/admin/notifications" && unreadNotifications > 0 && <span aria-label={`${unreadNotifications} unread notifications`} className={`${compact ? "absolute right-0 top-0" : "ml-auto"} rounded-full bg-green-700 px-1 text-xs text-white`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}{active && <span className="sr-only">({t("currentPage")})</span>}</>;
    return enabled
      ? <Link key={item.href} href={item.href} title={t(item.label)} aria-current={active ? "page" : undefined} onClick={() => setMoreOpen(false)} className={className}>{content}</Link>
      : <div key={item.href} aria-disabled="true" title={t(authorized ? "adminPageUnavailable" : "adminAccessDenied")} className={className}>{content}</div>;
  }

  const helpLink = <Link href="/admin/help-support" onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center gap-3 border-t border-[#E6ECE8] px-3 pt-3 text-sm font-semibold text-[#17211B] hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><LifeBuoy aria-hidden="true" size={18} />{t("helpSupport")}</Link>;

  return <div className="min-h-[calc(100vh-4rem)] bg-[#F6F8F6] pb-16 text-[#17211B] md:pb-0">
    <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-[1600px]">
      <aside id="admin-sidebar" className={`sticky top-[72px] hidden h-[calc(100dvh-72px)] shrink-0 flex-col border-r border-[#E0E8E3] bg-white p-3 md:flex ${sidebarHidden ? "w-20" : "w-60"}`}>
        <div className="mb-3 flex items-center justify-between gap-2 px-2">{!sidebarHidden && <span className="text-base font-bold text-[#17211B]">{t("adminPortal")}</span>}<button type="button" onClick={() => setDesktopSidebarHidden(!sidebarHidden)} aria-expanded={!sidebarHidden} aria-label={t(sidebarHidden ? "showAdminSidebar" : "hideAdminSidebar")} title={t(sidebarHidden ? "showAdminSidebar" : "hideAdminSidebar")} className="grid min-h-10 min-w-10 place-items-center rounded-md text-[#52645A] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{sidebarHidden ? <PanelLeftOpen aria-hidden="true" size={18}/> : <PanelLeftClose aria-hidden="true" size={18} />}</button></div>
        <nav aria-label={t("adminNavigation")} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">{adminLinks.map(item => sidebarLink(item))}{sidebarHidden ? <Link href="/admin/help-support" title={t("helpSupport")} aria-label={t("helpSupport")} className="grid min-h-11 place-items-center rounded-md text-[#17211B] hover:bg-[#EFF6F1]"><LifeBuoy size={18}/></Link> : helpLink}</nav>
        <button type="button" title={t("signOut")} onClick={signOut} className="mt-2 flex min-h-11 items-center gap-3 border-t border-[#E6ECE8] px-3 pt-3 text-left text-sm font-semibold text-[#17211B] hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><LogOut aria-hidden="true" size={18} className="shrink-0" /><span className={sidebarHidden ? "sr-only" : ""}>{t("signOut")}</span></button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7">
        {!pathname.startsWith("/admin/members") && <nav aria-label={t("breadcrumbNavigation")} className="mb-5"><ol className="flex flex-wrap items-center gap-2 text-sm text-[#5B665F]"><li><Link href="/" className="rounded hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("home")}</Link></li><li className="flex items-center gap-2"><ChevronRight aria-hidden="true" size={15} /><Link href="/admin" className="rounded hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("adminPortal")}</Link></li>{(pathname.includes("/admin/programmes/participant-progress") || pathname.startsWith("/admin/businesses/"))&&<li className="flex items-center gap-2"><ChevronRight aria-hidden="true" size={15}/><Link href={pathname.startsWith("/admin/businesses/")?"/admin/businesses":"/admin/programmes"} className="rounded hover:text-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t(pathname.startsWith("/admin/businesses/")?"adminBusinesses":"adminProgrammes")}</Link></li>}<li className="flex items-center gap-2" aria-current="page"><ChevronRight aria-hidden="true" size={15} /><span className="font-semibold text-[#075C32]">{pathname.startsWith("/admin/help-support") ? t("helpSupport") : t(pathname === "/admin" ? "adminDashboard" : pathname.startsWith("/admin/businesses/") ? "adminBusinessDetails" : pathname.includes("/admin/programmes/participant-progress") ? "adminParticipantProgress" : currentLink?.label ?? "adminPortal")}</span></li></ol></nav>}
        {children}
      </main>
    </div>

    <nav aria-label={t("adminNavigation")} className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E0E8E3] bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-3px_12px_#0000000D] md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 py-2">
        {mobilePrimary.map(({ label, href, icon: Icon }) => {
          const active = isCurrentPage(pathname, href);
          const link = adminLinks.find((item) => item.href === href);
          const enabled = href === "/admin" ? permissions.includes("reports.view") : Boolean(link && permissions.includes(link.permission) && link.implemented);
          const className = `flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] ${active ? "text-[#006B3B]" : enabled ? "text-[#39443D]" : "text-[#839087]"}`;
          return <div key={href} className="flex justify-center">{enabled ? <Link href={href} aria-current={active ? "page" : undefined} className={className}><Icon aria-hidden="true" size={19} /><span>{t(label)}</span></Link> : <div aria-disabled="true" title={t("adminPageUnavailable")} className={`${className} cursor-not-allowed`}><Icon aria-hidden="true" size={19} /><span>{t(label)}</span></div>}</div>;
        })}
        <button type="button" aria-expanded={moreOpen} aria-controls="admin-more-navigation" onClick={() => setMoreOpen((open) => !open)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] ${adminLinks.some(({ href }) => href !== "/admin" && isCurrentPage(pathname, href)) ? "text-[#006B3B]" : "text-[#39443D]"}`}><MoreHorizontal aria-hidden="true" size={19} /><span>{t("more")}</span></button>
      </div>
    </nav>
    {moreOpen && <div id="admin-more-navigation" className="fixed right-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 max-h-[70dvh] w-60 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-[#E0E8E3] bg-white p-2 shadow-lg md:hidden"><nav aria-label={t("adminNavigation")} className="grid gap-1">{adminLinks.filter(item => !mobilePrimary.some(primary => primary.href === item.href)).map(item => sidebarLink(item, true))}{helpLink}</nav><button type="button" onClick={signOut} className="mt-2 flex min-h-11 w-full items-center gap-3 border-t border-[#E6ECE8] px-3 pt-3 text-left text-sm font-semibold text-[#17211B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><LogOut aria-hidden="true" size={18} />{t("signOut")}</button></div>}
  </div>;
}
