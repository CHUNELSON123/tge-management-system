"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMemberNotifications, markAllMemberNotificationsRead, markMemberNotificationRead } from "../services/member-notifications.service";
import type { MemberNotification } from "../types/member-notifications.types";
export function useMemberNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return () => controller.abort(); }
    getMemberNotifications(token, controller.signal).then(setNotifications).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (typeof error === "object" && error !== null && "status" in error && error.status === 401) { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login"); return; }
      setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [router, version]);
  const token = () => localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken") ?? "";
  const handleActionError = useCallback((error: unknown) => {
    if (typeof error === "object" && error !== null && "status" in error && error.status === 401) {
      localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); router.replace("/login");
      return;
    }
    setActionFailed(true);
  }, [router]);
  const markRead = useCallback(async (id: string) => {
    setActionFailed(false);
    try { await markMemberNotificationRead(id, token()); setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); }
    catch (error) { handleActionError(error); }
  }, [handleActionError]);
  const markAllRead = useCallback(async () => {
    setActionFailed(false);
    try { await markAllMemberNotificationsRead(token()); setNotifications((items) => items.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() })); }
    catch (error) { handleActionError(error); }
  }, [handleActionError]);
  return { notifications, loading, failed, actionFailed, markRead, markAllRead, retry: () => { setLoading(true); setFailed(false); setVersion((value) => value + 1); } };
}
