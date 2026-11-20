"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, UserRound, X } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";
import { authService } from "@/modules/auth/services/auth.service";
import { memberDashboardService } from "@/modules/member-portal/services/member-dashboard.service";
import { memberProfileService } from "@/modules/member-portal/services/member-profile.service";
import { AdminHeaderControls } from "@/modules/admin-portal/components/admin-header-controls";
import { SiteLogo } from "./site-logo";
import { useUnreadNotifications } from "@/modules/member-portal/hooks/use-unread-notifications";

const navigation = [
  { label: "home", href: "/" },
  { label: "aboutUs", href: "/about" },
  { label: "programmes", href: "/programmes" },
  { label: "events", href: "/events" },
  { label: "news", href: "/news" },
  { label: "businessDirectory", href: "/business-directory" },
  { label: "contactUs", href: "/contact" },
] as const;

interface MemberHeaderInfo {
  displayName: string | null;
  unreadNotifications: number | null;
}

interface AdminHeaderInfo {
  displayName: string;
  email: string;
  roleName: string;
}

export function SiteHeader() {
  const unreadNotifications = useUnreadNotifications();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [memberInfo, setMemberInfo] = useState<MemberHeaderInfo | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminHeaderInfo | null>(null);
  const [mentorName, setMentorName] = useState<string | null>(null);
  const [memberPhotoUrl, setMemberPhotoUrl] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isMember = memberInfo !== null;
  const isAdmin = adminInfo !== null;

  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) {
      const timeout = window.setTimeout(() => { setMemberInfo(null); setAdminInfo(null); setMentorName(null); }, 0);
      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();
    const refreshMemberInfo = () => {
      memberDashboardService.getDashboard(token, controller.signal)
        .then((dashboard) => setMemberInfo({
          displayName: dashboard.profile.displayName,
          unreadNotifications: dashboard.unreadNotifications,
        }))
        .catch(() => setMemberInfo(null));
      memberProfileService.getPhoto(token, controller.signal)
        .then((photo) => setMemberPhotoUrl(photo ? URL.createObjectURL(photo) : null))
        .catch(() => setMemberPhotoUrl(null));
    };
    authService.getSession(token).then(({ data }) => {
      if (controller.signal.aborted) return;
      setMentorName(data.roleName === "Mentor" ? data.displayName : null);
      if (data.roleName === "System Administrator" || data.roleName === "Organisation Administrator") {
        setAdminInfo({ displayName: data.displayName, email: data.email, roleName: data.roleName });
        setMemberInfo(null);
        setMemberPhotoUrl(null);
      } else if (data.roleName === "Member") {
        setAdminInfo(null);
        refreshMemberInfo();
      } else {
        setAdminInfo(null);
        setMemberInfo(null);
      }
    }).catch(() => {
      if (!controller.signal.aborted) { setAdminInfo(null); setMemberInfo(null); setMentorName(null); }
    });
    window.addEventListener("tge:member-profile-updated", refreshMemberInfo);
    return () => {
      controller.abort();
      window.removeEventListener("tge:member-profile-updated", refreshMemberInfo);
    };
  }, [pathname]);

  useEffect(() => () => {
    if (memberPhotoUrl?.startsWith("blob:")) URL.revokeObjectURL(memberPhotoUrl);
  }, [memberPhotoUrl]);

  useEffect(() => {
    if (!mobileMenuOpen && !accountMenuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
      }
    }
    function closeAccountMenuOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeAccountMenuOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeAccountMenuOnOutsideClick);
    };
  }, [accountMenuOpen, mobileMenuOpen]);

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

  function memberAccountControl(compact = false) {
    const unreadCount = unreadNotifications;
    const displayName = memberInfo?.displayName || t("memberRole");

    return (
      <div className={`flex items-center ${compact ? "gap-0" : "gap-3"}`}>
        <Link
          href="/portal/notifications"
          aria-label={t("memberNotifications")}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#111B16] hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
        >
          <Bell aria-hidden="true" size={22} />
          {unreadCount > 0 && <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#087B49] px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Link>

        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            aria-label={`${t("memberAccount")}: ${displayName}`}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#075C32]" aria-hidden="true">
              {memberPhotoUrl ? <img src={memberPhotoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : <UserRound size={20} />}
            </span>
            {!compact && <span className="hidden max-w-28 text-xs font-semibold leading-4 text-[#17211B] xl:block">{displayName}</span>}
            <ChevronDown aria-hidden="true" size={15} className="hidden text-[#52645A] sm:block" />
          </button>
          {accountMenuOpen && (
            <div role="menu" aria-label={t("memberAccount")} className="absolute right-0 top-full z-[70] mt-2 min-w-48 rounded-lg border border-[#E0E8E3] bg-white p-2 shadow-lg">
              <p className="px-3 py-2 text-sm font-semibold text-[#17211B]">{displayName}</p>
              <p className="px-3 pb-2 text-xs text-[#5B665F]">{t("memberRole")}</p>
              <Link
                href="/portal/profile"
                role="menuitem"
                onClick={() => setAccountMenuOpen(false)}
                className="flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-[#075C32] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"
              >
                {t("memberProfile")}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  function mentorNotificationBell() {
    return <Link href="/mentor/notifications" aria-label={t("memberNotifications")} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#111B16] hover:bg-[#F2F6F4]"><Bell aria-hidden="true" size={22}/>{unreadNotifications > 0 && <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#087B49] px-1 text-[10px] font-bold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}</Link>;
  }

  function adminAccountControl(compact = false) {
    return <AdminHeaderControls displayName={adminInfo?.displayName ?? t("adminPortal")} email={adminInfo?.email ?? ""} roleName={adminInfo?.roleName ?? ""} compact={compact} />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8E5] bg-white shadow-[0_1px_5px_#00000008]">
      <div className="relative mx-auto flex min-h-[68px] w-full max-w-[1440px] items-center justify-between gap-1 px-2 sm:gap-3 sm:px-8 lg:h-[72px] lg:px-10">
        <div className="flex min-w-0 shrink items-center gap-0 sm:gap-2">
          {(isMember || isAdmin || mentorName) && <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#1C1C1A] hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] lg:hidden"
            aria-label={t(mobileMenuOpen ? "closeMenu" : "openMenu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </button>}
          <Link href="/" aria-label={t("home")} className="w-[98px] shrink-0 rounded min-[360px]:w-[110px] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
            <span className="block origin-left scale-[0.7] min-[360px]:scale-[0.8] sm:scale-100"><SiteLogo priority /></span>
          </Link>
        </div>

        <nav aria-label={t("primaryNavigation")} className="hidden items-center gap-4 lg:flex xl:gap-6">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={navigationLinkClass(item.href)}>
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {isMember ? memberAccountControl() : isAdmin ? adminAccountControl() : mentorName ? <>{mentorNotificationBell()}<Link href="/mentor/profile" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-green-800"><UserRound size={20}/>{mentorName}</Link></> : (
            <Link href="/login" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#006B3B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">
              <UserRound aria-hidden="true" size={16} />
              {t("login")}
            </Link>
          )}
        </div>

        <div className="ml-auto shrink-0 lg:hidden"><LanguageSwitcher compact /></div>
        {isMember ? (
          <div className="flex shrink-0 items-center lg:hidden">{memberAccountControl(true)}</div>
        ) : isAdmin ? (
          <div className="flex shrink-0 items-center lg:hidden">{adminAccountControl(true)}</div>
        ) : mentorName ? (
          <div className="flex items-center lg:hidden">{mentorNotificationBell()}<Link href="/mentor/profile" aria-label="Mentor profile" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-50 text-green-800"><UserRound size={20}/></Link></div>
        ) : (
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
        )}
      </div>

      <div id="mobile-primary-navigation" hidden={!mobileMenuOpen} className="max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-[#E2E8E5] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden">
        <nav aria-label={t("primaryNavigation")} className="mx-auto flex max-w-7xl flex-col">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`border-b border-[#E8ECE9] px-2 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] ${isActive(item.href) ? "text-[#075C32]" : "text-[#1C1C1A]"}`} onClick={() => setMobileMenuOpen(false)}>
              {t(item.label)}
            </Link>
          ))}
        </nav>
        {!isMember && !isAdmin && !mentorName && <div className="mx-auto mt-4 flex max-w-7xl items-center justify-end px-2">
          <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-md bg-[#006B3B] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2" onClick={() => setMobileMenuOpen(false)}>{t("login")}</Link>
        </div>}
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8E5] bg-white shadow-[0_1px_5px_#00000008]">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[72px] lg:px-10">
        <Link href="/" aria-label={t("home")} className="shrink-0"><SiteLogo priority /></Link>
        <nav aria-label={t("primaryNavigation")} className="hidden items-center gap-4 lg:flex xl:gap-6">
          {navigation.map((item) => <Link key={item.label} href={item.href} className="px-0.5 py-2 text-sm font-semibold text-[#1C1C1A]">{t(item.label)}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex"><Link href="/login" className="rounded-md bg-[#006B3B] px-5 py-3 text-sm font-semibold text-white">{t("login")}</Link></div>
        <Menu aria-hidden="true" className="text-[#1C1C1A] lg:hidden" size={25} />
      </div>
    </header>
  );
}
