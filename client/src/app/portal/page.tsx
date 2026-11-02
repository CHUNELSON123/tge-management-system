"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import type { AuthenticatedSessionResponse } from "@/modules/auth/types/auth.types";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";
import { useLanguage } from "@/modules/i18n/language-provider";

const destinations: Record<string, "systemAdministration" | "administration" | "memberPortal" | "mentorPortal" | "trainerPortal"> = {
  "System Administrator": "systemAdministration",
  "Organisation Administrator": "administration",
  Member: "memberPortal",
  Mentor: "mentorPortal",
  "Trainer / Facilitator": "trainerPortal",
};

export default function PortalHome() {
  const { t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSessionResponse["data"] | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return; }
    authService.getSession(token).then((result) => setSession(result.data)).catch(() => router.replace("/login"));
  }, [router]);
  async function signOut() {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    try { if (token) await authService.logout(token); }
    finally { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login"); }
  }
  return <main className="mx-auto w-full max-w-5xl p-8"><div className="flex items-center justify-between gap-3"><h1 className="text-3xl font-bold">{session ? t(destinations[session.roleName] ?? "tgePortal") : t("portalLoading")}</h1><div className="flex items-center gap-3"><LanguageSwitcher />{session&&<button onClick={signOut} className="rounded bg-[#0D6339] px-4 py-2 text-white">{t("signOut")}</button>}</div></div>{session&&<p className="mt-2 text-gray-600">{t("sessionActive")}</p>}</main>;
}
