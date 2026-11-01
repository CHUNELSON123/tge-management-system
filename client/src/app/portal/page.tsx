"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import type { AuthenticatedSessionResponse } from "@/modules/auth/types/auth.types";

const destinations: Record<string, string> = {
  "System Administrator": "System Administration",
  "Organisation Administrator": "Administration",
  Member: "Member Portal",
  Mentor: "Mentor Portal",
  "Trainer / Facilitator": "Trainer Portal",
};

export default function PortalHome() {
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
  return <main className="mx-auto w-full max-w-5xl p-8"><div className="flex justify-between"><h1 className="text-3xl font-bold">{session ? destinations[session.roleName] ?? "TGE Portal" : "Loading portal…"}</h1>{session&&<button onClick={signOut} className="rounded bg-[#0D6339] px-4 py-2 text-white">Sign out</button>}</div>{session&&<p className="mt-2 text-gray-600">Your authenticated session is active.</p>}</main>;
}
