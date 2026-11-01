"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return; }
    authService.getSession(token).then(() => { if (!cancelled) setReady(true); }).catch(() => {
      localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken");
      router.replace("/login");
    });
    return () => { cancelled = true; };
  }, [router]);
  return ready ? children : <main className="grid min-h-screen place-items-center">Checking your session…</main>;
}
