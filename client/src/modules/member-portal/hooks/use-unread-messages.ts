"use client";
import { useEffect, useState } from "react";
import { listMemberConversations } from "../services/member-messages.service";
export function useUnreadMessages() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    async function refresh() { try { const conversations = await listMemberConversations(); if (active) setCount(conversations.reduce((total, item) => total + item.unreadCount, 0)); } catch { /* Keep the last known count while offline. */ } }
    void refresh(); const interval = window.setInterval(refresh, 8000);
    window.addEventListener("focus", refresh); window.addEventListener("tge:messages-updated", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); window.removeEventListener("tge:messages-updated", refresh); };
  }, []);
  return count;
}
