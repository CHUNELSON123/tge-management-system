"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useMemberRequest<T>(load: (token: string, signal?: AbortSignal) => Promise<T>) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const [previousRequest, setPreviousRequest] = useState({ load, router, version });
  if (previousRequest.load !== load || previousRequest.router !== router || previousRequest.version !== version) {
    setPreviousRequest({ load, router, version });
    setLoading(true);
    setFailed(false);
  }
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return () => controller.abort(); }
    load(token, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (typeof error === "object" && error !== null && "status" in error && error.status === 401) {
        localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login"); return;
      }
      setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load, router, version]);
  return { data, loading, failed, retry: () => setVersion((current) => current + 1) };
}
