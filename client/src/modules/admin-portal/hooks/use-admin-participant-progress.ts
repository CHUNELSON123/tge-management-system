"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAccessService } from "../services/admin-access.service";
import { AdminProgrammesRequestError, adminProgrammesService } from "../services/admin-programmes.service";
import type { AdminAccess } from "../types/admin-access.types";
import type { CohortPage, ParticipantProgressPage, ProgrammePage } from "../types/admin-programmes.types";

type ProgrammeRequestState = { version: number; page: ProgrammePage | null; failed: boolean };
type CohortRequestState = { key: string; page: CohortPage | null; failed: boolean };
type ProgressRequestState = { key: string; page: ParticipantProgressPage | null; failed: boolean };

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

function redirect(router: ReturnType<typeof useRouter>, status: number) {
  if (status === 401) {
    localStorage.removeItem("tge.accessToken");
    sessionStorage.removeItem("tge.accessToken");
    router.replace("/admin/login");
  } else if (status === 403) {
    router.replace("/portal");
  }
}

export function useAdminParticipantProgress() {
  const router = useRouter();
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [programmeRequest, setProgrammeRequest] = useState<ProgrammeRequestState | null>(null);
  const [cohortRequest, setCohortRequest] = useState<CohortRequestState | null>(null);
  const [progressRequest, setProgressRequest] = useState<ProgressRequestState | null>(null);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [page, setPage] = useState(1);
  const [sourceVersion, setSourceVersion] = useState(0);
  const [progressVersion, setProgressVersion] = useState(0);
  const query = useMemo(() => JSON.stringify({ ...filters, page, pageSize: 10 }), [filters, page]);

  useEffect(() => {
    const token = accessToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const controller = new AbortController();
    adminAccessService.getAccess(token, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setAccess(result); })
      .catch((cause: unknown) => {
        if (cause instanceof AdminProgrammesRequestError) redirect(router, cause.status);
      });
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const token = accessToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const controller = new AbortController();
    adminProgrammesService.list(token, { page: 1, pageSize: 50 }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setProgrammeRequest({ version: sourceVersion, page: result, failed: false });
        const params = new URLSearchParams(window.location.search);
        const requestedProgrammeId = params.get("programmeId");
        setSelectedProgrammeId((current) => {
          if (result.rows.some((programme) => programme.id === current)) return current;
          if (requestedProgrammeId && result.rows.some((programme) => programme.id === requestedProgrammeId)) return requestedProgrammeId;
          return result.rows[0]?.id ?? "";
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof AdminProgrammesRequestError && (cause.status === 401 || cause.status === 403)) {
          redirect(router, cause.status);
          return;
        }
        setProgrammeRequest({ version: sourceVersion, page: null, failed: true });
      });
    return () => controller.abort();
  }, [router, sourceVersion]);

  const cohortKey = `${sourceVersion}:${selectedProgrammeId}`;
  useEffect(() => {
    if (!selectedProgrammeId) return;
    const token = accessToken();
    if (!token) return;
    const controller = new AbortController();
    adminProgrammesService.cohorts(token, { programmeId: selectedProgrammeId, page: 1, pageSize: 50 }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setCohortRequest({ key: cohortKey, page: result, failed: false });
        const requestedCohortId = new URLSearchParams(window.location.search).get("cohortId");
        setSelectedCohortId((current) => {
          if (result.rows.some((cohort) => cohort.id === current)) return current;
          if (requestedCohortId && result.rows.some((cohort) => cohort.id === requestedCohortId)) return requestedCohortId;
          return result.rows[0]?.id ?? "";
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof AdminProgrammesRequestError && (cause.status === 401 || cause.status === 403)) {
          redirect(router, cause.status);
          return;
        }
        setCohortRequest({ key: cohortKey, page: null, failed: true });
      });
    return () => controller.abort();
  }, [cohortKey, router, selectedProgrammeId]);

  const progressKey = JSON.stringify([selectedCohortId, query, progressVersion]);
  useEffect(() => {
    if (!selectedCohortId) return;
    const token = accessToken();
    if (!token) return;
    const controller = new AbortController();
    adminProgrammesService.participantProgress(
      token,
      selectedCohortId,
      JSON.parse(query) as Record<string, string | number>,
      controller.signal,
    ).then((result) => {
      if (!controller.signal.aborted) setProgressRequest({ key: progressKey, page: result, failed: false });
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof AdminProgrammesRequestError && (cause.status === 401 || cause.status === 403)) {
        redirect(router, cause.status);
        return;
      }
      setProgressRequest({ key: progressKey, page: null, failed: true });
    });
    return () => controller.abort();
  }, [progressKey, query, router, selectedCohortId]);

  const programmes = programmeRequest?.version === sourceVersion ? programmeRequest.page : null;
  const cohorts = cohortRequest?.key === cohortKey ? cohortRequest.page : null;
  const data = progressRequest?.key === progressKey ? progressRequest.page : null;
  const programmesLoading = programmeRequest?.version !== sourceVersion;
  const cohortsLoading = Boolean(selectedProgrammeId) && cohortRequest?.key !== cohortKey;
  const progressLoading = Boolean(selectedCohortId) && progressRequest?.key !== progressKey;
  const failed = Boolean(
    (programmeRequest?.version === sourceVersion && programmeRequest.failed)
    || (selectedProgrammeId && cohortRequest?.key === cohortKey && cohortRequest.failed)
    || (selectedCohortId && progressRequest?.key === progressKey && progressRequest.failed),
  );

  return {
    access,
    programmes,
    cohorts,
    data,
    selectedProgrammeId,
    selectedCohortId,
    filters,
    page,
    loading: programmesLoading || cohortsLoading || progressLoading,
    failed,
    setSelectedProgrammeId: (id: string) => { setSelectedProgrammeId(id); setSelectedCohortId(""); setPage(1); },
    setSelectedCohortId: (id: string) => { setSelectedCohortId(id); setPage(1); },
    setFilters: (next: typeof filters) => { setFilters(next); setPage(1); },
    setPage,
    retry: () => setProgressVersion((current) => current + 1),
    retryAll: () => { setSourceVersion((current) => current + 1); setProgressVersion((current) => current + 1); },
    canViewMember: Boolean(access?.permissions.includes("members.manage")),
    canManageEnrollment: Boolean(access?.permissions.includes("programmes.manage")),
  };
}
