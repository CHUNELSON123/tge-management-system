"use client";

import { useCallback, useEffect, useState } from "react";
import { adminHeaderService } from "../services/admin-header.service";
import type { AdminHeaderNotification } from "../types/admin-header.types";

export function useAdminHeader(enabled: boolean) {
  const [notifications, setNotifications] = useState<AdminHeaderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) return;
    const controller = new AbortController();
    let createdPhotoUrl: string | null = null;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset UI state when the active request or session changes.
    setLoading(true);
    setFailed(false);
    Promise.all([
      adminHeaderService.getHeader(token, controller.signal),
      adminHeaderService.getPhoto(token, controller.signal),
    ]).then(([header, photo]) => {
      if (controller.signal.aborted) return;
      setNotifications(header.notifications);
      setUnreadCount(header.unreadCount);
      if (photo) {
        createdPhotoUrl = URL.createObjectURL(photo);
        setPhotoUrl(createdPhotoUrl);
      } else setPhotoUrl(null);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const refresh = () => { void adminHeaderService.getHeader(token, controller.signal).then((header) => { if (!controller.signal.aborted) { setNotifications(header.notifications); setUnreadCount(header.unreadCount); } }).catch(() => {}); };
    const timer = window.setInterval(refresh, 8000);
    window.addEventListener("tge:notifications-updated", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("tge:notifications-updated", refresh);
      if (createdPhotoUrl) URL.revokeObjectURL(createdPhotoUrl);
    };
  }, [enabled]);

  const markRead = useCallback(async (id: string) => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) return false;
    try {
      await adminHeaderService.markRead(token, id);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - (notifications.find((item) => item.id === id)?.readAt ? 0 : 1)));
      window.dispatchEvent(new Event("tge:notifications-updated"));
      return true;
    } catch { return false; }
  }, [notifications]);

  return { notifications, unreadCount, photoUrl, loading, failed, markRead };
}
