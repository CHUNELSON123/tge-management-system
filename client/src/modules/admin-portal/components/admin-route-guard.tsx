"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/modules/i18n/language-provider";
import { adminAccessService } from "../services/admin-access.service";
import type { AdminAccess } from "../types/admin-access.types";
import { AdminPortalShell } from "./admin-portal-shell";

const routePermissions: Array<{ prefix: string; permission: string | string[] }> = [
  { prefix: "/admin", permission: "reports.view" },
  { prefix: "/admin/members/applications", permission: "users.manage" },
  { prefix: "/admin/members/new", permission: ["members.manage", "users.manage"] },
  { prefix: "/admin/members", permission: "members.manage" },
  { prefix: "/admin/programmes", permission: "programmes.manage" },
  { prefix: "/admin/payments", permission: "payments.manage" },
  { prefix: "/admin/events", permission: "events.manage" },
  { prefix: "/admin/mentorship", permission: "mentorship.manage" },
  { prefix: "/admin/resources", permission: "resources.manage" },
  { prefix: "/admin/businesses", permission: "businesses.manage" },
  { prefix: "/admin/reports", permission: "reports.view" },
  { prefix: "/admin/website", permission: "website.manage" },
  { prefix: "/admin/users-roles/roles", permission: "roles.manage" },
  { prefix: "/admin/users-roles", permission: "users.manage" },
  { prefix: "/admin/audit-log", permission: "audit.view" },
  { prefix: "/admin/settings", permission: "system.manage" },
];

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController();
    adminAccessService.getAccess(token, controller.signal).then((result) => {
      if (!cancelled) setAccess(result);
    }).catch((error: unknown) => {
      if (cancelled) return;
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
      if (status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/admin/login");
      } else {
        setDenied(true);
        router.replace("/portal");
      }
    });
    return () => { cancelled = true; controller.abort(); };
  }, [router]);

  const requiredPermission = routePermissions
    .filter(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((left, right) => right.prefix.length - left.prefix.length)[0]?.permission;
  const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : requiredPermission ? [requiredPermission] : [];
  const organisationAdminSettings = Boolean(
    access?.roleName === "Organisation Administrator" &&
    (pathname === "/admin/settings" || pathname.startsWith("/admin/settings/")),
  );
  const allowed = Boolean(access && (
    organisationAdminSettings ||
    (requiredPermissions.length > 0 && requiredPermissions.every((permission) => access.permissions.includes(permission)))
  ));

  if (!allowed || !access) {
    return <main className="grid min-h-[50vh] place-items-center text-sm text-[#52645A]">{denied ? t("adminAccessDenied") : t("checkingSession")}</main>;
  }

  return <AdminPortalShell permissions={access.permissions} roleName={access.roleName}>{children}</AdminPortalShell>;
}
