"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BookOpen, CalendarDays, FolderOpen, GraduationCap, Handshake, LayoutDashboard, LogOut, MessageSquare, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Settings, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import { useProtectedSession } from "@/modules/auth/components/protected-page";
import { useMentorPortal } from "../hooks/use-mentor-portal";
import { MentorDashboardPage } from "../pages/mentor-dashboard-page";
import { MentorProgrammesPage } from "../pages/mentor-programmes-page";
import { MentorCohortsPage } from "../pages/mentor-cohorts-page";
import { MentorMembersPage } from "../pages/mentor-members-page";
import { MentorMentorshipPage } from "../pages/mentor-mentorship-page";
import { MentorResourcesPage } from "../pages/mentor-resources-page";
import { MentorEventsPage } from "../pages/mentor-events-page";
import { MentorProfilePage } from "../pages/mentor-profile-page";
import { MentorSettingsPage } from "../pages/mentor-settings-page";
import { MemberMessagesPage } from "@/modules/member-portal/pages/member-messages-page";
import { MemberNotificationsPage } from "@/modules/member-portal/pages/member-notifications-page";
import { authService } from "@/modules/auth/services/auth.service";
import { useUnreadMessages } from "@/modules/member-portal/hooks/use-unread-messages";
import { useUnreadNotifications } from "@/modules/member-portal/hooks/use-unread-notifications";

