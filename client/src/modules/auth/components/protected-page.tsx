"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import type { AuthenticatedSessionResponse } from "../types/auth.types";
import { useLanguage } from "@/modules/i18n/language-provider";

type ProtectedSession = AuthenticatedSessionResponse["data"];
const ProtectedSessionContext = createContext<ProtectedSession | null>(null);

export function useProtectedSession() {
  const session = useContext(ProtectedSessionContext);
  if (!session) throw new Error("useProtectedSession must be used inside ProtectedPage.");
  return session;
}

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<ProtectedSession | null>(null);
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return; }
    authService.getSession(token).then(({ data }) => { if (!cancelled) setSession(data); }).catch(() => {
      localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken");
      router.replace("/login");
    });
    return () => { cancelled = true; };
  }, [router]);
  return session ? (
    <ProtectedSessionContext.Provider value={session}>{children}</ProtectedSessionContext.Provider>
  ) : <main className="grid min-h-screen place-items-center">{t("checkingSession")}</main>;
}
