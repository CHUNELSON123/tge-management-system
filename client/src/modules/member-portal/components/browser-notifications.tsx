"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import { useLanguage } from "@/modules/i18n/language-provider";
import { getMemberNotifications } from "../services/member-notifications.service";
import type { MemberNotification } from "../types/member-notifications.types";

function destination(role: string, conversationId: string | null) {
  const prefix = role === "Mentor" ? "/mentor" : role === "Member" ? "/portal" : "/admin";
  return conversationId ? `${prefix}/messages?conversation=${encodeURIComponent(conversationId)}` : prefix === "/admin" ? "/admin" : `${prefix}/notifications`;
}
export function isAppActive(userId: string) {
  if (document.visibilityState === "visible" && document.hasFocus()) return true;
  const prefix = `tge:active-tab:${userId}:`;
  const now = Date.now();
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix) && now - Number(localStorage.getItem(key)) < 5000) return true;
  }
  return false;
}
export async function showSystemNotification(title: string, body: string, tag: string, path: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const options: NotificationOptions = { body, icon: "/tge-logo.png", tag, data: { path } };
  try {
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/notification-worker.js");
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    }
    const notification = new Notification(title, options);
    notification.onclick = () => { window.focus(); window.location.assign(path); notification.close(); };
  } catch { /* Browser or device notification settings may prevent display. */ }
}

export function BrowserNotifications({ incoming, caller, conversationId }: { incoming: { callId: string; media: "audio" | "video" } | null; caller: string; conversationId: string | null }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const tokenRef = useRef("");
  const seenRef = useRef<Set<string> | null>(null);
  const activeCallRef = useRef<string | null>(null);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const open = (event: MessageEvent) => {
      const path: unknown = event.data?.path;
      if (event.data?.type === "tge:open-notification" && typeof path === "string" && path.startsWith("/") && !path.startsWith("//")) router.push(path);
    };
    navigator.serviceWorker.addEventListener("message", open);
    return () => navigator.serviceWorker.removeEventListener("message", open);
  }, [router]);
  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken") ?? "";
      const supported = "Notification" in window && window.isSecureContext;
      setAvailable(Boolean(token) && supported);
      if (supported) setPermission(Notification.permission);
      if (token !== tokenRef.current) {
        tokenRef.current = token; seenRef.current = null; setRole(""); setUserId("");
        if (token) void authService.getSession(token).then(({ data }) => { if (tokenRef.current === token) { setRole(data.roleName); setUserId(data.userId); } }).catch(() => {});
      }
    };
    check(); const timer = window.setInterval(check, 3000);
    window.addEventListener("focus", check);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", check); };
  }, []);
  useEffect(() => {
    if (!userId) return;
    const key = `tge:active-tab:${userId}:${crypto.randomUUID()}`;
    const update = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) localStorage.setItem(key, String(Date.now()));
      else localStorage.removeItem(key);
    };
    update(); const timer = window.setInterval(update, 2000);
    window.addEventListener("focus", update); window.addEventListener("blur", update); document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); window.removeEventListener("blur", update); document.removeEventListener("visibilitychange", update); localStorage.removeItem(key); };
  }, [userId]);
  useEffect(() => {
    if (!available || permission !== "granted" || !role) return;
    let running = false; let disposed = false;
    const check = async () => {
      const token = tokenRef.current;
      if (!token || running) return;
      running = true;
      try {
        const items = await getMemberNotifications(token);
        if (disposed || token !== tokenRef.current) return;
        const seen = seenRef.current;
        if (seen) {
          for (const item of [...items].reverse()) {
            if (!seen.has(item.id) && !item.readAt && !isAppActive(userId)) {
              void showSystemNotification(item.title, item.body, `tge-notice-${item.id}`, destination(role, item.conversationId));
            }
          }
        }
        seenRef.current = new Set(items.map((item: MemberNotification) => item.id));
        if (seen && items.some((item) => !seen.has(item.id))) {
          window.dispatchEvent(new Event("tge:messages-updated"));
          window.dispatchEvent(new Event("tge:notifications-arrived"));
        }
      } catch { /* Retry after a connection failure without replaying existing notifications. */ }
      finally { running = false; }
    };
    void check(); const timer = window.setInterval(() => void check(), 4000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [available, permission, role, userId]);
  useEffect(() => {
    if (!incoming) {
      const callId = activeCallRef.current;
      activeCallRef.current = null;
      if (callId && "serviceWorker" in navigator) void navigator.serviceWorker.getRegistration("/").then(async (registration) => {
        const notifications = await registration?.getNotifications({ tag: `tge-call-${callId}` });
        notifications?.forEach((notification) => notification.close());
      }).catch(() => {});
      return;
    }
    const notify = () => {
      if (!role || activeCallRef.current === incoming.callId || permission !== "granted" || isAppActive(userId)) return;
      activeCallRef.current = incoming.callId;
      void showSystemNotification(incoming.media === "video" ? "Incoming video call" : "Incoming audio call", caller || "TGE", `tge-call-${incoming.callId}`, destination(role, conversationId));
    };
    notify();
    window.addEventListener("blur", notify);
    document.addEventListener("visibilitychange", notify);
    return () => { window.removeEventListener("blur", notify); document.removeEventListener("visibilitychange", notify); };
  }, [incoming, caller, conversationId, permission, role, userId]);
  if (!available || permission !== "default") return null;
  return <button type="button" onClick={() => { void Notification.requestPermission().then(setPermission); }} className="fixed bottom-4 left-4 z-[65] rounded-lg bg-[#006B3B] px-4 py-3 text-sm font-semibold text-white shadow-lg">{locale === "fr" ? "Activer les notifications de messages et d’appels" : "Enable message and call notifications"}</button>;
}
