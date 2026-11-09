"use client";

import { useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCheck, Megaphone, MessageSquare, Settings2, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberNotifications } from "../hooks/use-member-notifications";

export function MemberNotificationsPage() {
  const { locale, t } = useLanguage();
  const { notifications, loading, failed, actionFailed, markRead, markAllRead, retry } = useMemberNotifications();
  const [category, setCategory] = useState("all");
  const isFrench = locale === "fr";
  const categories = useMemo(() => [...new Set(notifications.map((item) => item.notificationType))].sort(), [notifications]);
  const visible = category === "all" ? notifications : notifications.filter((item) => item.notificationType === category);
  const unread = notifications.filter((item) => !item.readAt).length;
  const unreadCounts = useMemo(() => notifications.reduce<Record<string, number>>((counts, item) => {
    if (!item.readAt) counts[item.notificationType] = (counts[item.notificationType] ?? 0) + 1;
    return counts;
  }, {}), [notifications]);
  const text = isFrench ? {
    title: "Notifications", intro: "Restez au courant des annonces, événements et mises à jour.", all: "Tout", markAll: "Tout marquer comme lu", preferences: "Préférences de notification", preferencesCopy: "Les préférences ne peuvent pas être modifiées : aucun service ne permet de les enregistrer.", stay: "Restez connecté", empty: "Vous n’avez aucune notification.", noCategory: "Aucune notification dans cette catégorie.", error: "Les notifications sont temporairement indisponibles.", actionError: "La mise à jour n’a pas été enregistrée. Réessayez.", retry: "Réessayer", unread: "Non lu", markRead: "Marquer comme lu",
  } : {
    title: "Notifications", intro: "Stay up to date with announcements, opportunities, events, and messages.", all: "All", markAll: "Mark all as read", preferences: "Notification Preferences", preferencesCopy: "Preferences cannot be changed because there is no service to save them.", stay: "Stay Connected", empty: "You have no notifications.", noCategory: "There are no notifications in this category.", error: "Notifications are temporarily unavailable.", actionError: "Your update was not saved. Please try again.", retry: "Retry", unread: "Unread", markRead: "Mark as read",
  };
  const categoryLabel = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const date = (value: string) => new Intl.DateTimeFormat(isFrench ? "fr-CA" : "en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const styleFor = (type: string): { icon: LucideIcon; card: string; iconColor: string } => {
    const normalized = type.toLowerCase();
    if (normalized.includes("event")) return { icon: CalendarDays, card: "border-[#DDEAF5] bg-[#F0F6FB]", iconColor: "text-[#2675B8]" };
    if (normalized.includes("announcement")) return { icon: Megaphone, card: "border-[#D9EADF] bg-[#F1F8F3]", iconColor: "text-[#087443]" };
    if (normalized.includes("opportunit")) return { icon: CalendarDays, card: "border-[#F4E7CB] bg-[#FFF8EB]", iconColor: "text-[#C28100]" };
    if (normalized.includes("mentor")) return { icon: UsersRound, card: "border-[#E9DFF2] bg-[#F7F2FA]", iconColor: "text-[#8051B0]" };
    if (normalized.includes("message")) return { icon: MessageSquare, card: "border-[#DDEAF5] bg-[#F3F7FC]", iconColor: "text-[#2675B8]" };
    return { icon: Bell, card: "border-[#E6ECE8] bg-white", iconColor: "text-[#53645A]" };
  };
  const markAllButton = (className: string) => <button type="button" disabled={unread === 0 || loading || failed} onClick={markAllRead} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D9E2DC] px-3 text-sm font-semibold text-[#087443] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}><CheckCheck aria-hidden="true" size={17}/>{text.markAll}</button>;

  return <section aria-labelledby="member-notifications-title" className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 id="member-notifications-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-2 text-sm text-[#59645D]">{text.intro}</p></div>{markAllButton("hidden sm:inline-flex")}</header>
    {actionFailed && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{text.actionError}</p>}
    {loading ? <p role="status" className="rounded-xl border p-6 text-sm text-[#53645A]">{t("loading")}</p> : failed ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{text.error}<button type="button" onClick={retry} className="ml-3 font-semibold underline">{text.retry}</button></div> : <>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div role="tablist" aria-label={text.title} className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <CategoryTab label={text.all} count={unread} selected={category === "all"} onClick={() => setCategory("all")}/>
            {categories.map((item) => <CategoryTab key={item} label={categoryLabel(item)} count={unreadCounts[item] ?? 0} selected={category === item} onClick={() => setCategory(item)}/>)}
          </div>
          {visible.length ? <ul className="space-y-3">{visible.map((notification) => {
            const style = styleFor(notification.notificationType);
            const NotificationIcon = style.icon;
            return <li key={notification.id} className={`rounded-xl border p-4 ${style.card}`}><div className="flex gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/80 ${style.iconColor}`}><NotificationIcon aria-hidden="true" size={20}/></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-[#17211B]">{notification.title}</h2><div className="flex shrink-0 items-center gap-2">{!notification.readAt && <span className="h-2 w-2 rounded-full bg-[#078347]" aria-label={text.unread}/>}<time className="text-xs text-[#68736C]">{date(notification.createdAt)}</time></div></div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#59645D]">{notification.body}</p>{!notification.readAt && <button type="button" onClick={() => void markRead(notification.id)} className="mt-3 text-xs font-semibold text-[#087443] hover:underline">{text.markRead}</button>}
              </div>
            </div></li>;
          })}</ul> : <p className="rounded-xl border border-dashed border-[#CBD8CE] p-6 text-sm text-[#59645D]">{notifications.length ? text.noCategory : text.empty}</p>}
        </div>
        <aside className="hidden space-y-4 xl:block"><section className="rounded-xl border border-[#E6ECE8] p-5"><h2 className="flex items-center gap-2 font-bold"><Settings2 aria-hidden="true" size={18}/>{text.preferences}</h2><p className="mt-3 text-sm leading-5 text-[#59645D]">{text.preferencesCopy}</p></section><section className="rounded-xl bg-[#F0F8F2] p-5 text-center"><Bell aria-hidden="true" size={28} className="mx-auto text-[#087443]"/><h2 className="mt-2 font-bold">{text.stay}</h2><p className="mt-1 text-sm text-[#59645D]">{unread} {text.unread.toLowerCase()}</p></section></aside>
      </div>
      {markAllButton("w-full sm:hidden")}
    </>}
  </section>;
}

function CategoryTab({ label, count, selected, onClick }: { label: string; count: number; selected: boolean; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={selected} onClick={onClick} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${selected ? "bg-[#EAF5EE] text-[#006B3B]" : "border border-[#E6ECE8] text-[#39443D] hover:bg-[#F7F9F8]"}`}><span>{label}</span><span className={`rounded-full px-2 py-0.5 text-xs ${selected ? "bg-white" : "bg-[#F1F3F2]"}`}>{count}</span></button>;
}
