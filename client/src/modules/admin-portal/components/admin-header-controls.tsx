"use client";
import Image from "next/image";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, UserRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useAdminHeader } from "../hooks/use-admin-header";

interface AdminHeaderControlsProps {
  displayName: string;
  email: string;
  roleName: string;
  compact?: boolean;
}

export function AdminHeaderControls({ displayName, email, roleName, compact = false }: AdminHeaderControlsProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { notifications, unreadCount, photoUrl, loading, failed, markRead } = useAdminHeader(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationOpen && !accountOpen) return;
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") { setNotificationOpen(false); setAccountOpen(false); }
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) { setNotificationOpen(false); setAccountOpen(false); }
    }
    window.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", close); document.removeEventListener("pointerdown", outside); };
  }, [accountOpen, notificationOpen]);

  const controlClass = "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#111B16] hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2";
  return <div ref={rootRef} className={`flex items-center ${compact ? "gap-0" : "gap-2 sm:gap-3"}`}>
    <div className="relative">
      <button type="button" aria-label={`${t("adminNotifications")}${unreadCount ? `, ${unreadCount} ${t("adminUnreadNotifications")}` : ""}`} aria-haspopup="dialog" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen((open) => !open); setAccountOpen(false); }} className={controlClass}>
        <Bell aria-hidden="true" size={22} />
        {unreadCount > 0 && <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#087B49] px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {notificationOpen && <section role="dialog" aria-label={t("adminNotifications")} className="fixed left-2 right-2 top-[68px] z-[70] mt-2 rounded-xl border border-[#E0E8E3] bg-white p-3 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-[min(22rem,calc(100vw-1rem))]">
        <h2 className="px-1 pb-2 text-sm font-bold text-[#17211B]">{t("adminNotifications")}</h2>
        {loading ? <p role="status" className="p-3 text-sm text-[#65736A]">{t("adminNotificationsLoading")}</p>
          : failed ? <p role="alert" className="p-3 text-sm text-[#65736A]">{t("adminNotificationsUnavailable")}</p>
          : notifications.length === 0 ? <p className="p-3 text-sm text-[#65736A]">{t("adminNoNotifications")}</p>
          : <ul className="max-h-[60dvh] space-y-1 overflow-y-auto">{notifications.map((notification) => <li key={notification.id}>
            <button type="button" onClick={() => { if (!notification.readAt) void markRead(notification.id); if (notification.conversationId) { setNotificationOpen(false); router.push(`/admin/messages?conversation=${encodeURIComponent(notification.conversationId)}`); } }} className={`w-full rounded-lg p-3 text-left hover:bg-[#F4F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] ${notification.readAt ? "" : "bg-[#F1F8F3]"}`}>
              <span className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-transparent" : "bg-[#087B49]"}`} /><span className="min-w-0"><strong className="block text-xs text-[#17211B]">{notification.title}</strong><span className="mt-1 block line-clamp-3 whitespace-pre-line text-xs leading-5 text-[#52645A]">{notification.body}</span></span></span>
            </button>
          </li>)}</ul>}
      </section>}
    </div>
    <div className="relative">
      <button type="button" aria-label={`${t("adminAccount")}: ${displayName}`} aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => { setAccountOpen((open) => !open); setNotificationOpen(false); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-[#F2F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF3ED] text-[#075C32]" aria-hidden="true">{photoUrl ? <Image unoptimized width={128} height={128} src={photoUrl} alt="" className="h-full w-full object-cover" /> : <UserRound size={20} />}</span>
        {!compact && <span className="hidden max-w-28 text-xs font-semibold leading-4 text-[#17211B] xl:block">{displayName}</span>}
        <ChevronDown aria-hidden="true" size={15} className="hidden text-[#52645A] sm:block" />
      </button>
      {accountOpen && <div role="menu" aria-label={t("adminAccount")} className="absolute right-0 top-full z-[70] mt-2 min-w-52 rounded-lg border border-[#E0E8E3] bg-white p-2 shadow-lg">
        <p className="truncate px-3 py-2 text-sm font-semibold text-[#17211B]">{displayName}</p><p className="truncate px-3 pb-1 text-xs text-[#5B665F]">{email}</p><p className="px-3 pb-2 text-xs text-[#075C32]">{roleName}</p>
        <Link href="/admin" role="menuitem" onClick={() => setAccountOpen(false)} className="flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-[#075C32] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("adminDashboard")}</Link>
      </div>}
    </div>
  </div>;
}
