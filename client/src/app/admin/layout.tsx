import { Suspense } from "react";
import { AdminLayoutGate } from "@/modules/admin-portal/components/admin-layout-gate";

// Admin access is currently resolved from the browser token by ProtectedPage.
// The segment cannot be validated as an instant server-rendered navigation
// until authentication moves to a server-readable session.
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<main role="status" className="grid min-h-[50vh] place-items-center text-sm text-[#52645A]">Checking administrator access…</main>}>
      <AdminLayoutGate>{children}</AdminLayoutGate>
    </Suspense>
  );
}
