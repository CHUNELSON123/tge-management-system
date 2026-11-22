"use client";
import { useEffect, useState } from "react";
import { mentorPortalService } from "../services/mentor-portal.service";
import type { Profile, Work } from "../types/mentor-portal.types";
export function useMentorPortal(enabled: boolean) {
  const [work, setWork] = useState<Work | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    Promise.all([mentorPortalService.getWork(), mentorPortalService.getProfile()]).then(([w, p]) => { if (active) { setWork(w); setProfile(p); setError(""); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Unable to load portal."); });
    return () => { active = false; };
  }, [enabled, version]);
  return { work, profile, setProfile, error, setError, refresh: () => setVersion((current) => current + 1) };
}
