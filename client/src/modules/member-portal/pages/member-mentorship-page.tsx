"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, Clock3, FileText, GraduationCap, MessageSquare, UsersRound, Video } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberMentorship } from "../hooks/use-member-mentorship";
import { useMemberResources } from "../hooks/use-member-resources";

export function MemberMentorshipPage() {
  const { locale, t } = useLanguage();
  const { data, loading, failed, retry } = useMemberMentorship();
  const { data: allResources } = useMemberResources();
  const isFrench = locale === "fr";
  const now = Date.now();
  const sessions = data?.assignments.flatMap((assignment) => assignment.sessions.map((session) => ({ ...session, mentorName: assignment.mentorName, expertise: assignment.expertise }))) ?? [];
  const upcomingSessions = sessions.filter((session) => session.status.toLowerCase() === "scheduled" && new Date(session.scheduledStart).getTime() >= now).sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const nextSession = upcomingSessions[0] ?? null;
  const activeAssignments = data?.assignments.filter((assignment) => assignment.status.toLowerCase() === "active") ?? [];
  const history = sessions.filter((session) => session.status.toLowerCase() === "completed").sort((a, b) => b.scheduledStart.localeCompare(a.scheduledStart)).slice(0, 5);
  const mentorshipResources = useMemo(() => (allResources ?? []).filter((resource) => `${resource.title} ${resource.category} ${resource.description ?? ""}`.toLowerCase().includes("mentor")).slice(0, 3), [allResources]);
  const text = isFrench ? {
    title: "Mon mentorat", intro: "Connectez-vous avec des mentors expérimentés pour faire progresser votre parcours entrepreneurial.", find: "Trouver un mentor", active: "Mentorats actifs", completed: "Séances terminées", upcomingCount: "Séances à venir", hours: "Heures de mentorat", viewAll: "Tout voir", history: "Historique", schedule: "Planning", totalHours: "Total des heures", activeHeading: "Mentorats actifs", next: "Prochaine séance", topic: "Sujet", online: "Séance en ligne", message: "Message", details: "Voir les détails", upcoming: "Séance à venir", join: "Rejoindre la séance", reschedule: "Replanifier", resources: "Ressources de mentorat", viewResources: "Voir toutes les ressources", recommended: "Mentors recommandés", viewMentors: "Voir tous les mentors", noAssignments: "Aucun mentorat actif n’est associé à votre compte.", noUpcoming: "Aucune séance à venir n’est planifiée.", noHistory: "Aucune séance terminée n’est enregistrée.", noMentors: "La découverte de mentors n’est pas disponible pour le moment.", noResources: "Aucune ressource de mentorat publiée n’est actuellement disponible.", unavailable: "Indisponible", unavailableError: "Impossible de charger vos informations de mentorat.", retry: "Réessayer",
  } : {
    title: "My Mentorship", intro: "Connect with experienced mentors and accelerate your entrepreneurial journey.", find: "Find a Mentor", active: "Active Mentorships", completed: "Sessions Completed", upcomingCount: "Upcoming Sessions", hours: "Mentorship Hours", viewAll: "View all", history: "View history", schedule: "View schedule", totalHours: "Total hours", activeHeading: "Active Mentorships", next: "Next Session", topic: "Topic", online: "Online meeting", message: "Message", details: "View Details", upcoming: "Upcoming Session", join: "Join Session", reschedule: "Reschedule", resources: "Mentorship Resources", viewResources: "View all resources", recommended: "Recommended Mentors", viewMentors: "View All Mentors", noAssignments: "No active mentorship assignments are linked to your account.", noUpcoming: "No upcoming session is scheduled.", noHistory: "No completed sessions are recorded.", noMentors: "Mentor discovery is not currently available.", noResources: "No published mentorship resources are currently available.", unavailable: "Unavailable", unavailableError: "We could not load your mentorship information.", retry: "Retry",
  };
  const formatDate = (value: string, withTime = true) => new Intl.DateTimeFormat(isFrench ? "fr-CA" : "en-CA", { month: "short", day: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) }).format(new Date(value));
  const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  if (loading) return <section aria-labelledby="member-mentorship-title"><h1 id="member-mentorship-title" className="text-2xl font-bold">{text.title}</h1><p role="status" className="mt-5 rounded-xl border p-6 text-sm text-[#53645A]">{t("loading")}</p></section>;
  if (failed || !data) return <section aria-labelledby="member-mentorship-title"><h1 id="member-mentorship-title" className="text-2xl font-bold">{text.title}</h1><div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{text.unavailableError}<button onClick={retry} className="ml-3 font-semibold underline">{text.retry}</button></div></section>;

  return <section aria-labelledby="member-mentorship-title" className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 id="member-mentorship-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-2 text-sm text-[#59645D]">{text.intro}</p></div><button type="button" disabled title={text.noMentors} className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white opacity-60"><UsersRound size={17}/>{text.find}</button></header>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { icon: UsersRound, label: text.active, value: activeAssignments.length, accent: "bg-[#EFF7F1] text-[#087443]" },
        { icon: CalendarDays, label: text.completed, value: data.completedSessions, accent: "bg-[#EEF5FC] text-[#2474B9]" },
        { icon: Clock3, label: text.upcomingCount, value: upcomingSessions.length, accent: "bg-[#F4F0FB] text-[#8053B3]" },
        { icon: GraduationCap, label: text.hours, value: data.mentorshipHours === null ? text.unavailable : data.mentorshipHours, accent: "bg-[#FFF6E7] text-[#C28100]" },
      ].map(({ icon: Icon, label, value, accent }) => <article key={label} className="flex min-h-28 items-center gap-3 rounded-xl border border-[#E6ECE8] p-3 sm:p-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${accent}`}><Icon size={21} aria-hidden="true"/></span><div className="min-w-0"><p className="text-xs font-semibold text-[#59645D]">{label}</p><p className="mt-1 text-2xl font-bold text-[#17211B]">{value}</p></div></article>)}
    </div>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="member-active-mentorships"><div className="mb-4 flex items-center justify-between"><h2 id="member-active-mentorships" className="font-bold text-[#17211B]">{text.activeHeading}</h2>{activeAssignments.length > 0 && <span className="text-xs text-[#087443]">{activeAssignments.length} {text.viewAll} →</span>}</div>
          {activeAssignments.length ? <div className="grid gap-3 lg:grid-cols-2">{activeAssignments.map((assignment) => {
            const next = upcomingSessions.find((session) => session.mentorName === assignment.mentorName);
            return <article key={assignment.id} className="rounded-xl border border-[#E9EEEB] p-4"><div className="flex items-center gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#E9F4EC] text-lg font-bold text-[#087443]">{initials(assignment.mentorName)}</span><div className="min-w-0"><h3 className="font-bold text-[#17211B]">{assignment.mentorName}</h3>{assignment.expertise && <span className="mt-1 inline-block rounded-full bg-[#EAF5EE] px-2 py-1 text-xs font-semibold text-[#087443]">{assignment.expertise}</span>}</div></div><div className="mt-4 space-y-2 text-sm text-[#59645D]">{assignment.programmeName && <p>{assignment.programmeName}</p>}{next ? <><p className="flex items-center gap-2"><CalendarDays size={15}/>{text.next}: {formatDate(next.scheduledStart)}</p><p className="flex items-center gap-2"><Video size={15}/>{text.topic}: {next.title}</p></> : <p>{text.noUpcoming}</p>}</div><div className="mt-4 grid grid-cols-2 gap-2"><Link href="/portal/messages" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#0A7A43] px-3 text-sm font-semibold text-[#087443]"><MessageSquare size={15}/>{text.message}</Link><button disabled title={text.unavailable} className="min-h-10 cursor-not-allowed rounded-lg bg-[#006B3B] px-3 text-sm font-semibold text-white opacity-60">{text.details}</button></div></article>;
          })}</div> : <p className="rounded-lg border border-dashed border-[#CBD8CE] p-5 text-sm text-[#59645D]">{text.noAssignments}</p>}
        </section>
        <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="member-recommended-mentors"><div className="mb-3 flex items-center justify-between"><h2 id="member-recommended-mentors" className="font-bold text-[#17211B]">{text.recommended}</h2><span className="text-xs text-[#68736C]">{text.viewMentors} →</span></div><p className="rounded-lg bg-[#F7F9F8] p-4 text-sm text-[#59645D]">{text.noMentors}</p></section>
        {history.length > 0 && <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="member-mentorship-history"><h2 id="member-mentorship-history" className="mb-3 font-bold text-[#17211B]">{text.history}</h2><ul className="divide-y divide-[#EDF0EE]">{history.map((session) => <li key={session.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{session.title} · {session.mentorName}</span><time className="text-[#59645D]">{formatDate(session.scheduledStart)}</time></li>)}</ul></section>}
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-[#E6ECE8] p-4" aria-labelledby="member-upcoming-session"><h2 id="member-upcoming-session" className="flex items-center gap-2 font-bold text-[#17211B]"><CalendarDays size={18} className="text-[#087443]"/>{text.upcoming}</h2>{nextSession ? <><div className="mt-4 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#E9F4EC] font-bold text-[#087443]">{initials(nextSession.mentorName)}</span><div><p className="font-semibold">{nextSession.mentorName}</p>{nextSession.expertise && <p className="text-xs text-[#087443]">{nextSession.expertise}</p>}</div></div><div className="mt-4 space-y-2 text-sm text-[#59645D]"><p className="flex items-center gap-2"><CalendarDays size={15}/>{formatDate(nextSession.scheduledStart, false)}</p><p className="flex items-center gap-2"><Clock3 size={15}/>{formatDate(nextSession.scheduledStart)}</p><p className="flex items-center gap-2"><Video size={15}/>{nextSession.title}</p></div><button disabled title={text.unavailable} className="mt-4 min-h-10 w-full cursor-not-allowed rounded-lg bg-[#006B3B] px-3 text-sm font-semibold text-white opacity-60">{text.join}</button><button disabled title={text.unavailable} className="mt-2 min-h-10 w-full cursor-not-allowed rounded-lg border border-[#0A7A43] px-3 text-sm font-semibold text-[#087443] opacity-60">{text.reschedule}</button></> : <p className="mt-4 rounded-lg bg-[#F7F9F8] p-4 text-sm text-[#59645D]">{text.noUpcoming}</p>}</section>
        <section className="rounded-xl border border-[#E6ECE8] p-4" aria-labelledby="member-mentorship-resources"><h2 id="member-mentorship-resources" className="font-bold text-[#17211B]">{text.resources}</h2>{mentorshipResources.length ? <ul className="mt-2 divide-y divide-[#EDF0EE]">{mentorshipResources.map((resource) => <li key={resource.id} className="flex gap-3 py-3"><FileIcon/><div><p className="text-sm font-semibold">{resource.title}</p>{resource.description && <p className="mt-1 line-clamp-2 text-xs text-[#59645D]">{resource.description}</p>}</div></li>)}</ul> : <p className="mt-3 text-sm text-[#59645D]">{text.noResources}</p>}<Link href="/portal/resources" className="mt-3 inline-block text-sm font-semibold text-[#087443] hover:underline">{text.viewResources} →</Link></section>
      </aside>
    </div>
  </section>;
}

function FileIcon() { return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EDF7F0] text-[#087443]"><FileText size={17} aria-hidden="true"/></span>; }
