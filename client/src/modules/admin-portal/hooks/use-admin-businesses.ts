"use client";
import { useCallback, useEffect, useState } from "react";
import { adminBusinessesService } from "../services/admin-businesses.service";
import type { AdminBusinessDetail, AdminBusinessPage } from "../types/admin-businesses.types";
function token() { return typeof window === "undefined" ? "" : localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || ""; }
export function useAdminBusinesses() {
  const [data, setData] = useState<AdminBusinessPage | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [categoryId, setCategoryId] = useState(""); const [page, setPage] = useState(1); const [version, setVersion] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => { try { const result = await adminBusinessesService.list(token(), { search, status, categoryId, page, pageSize: 10 }, signal); if (!signal.aborted) { setData(result); setError(""); } } catch (reason) { if (!signal.aborted) setError(reason instanceof Error ? reason.message : "Business listings could not be loaded."); } finally { if (!signal.aborted) setLoading(false); } }, [search, status, categoryId, page]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); }); return () => controller.abort(); }, [load, version]);
  return { data, loading, error, search, setSearch: (value: string) => { setLoading(true); setSearch(value); setPage(1); }, status, setStatus: (value: string) => { setLoading(true); setStatus(value); setPage(1); }, categoryId, setCategoryId: (value: string) => { setLoading(true); setCategoryId(value); setPage(1); }, page, setPage: (value: number) => { setLoading(true); setPage(value); }, reload: () => { setLoading(true); setVersion((value) => value + 1); } };
}
export function useAdminBusiness(id: string) {
  const [data, setData] = useState<AdminBusinessDetail | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [version, setVersion] = useState(0);
  useEffect(() => { const controller = new AbortController(); void adminBusinessesService.get(token(), id, controller.signal).then((value) => { if (!controller.signal.aborted) { setData(value); setError(""); } }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Business details could not be loaded."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [id, version]);
  return { data, loading, error, reload: () => { setLoading(true); setVersion((value) => value + 1); } };
}
