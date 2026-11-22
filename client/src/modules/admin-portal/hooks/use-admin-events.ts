"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminEventsService } from "../services/admin-events.service";
import type { AdminEventDetail, AdminEventPage, AdminEventRegistrationsPage } from "../types/admin-events.types";

function token() { return localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || ""; }
function useRequest<T>(request: (signal: AbortSignal) => Promise<T>, fallback: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setLoading(true);
    try {
      const result = await request(controller.signal);
      if (!controller.signal.aborted) { setData(result); setError(""); }
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : fallback);
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, [request, fallback]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void reload());
    return () => { cancelAnimationFrame(frame); active.current?.abort(); };
  }, [reload]);
  return { data, loading, error, reload };
}
export function useAdminEvents() {
  const [period, setPeriod] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const request = useCallback((signal: AbortSignal) => adminEventsService.list(token(), { period, search, page, pageSize: 10 }, signal), [period, search, page]);
  const state = useRequest<AdminEventPage>(request, "Events could not be loaded.");
  return { ...state, period, setPeriod, search, setSearch, page, setPage };
}
export function useAdminEvent(id: string) {
  const request = useCallback((signal: AbortSignal) => adminEventsService.get(token(), id, signal), [id]);
  return useRequest<AdminEventDetail>(request, "Event could not be loaded.");
}
export function useAdminEventRegistrations(id: string, attendanceOnly: boolean) {
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const request = useCallback((signal: AbortSignal) => adminEventsService.registrations(token(), id, { search, status: attendanceOnly ? "registered" : status, page, pageSize: 10 }, signal), [id, search, status, page, attendanceOnly]);
  const state = useRequest<AdminEventRegistrationsPage>(request, "Registrations could not be loaded.");
  return { ...state, search, setSearch, status, setStatus, page, setPage };
}
