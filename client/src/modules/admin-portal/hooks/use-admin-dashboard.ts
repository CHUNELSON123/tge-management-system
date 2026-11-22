"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminDashboardService } from "../services/admin-dashboard.service";
import { adminAccessService } from "../services/admin-access.service";
import type { AdminDashboard } from "../types/admin-dashboard.types";

const DAY_MS = 86_400_000;

export function useAdminDashboard(initialRange: { from: string; to: string }) {
  const router = useRouter();
  const [range, setRange] = useState(initialRange);
  const [draftFrom, setDraftFrom] = useState(initialRange.from);
  const [draftTo, setDraftTo] = useState(initialRange.to);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [settledRequestId, setSettledRequestId] = useState("");
  const [errorRequestId, setErrorRequestId] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [rangeError, setRangeError] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const rangeKey = `${range.from}:${range.to}`;
  const requestId = `${rangeKey}:${requestVersion}`;
  const loading = settledRequestId !== requestId;
  const error = errorRequestId === requestId;

  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) return;
    const controller = new AbortController();
    adminAccessService.getAccess(token, controller.signal).then((access) => { if (!controller.signal.aborted) setPermissions(access.permissions); }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/admin/login"); return; }
    let cancelled = false;
    const controller = new AbortController();
    adminDashboardService.getDashboard(token, range, controller.signal).then((data) => {
      if (!cancelled) {
        setDashboard(data);
        setErrorRequestId("");
      }
    }).catch((requestError: unknown) => {
      if (cancelled) return;
      const status = typeof requestError === "object" && requestError !== null && "status" in requestError ? requestError.status : undefined;
      if (status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/admin/login");
      } else if (status === 403) {
        router.replace("/portal");
      } else {
        setErrorRequestId(requestId);
      }
    }).finally(() => { if (!cancelled) setSettledRequestId(requestId); });
    return () => { cancelled = true; controller.abort(); };
  }, [range, requestId, router]);

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fromTime = Date.parse(`${draftFrom}T00:00:00.000Z`);
    const toTime = Date.parse(`${draftTo}T00:00:00.000Z`);
    if (!draftFrom || !draftTo || Number.isNaN(fromTime) || Number.isNaN(toTime) || toTime < fromTime || toTime - fromTime > 365 * DAY_MS) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setRange({ from: draftFrom, to: draftTo });
  }

  function retry() {
    setRequestVersion((version) => version + 1);
  }

  return { range, draftFrom, setDraftFrom, draftTo, setDraftTo, dashboard, loading, error, rangeError, applyRange, retry, permissions };
}
