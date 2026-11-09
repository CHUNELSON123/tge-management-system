"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMemberConversation, listMemberConversations, sendMemberMessage } from "../services/member-messages.service";
import type { MemberConversationDetail, MemberConversationSummary } from "../types/member-messages.types";
function expired(error: unknown) { return typeof error === "object" && error !== null && "status" in error && error.status === 401; }
function clearToken() { localStorage.removeItem("tge.accessToken"); sessionStorage.removeItem("tge.accessToken"); }
export function useMemberMessages(autoSelect = true) {
  const router = useRouter();
  const [conversations, setConversations] = useState<MemberConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedConversationId, setFailedConversationId] = useState<string | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [failed, setFailed] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) { router.replace("/login"); return; }
    listMemberConversations().then((items) => { setConversations(items); if (autoSelect) setSelectedId((current) => current ?? items[0]?.id ?? null); }).catch((error: unknown) => {
      if (expired(error)) { clearToken(); router.replace("/login"); } else setFailed(true);
    }).finally(() => setLoading(false));
  }, [autoSelect, router, version]);
  useEffect(() => {
    const interval = window.setInterval(() => setVersion((value) => value + 1), 20_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getMemberConversation(selectedId).then((conversation) => {
      if (!active) return;
      setDetail(conversation);
      setFailedConversationId(null);
      setConversations((items) => items.map((item) => item.id === selectedId ? { ...item, unreadCount: 0 } : item));
    }).catch((error: unknown) => {
      if (!active) return;
      if (expired(error)) { clearToken(); router.replace("/login"); } else { setDetail(null); setFailedConversationId(selectedId); }
    });
    return () => { active = false; };
  }, [selectedId, router, detailVersion]);
  useEffect(() => {
    if (!selectedId) return;
    const interval = window.setInterval(() => setDetailVersion((value) => value + 1), 8_000);
    return () => window.clearInterval(interval);
  }, [selectedId]);
  const send = useCallback(async (body: string) => {
    if (!selectedId || !body.trim()) return false;
    setSendFailed(false);
    try {
      const message = await sendMemberMessage(selectedId, body.trim());
      setDetail((current) => current && current.conversationId === selectedId ? { ...current, messages: [...current.messages, message] } : current);
      setConversations((items) => items.map((item) => item.id === selectedId ? { ...item, lastMessage: { body: message.body, sentAt: message.sentAt, senderUserId: message.senderUserId } } : item));
      return true;
    } catch (error) {
      if (expired(error)) { clearToken(); router.replace("/login"); } else setSendFailed(true);
      return false;
    }
  }, [selectedId, router]);
  const selectedDetail = selectedId && detail?.conversationId === selectedId ? detail : null;
  const detailLoading = !!selectedId && !selectedDetail && failedConversationId !== selectedId;
  const detailFailed = !!selectedId && failedConversationId === selectedId;
  return { conversations, selectedId, setSelectedId, detail: selectedDetail, loading, detailLoading, detailFailed, failed, sendFailed, send,
    retry: () => { setFailed(false); setLoading(true); setVersion((value) => value + 1); },
    retryDetail: () => { setFailedConversationId(null); setDetailVersion((value) => value + 1); },
  };
}
