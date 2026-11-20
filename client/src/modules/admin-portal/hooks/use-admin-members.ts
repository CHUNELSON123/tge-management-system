"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAccessService } from "../services/admin-access.service";
import { adminMembersService, AdminMembersRequestError } from "../services/admin-members.service";
import type { AdminAccess } from "../types/admin-access.types";
import type { AdminMembersPage } from "../types/admin-members.types";

function accessToken() { return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); }
function redirectUnauthorized(router: ReturnType<typeof useRouter>, status: number) {
  if (status === 401) {
    localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/admin/login");
  } else if (status === 403) router.replace("/portal");
}

export function useAdminMembers() {
  const router = useRouter();
  const [data, setData] = useState<AdminMembersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "", programmeId: "", cohortId: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [version, setVersion] = useState(0);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const query = useMemo(() => JSON.stringify({ ...filters, page, pageSize }), [filters, page, pageSize]);

  useEffect(() => {
    const token = accessToken();
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController();
    adminAccessService.getAccess(token, controller.signal).then((result) => { if (!controller.signal.aborted) setAccess(result); }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = error instanceof AdminMembersRequestError ? error.status : typeof error === "object" && error && "status" in error ? Number(error.status) : 0;
      redirectUnauthorized(router, status);
    });
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const token = accessToken();
    if (!token) { router.replace("/admin/login"); return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    adminMembersService.list(token, JSON.parse(query) as Record<string, string | number>, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = error instanceof AdminMembersRequestError ? error.status : 0;
      if (status === 401 || status === 403) redirectUnauthorized(router, status);
      else setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, router, version]);

  function applyFilters(next: typeof filters) { setFilters(next); setPage(1); }
  function reset() { applyFilters({ search: "", status: "", programmeId: "", cohortId: "" }); }
  function retry() { setVersion((current) => current + 1); }
  return { data, loading, failed, filters, applyFilters, reset, page, setPage, pageSize, setPageSize, retry, canCreate: Boolean(access?.permissions.includes("members.manage") && access.permissions.includes("users.manage")), canReviewApplications: Boolean(access?.permissions.includes("users.manage")) };
}
