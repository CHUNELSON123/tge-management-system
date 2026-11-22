"use client";
import { useEffect, useState } from "react";
import { getMemberNotifications } from "../services/member-notifications.service";
export function useUnreadNotifications() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
      if (!token) { if (active) setCount(0); return; }
      try { const items = await getMemberNotifications(token); if (active) setCount(items.filter((item) => !item.readAt).length); } catch { /* Retry later. */ }
    };
    void refresh(); const timer = window.setInterval(() => void refresh(), 8000);
    window.addEventListener("focus", refresh); window.addEventListener("tge:notifications-updated", refresh); window.addEventListener("tge:notifications-arrived", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("tge:notifications-updated", refresh); window.removeEventListener("tge:notifications-arrived", refresh); };
  }, []);
  return count;
}
