"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMembersService, AdminMembersRequestError } from "../services/admin-members.service";
import type { AdminMembershipApplicationPage } from "../types/admin-members.types";

export function useAdminMemberApplications() {
  const router = useRouter();
  const [data, setData] = useState<AdminMembershipApplicationPage | null>(null);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(draftSearch.trim()); setPage(1); }, 350); return () => window.clearTimeout(timer); }, [draftSearch]);
  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController(); setLoading(true); setFailed(false);
    adminMembersService.applications(token, { search, page, pageSize: 10 }, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401) { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/admin/login"); }
      else if (status === 403) router.replace("/portal");
      else setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, router, search, version]);

  function applySearch() { setSearch(draftSearch.trim()); setPage(1); }
  async function decide(id: string, decision: "approve" | "reject", reason?: string) {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/admin/login"); return false; }
    setBusyId(id); setMessage(null);
    try {
      if (decision === "approve") {
        const result = await adminMembersService.approveApplication(token, id);
        setMessage(result.invitationSent ? "approved" : "approved-email-failed");
      } else {
        const result = await adminMembersService.rejectApplication(token, id, reason ?? "");
        setMessage(result.notificationSent ? "rejected" : "rejected-email-failed");
      }
      setVersion((current) => current + 1);
      return true;
    } catch (error) {
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401) { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/admin/login"); }
      else setMessage(status === 409 ? "already-reviewed" : "decision-failed");
      return false;
    } finally { setBusyId(null); }
  }

  return { data, draftSearch, setDraftSearch, applySearch, page, setPage, busyId, message, failed, loading, decide, retry: () => setVersion((value) => value + 1) };
}
