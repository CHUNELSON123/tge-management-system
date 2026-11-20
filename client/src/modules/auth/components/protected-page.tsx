"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, AuthRequestError } from "../services/auth.service";
import type { AuthenticatedSessionResponse } from "../types/auth.types";
import { useLanguage } from "@/modules/i18n/language-provider";

type ProtectedSession = AuthenticatedSessionResponse["data"];
const ProtectedSessionContext = createContext<ProtectedSession | null>(null);

export function useProtectedSession() {
  const session = useContext(ProtectedSessionContext);
  if (!session) throw new Error("useProtectedSession must be used inside ProtectedPage.");
  return session;
}

export function ProtectedPage({ children, loginHref = "/login" }: { children: React.ReactNode; loginHref?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<ProtectedSession | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { const next = window.location.pathname + window.location.search; router.replace(`${loginHref}?next=${encodeURIComponent(next)}`); return; }
    authService.getSession(token).then(({ data }) => { if (!cancelled) { setUnavailable(false); setSession(data); } }).catch((error: unknown) => {
      if (cancelled) return;
      if (error instanceof AuthRequestError && error.status === 401) {
        localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken");
        const next = window.location.pathname + window.location.search;
        router.replace(`${loginHref}?next=${encodeURIComponent(next)}`);
      } else setUnavailable(true);
    });
    return () => { cancelled = true; };
  }, [loginHref, router, attempt]);
  return session ? (
    <ProtectedSessionContext.Provider value={session}>{children}</ProtectedSessionContext.Provider>
  ) : unavailable ? <main className="grid min-h-screen place-content-center gap-3 text-center"><p role="alert">{t("sessionCheckUnavailable")}</p><button type="button" className="underline" onClick={() => { setUnavailable(false); setAttempt(value => value + 1); }}>{t("retry")}</button></main> : <main className="grid min-h-screen place-items-center">{t("checkingSession")}</main>;
}
