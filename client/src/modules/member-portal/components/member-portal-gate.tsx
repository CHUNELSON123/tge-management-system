"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProtectedSession } from "@/modules/auth/components/protected-page";
import { useLanguage } from "@/modules/i18n/language-provider";
import { MemberDashboardPage } from "../pages/member-dashboard-page";
import { MemberProfilePage } from "../pages/member-profile-page";
import { MemberSettingsPage } from "../pages/member-settings-page";
import { MemberProgrammesPage } from "../pages/member-programmes-page";
import { MemberEventsPage } from "../pages/member-events-page";
import { MemberEventDetailsPage } from "../pages/member-event-details-page";
import { MemberMentorshipPage } from "../pages/member-mentorship-page";
import { MemberResourcesPage } from "../pages/member-resources-page";
import { MemberBusinessesPage } from "../pages/member-businesses-page";
import { MemberNotificationsPage } from "../pages/member-notifications-page";
import { MemberMessagesPage } from "../pages/member-messages-page";
import { MemberHelpPage } from "../pages/member-help-page";
import { MemberPortalShell } from "./member-portal-shell";

export function MemberPortalGate({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const session = useProtectedSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session.roleName !== "Member" && pathname !== "/portal") router.replace("/portal");
  }, [pathname, router, session.roleName]);

  if (session.roleName !== "Member" && pathname !== "/portal") {
    return <main className="grid min-h-[50vh] place-items-center">{t("checkingSession")}</main>;
  }

  if (session.roleName !== "Member") return children;

  return (
    <MemberPortalShell>
      {pathname === "/portal" ? <MemberDashboardPage /> : pathname === "/portal/profile" ? <MemberProfilePage /> : pathname === "/portal/settings" ? <MemberSettingsPage /> : pathname === "/portal/programmes" ? <MemberProgrammesPage /> : pathname === "/portal/events" ? <MemberEventsPage /> : pathname.startsWith("/portal/events/") ? <MemberEventDetailsPage eventId={pathname.slice("/portal/events/".length).split("/")[0]} /> : pathname === "/portal/mentorship" ? <MemberMentorshipPage /> : pathname === "/portal/resources" ? <MemberResourcesPage /> : pathname === "/portal/businesses" ? <MemberBusinessesPage /> : pathname === "/portal/notifications" ? <MemberNotificationsPage /> : pathname === "/portal/messages" ? <MemberMessagesPage /> : pathname === "/portal/help" ? <MemberHelpPage /> : children}
    </MemberPortalShell>
  );
}
