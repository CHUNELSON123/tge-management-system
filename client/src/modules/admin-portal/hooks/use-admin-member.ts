"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMembersService, AdminMembersRequestError } from "../services/admin-members.service";
import type { AdminMemberDetail, AdminMemberEnrollment, AdminMemberProfileUpdate } from "../types/admin-members.types";

function getToken() { return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); }
function handleAuthError(router: ReturnType<typeof useRouter>, status: number) {
  if (status === 401) { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/admin/login"); }
  else if (status === 403) router.replace("/portal");
}

export function useAdminMember(memberId: string) {
  const router = useRouter();
  const [member, setMember] = useState<AdminMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    adminMembersService.get(token, memberId, controller.signal).then((result) => {
      if (!controller.signal.aborted) setMember(result);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401 || status === 403) handleAuthError(router, status);
      else setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [memberId, router, version]);

  async function save(input: AdminMemberProfileUpdate) {
    const token = getToken();
    if (!token) { router.replace("/admin/login"); return false; }
    setSaving(true); setSaveError(null);
    try { setMember(await adminMembersService.update(token, memberId, input)); return true; }
    catch (error) {
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401 || status === 403) handleAuthError(router, status);
      else setSaveError(error instanceof Error ? error.message : "Member details could not be saved.");
      return false;
    } finally { setSaving(false); }
  }

  return { member, loading, failed, saving, saveError, save, retry: () => setVersion((current) => current + 1) };
}

export function useAdminMemberProgrammes(memberId: string) {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<AdminMemberEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    adminMembersService.programmes(token, memberId, controller.signal).then((result) => { if (!controller.signal.aborted) setProgrammes(result); }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401 || status === 403) handleAuthError(router, status);
      else setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [memberId, router, version]);
  return { programmes, loading, failed, retry: () => setVersion((current) => current + 1) };
}
