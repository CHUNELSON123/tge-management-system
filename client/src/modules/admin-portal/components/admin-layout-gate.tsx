"use client";

import { usePathname } from "next/navigation";
import { ProtectedPage } from "@/modules/auth/components/protected-page";
import { AdminRouteGuard } from "./admin-route-guard";

export function AdminLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login" || pathname === "/admin/setup") return children;
  return <ProtectedPage loginHref="/admin/login"><AdminRouteGuard>{children}</AdminRouteGuard></ProtectedPage>;
}
