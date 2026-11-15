"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import { MemberPortalShell } from "./member-portal-shell";

export function MemberPublicPageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) {
      const timeout = window.setTimeout(() => setIsMember(false), 0);
      return () => window.clearTimeout(timeout);
    }

    authService.getSession(token)
      .then(({ data }) => {
        if (!cancelled) setIsMember(data.roleName === "Member");
      })
      .catch(() => {
        if (!cancelled) setIsMember(false);
      });

    return () => { cancelled = true; };
  }, [pathname]);

  if (!pathname.startsWith("/portal") && isMember) {
    return <MemberPortalShell>{children}</MemberPortalShell>;
  }

  return children;
}