const links: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/mentor", icon: LayoutDashboard }, { label: "My Programmes", href: "/mentor/programmes", icon: BookOpen },
  { label: "My Cohorts", href: "/mentor/cohorts", icon: GraduationCap }, { label: "Members", href: "/mentor/members", icon: UsersRound }, { label: "Mentorship", href: "/mentor/mentorship", icon: Handshake }, { label: "Resources", href: "/mentor/resources", icon: FolderOpen }, { label: "Events", href: "/mentor/events", icon: CalendarDays }, { label: "Messages", href: "/mentor/messages", icon: MessageSquare }, { label: "Notifications", href: "/mentor/notifications", icon: Bell }, { label: "Profile", href: "/mentor/profile", icon: UserRound }, { label: "Settings", href: "/mentor/settings", icon: Settings },
];
export function MentorPortal({ children }: { children: React.ReactNode }) {
  const unreadMessages = useUnreadMessages();
  const unreadNotifications = useUnreadNotifications();
  const session = useProtectedSession(); const router = useRouter(); const pathname = usePathname();
  const [more, setMore] = useState(false); const { work, profile, setProfile, error, refresh } = useMentorPortal(session.roleName === "Mentor");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  useEffect(() => { const frame = requestAnimationFrame(() => setMore(false)); return () => cancelAnimationFrame(frame); }, [pathname]);
  useEffect(() => { const frame = requestAnimationFrame(() => setSidebarHidden(localStorage.getItem("tge.mentorSidebarHidden") === "true")); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => { if (!more) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMore(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [more]);
  function toggleSidebar() { setSidebarHidden((current) => { const next = !current; localStorage.setItem("tge.mentorSidebarHidden", String(next)); return next; }); }
  useEffect(() => { if (session.roleName !== "Mentor") router.replace(session.roleName === "Member" ? "/portal" : "/admin"); }, [session.roleName, router]);

  if (session.roleName !== "Mentor") return <p className="p-8">Checking account…</p>;
  const section = pathname.split("/")[2] ?? "dashboard"; const title = links.find((item) => item.href === pathname)?.label ?? "Mentor Portal";
  async function signOut() { const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); try { if (token) await authService.logout(token); } catch { /* Clear the local session if the server is unavailable. */ } finally { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login"); } }
  return <div className="mx-auto flex min-h-[70vh] max-w-[1500px] bg-[#f8fafb] pb-20 lg:pb-0">
    <aside className={`sticky top-[72px] hidden h-[calc(100dvh-72px)] shrink-0 flex-col border-r bg-white p-3 lg:flex ${sidebarHidden ? "w-20" : "w-52"}`}><div className="mb-3 flex items-center justify-between">{!sidebarHidden && <h2 className="text-lg font-bold">Mentor Portal</h2>}<button type="button" onClick={toggleSidebar} aria-expanded={!sidebarHidden} aria-label={sidebarHidden ? "Expand mentor sidebar" : "Collapse mentor sidebar"} title={sidebarHidden ? "Expand sidebar" : "Collapse sidebar"} className="grid h-10 w-10 place-items-center rounded hover:bg-green-50">{sidebarHidden ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button></div><nav aria-label="Mentor navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">{links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} title={label} aria-label={label} aria-current={pathname === href ? "page" : undefined} className={`relative flex items-center gap-3 rounded-md px-3 py-3 text-sm ${sidebarHidden ? "justify-center" : ""} ${pathname === href ? "bg-[#006b3b] font-semibold text-white" : "text-slate-700 hover:bg-green-50"}`}><Icon size={18}/><span className={sidebarHidden ? "sr-only" : ""}>{label}</span>{href === "/mentor/messages" && unreadMessages > 0 && <span aria-label={`${unreadMessages} unread messages`} className={`${sidebarHidden ? "absolute right-0 top-0" : "ml-auto"} rounded-full bg-green-700 px-1 text-xs text-white`}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}{href === "/mentor/notifications" && unreadNotifications > 0 && <span aria-label={`${unreadNotifications} unread notifications`} className={`${sidebarHidden ? "absolute right-0 top-0" : "ml-auto"} rounded-full bg-green-700 px-1 text-xs text-white`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>)}<button onClick={() => void signOut()} title="Log out" className="w-full rounded-md px-3 py-3 text-left text-sm text-slate-700 hover:bg-green-50"><span className="flex items-center gap-3"><LogOut size={18}/><span className={sidebarHidden ? "sr-only" : ""}>Log out</span></span></button></nav></aside>
    <main className="min-w-0 flex-1 space-y-5 p-4 sm:p-6"><p className="text-xs text-slate-600"><Link href="/">Home</Link> › <span className="text-green-700">{title}</span></p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!work || !profile ? !error && <p role="status">Loading…</p> : <>
        {section === "dashboard" && <MentorDashboardPage work={work} firstName={profile.user.firstName} refresh={refresh}/>}
        {section === "programmes" && <MentorProgrammesPage work={work}/>}
        {section === "cohorts" && <MentorCohortsPage work={work} refresh={refresh}/>}
        {section === "members" && <MentorMembersPage work={work}/>}
        {section === "mentorship" && <MentorMentorshipPage work={work} refresh={refresh}/>}
        {section === "resources" && <MentorResourcesPage work={work} userId={session.userId} refresh={refresh}/>}
        {section === "events" && <MentorEventsPage/>}
        {section === "messages" && <MemberMessagesPage/>}
        {section === "notifications" && <MemberNotificationsPage/>}
        {section === "profile" && <MentorProfilePage profile={profile} work={work} setProfile={setProfile}/>}
        {section === "settings" && <MentorSettingsPage profile={profile}/>}
        {!['dashboard', 'programmes', 'cohorts', 'members', 'mentorship', 'resources', 'events', 'messages', 'notifications', 'profile', 'settings'].includes(section) && children}
      </>}
    </main><nav aria-label="Mobile mentor navigation" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">{links.slice(0, 4).map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] ${pathname === href ? "text-green-700" : "text-slate-600"}`}><Icon size={19}/>{label.replace("My ", "")}</Link>)}<button onClick={() => setMore(!more)} aria-expanded={more} className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] text-slate-600"><MoreHorizontal size={19}/>More</button>{more && <div className="absolute bottom-full right-2 mb-2 max-h-[70dvh] w-60 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border bg-white p-2 shadow-lg">{links.slice(4).map((item) => <Link key={item.href} href={item.href} onClick={() => setMore(false)} className="block px-5 py-3 text-sm">{item.label}{item.href === "/mentor/messages" && unreadMessages > 0 && <span className="ml-2 rounded-full bg-green-700 px-2 text-xs text-white">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}{item.href === "/mentor/notifications" && unreadNotifications > 0 && <span className="ml-2 rounded-full bg-green-700 px-2 text-xs text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>)}<button onClick={() => void signOut()} className="block w-full px-5 py-3 text-left text-sm">Log out</button></div>}</nav>
  </div>;
}
