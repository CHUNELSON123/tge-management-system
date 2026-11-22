"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { ArrowLeft, Ban, CalendarDays, FileText, Link2, Mic, Paperclip, Phone, Search, Send, UserPlus, Video, X, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useCallSession } from "../components/call-session-provider";
import { useMemberMessages } from "../hooks/use-member-messages";
import { downloadChatDocument, getConversationPresence, uploadChatDocument } from "../services/member-messages.service";
import { NewConversationDialog } from "../components/new-conversation-dialog";

export function MemberMessagesPage() {
  const { locale, t } = useLanguage();
  const { conversations, selectedId, setSelectedId, detail, loading, detailLoading, detailFailed, failed, sendFailed, send, markVisibleRead, retry, retryDetail } = useMemberMessages(false);
  const searchParams = useSearchParams();
  const requestedConversation = searchParams.get("conversation");
  useEffect(() => {
    if (requestedConversation && /^[0-9a-f-]{36}$/i.test(requestedConversation)) setSelectedId(requestedConversation);
  }, [requestedConversation, setSelectedId]);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const latestMessageId = detail?.messages.at(-1)?.id;
  const [presence, setPresence] = useState<{ id: string; online: boolean } | null>(null);
  useEffect(() => {
    if (!selectedId || !detail?.peerUserId) return;
    let active = true;
    const refresh = () => { void getConversationPresence(selectedId).then((result) => { if (active) setPresence({ id: selectedId, online: result.online }); }).catch(() => { if (active) setPresence(null); }); };
    refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId, detail?.peerUserId]);
  useEffect(() => {
    const element = latestMessageRef.current;
    if (!element || !selectedId || !latestMessageId) return;
    let visible = false;
    const mark = () => { if (visible && document.visibilityState === "visible" && document.hasFocus()) void markVisibleRead(selectedId, latestMessageId); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; mark(); }, { threshold: 0.5 });
    observer.observe(element);
    window.addEventListener("focus", mark);
    document.addEventListener("visibilitychange", mark);
    return () => { observer.disconnect(); window.removeEventListener("focus", mark); document.removeEventListener("visibilitychange", mark); };
  }, [selectedId, latestMessageId, markVisibleRead]);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [fileBusy, setFileBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const [filter, setFilter] = useState("all");
  const call = useCallSession();
  const { selectConversation } = call;
  useEffect(() => {
    if (selectedId && detail?.peerUserId) selectConversation(selectedId, detail.peerUserId, detail.title || detail.participantNames.join(", "));
  }, [selectedId, detail, selectConversation]);
  const isFrench = locale === "fr";
  const text = isFrench ? {
    title: "Messages", intro: "Échangez avec votre réseau.", conversations: "Conversations", search: "Rechercher des messages…", all: "Tout", unread: "Non lus", mentors: "Mentors", partners: "Partenaires", newMessage: "Nouveau message", newMessageUnavailable: "La création de conversation n’est pas disponible.", back: "Retour aux conversations", select: "Sélectionnez une conversation pour afficher les messages.", noConversations: "Aucune conversation n’est associée à votre compte.", emptySearch: "Aucune conversation ne correspond à votre recherche.", error: "Impossible de charger les conversations.", detailError: "Impossible de charger cette conversation.", retry: "Réessayer", contact: "Coordonnées", actions: "Actions rapides", meeting: "Planifier une réunion", shareResource: "Partager une ressource", pastSessions: "Voir les sessions passées", addContact: "Ajouter aux contacts", blockUser: "Bloquer l’utilisateur", actionUnavailable: "Cette action n’est pas disponible pour le moment.", files: "Fichiers partagés", filesUnavailable: "Le partage de fichiers n’est pas disponible sans accès sécurisé approuvé.", viewProfile: "Profil non disponible", schedule: "Appel audio", video: "Appel vidéo", compose: "Écrire un message…", send: "Envoyer", sendError: "Le message n’a pas été envoyé. Votre brouillon est conservé.", callCalling: "Appel en cours de connexion…", callConnected: "Appel connecté", incoming: "Appel entrant", accept: "Répondre", decline: "Refuser", end: "Terminer l’appel", callError: "L’appel n’a pas pu être établi.", noDirectCall: "Les appels audio et vidéo sont disponibles dans les conversations directes.", attachments: "Pièces jointes indisponibles", noMessages: "Aucun message dans cette conversation.", unknown: "Conversation",
  } : {
    title: "Messages", intro: "Connect, collaborate, and grow your network.", conversations: "Conversations", search: "Search messages…", all: "All", unread: "Unread", mentors: "Mentors", partners: "Partners", newMessage: "New Message", newMessageUnavailable: "Starting a new conversation is not available.", back: "Back to conversations", select: "Select a conversation to view the messages.", noConversations: "No conversations are linked to your account.", emptySearch: "No conversations match your search.", error: "We could not load your conversations.", detailError: "We could not load this conversation.", retry: "Retry", contact: "Contact Details", actions: "Quick Actions", meeting: "Schedule a Meeting", shareResource: "Share a Resource", pastSessions: "View Past Sessions", addContact: "Add to Contacts", blockUser: "Block User", actionUnavailable: "This action is unavailable right now.", files: "Shared Files", filesUnavailable: "File sharing is unavailable without approved secure access.", viewProfile: "Profile details unavailable", schedule: "Audio call", video: "Video call", compose: "Type a message…", send: "Send", sendError: "Message was not sent. Your draft has been kept.", callCalling: "Connecting call…", callConnected: "Call connected", incoming: "Incoming call", accept: "Accept", decline: "Decline", end: "End call", callError: "The call could not be established.", noDirectCall: "Audio and video calls are available in direct conversations.", attachments: "Attachments unavailable", noMessages: "There are no messages in this conversation.", unknown: "Conversation",
  };
  const unreadCount = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    if (filter === "unread" && !conversation.unreadCount) return false;
    if (filter === "mentors" && !conversation.participantRoles.includes("Mentor")) return false;
    if (filter === "partners" && !conversation.participantRoles.includes("Member")) return false;
    const query = search.trim().toLowerCase();
    return !query || `${conversation.title ?? ""} ${conversation.participantNames.join(" ")} ${conversation.lastMessage?.body ?? ""}`.toLowerCase().includes(query);
  }), [conversations, filter, search]);
  const conversationTitle = detail?.title || detail?.participantNames.join(", ") || text.unknown;
  const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const formatDate = (value: string) => new Intl.DateTimeFormat(isFrench ? "fr-CA" : "en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
  const formatMessageTime = (value: string) => new Intl.DateTimeFormat(isFrench ? "fr-CA" : "en-CA", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
  const formatMessageDay = (value: string) => new Intl.DateTimeFormat(isFrench ? "fr-CA" : "en-CA", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
  const sendDraft = async () => { const sent = await send(draft); if (sent) setDraft(""); };
  const submit = (event: FormEvent) => { event.preventDefault(); void sendDraft(); };
  const isDirect = !!detail?.peerUserId;
  const upload = async (file: File) => {
    if (!selectedId) return;
    if (file.size > 10 * 1024 * 1024 || !/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i.test(file.name)) { setFileError(isFrench ? "Choisissez un document PDF, Office, TXT ou CSV de 10 Mo maximum." : "Choose a PDF, Office, TXT or CSV document up to 10 MB."); return; }
    setFileBusy(true); setFileError("");
    try { await uploadChatDocument(selectedId, file); retryDetail(); retry(); }
    catch (error) { setFileError(error instanceof Error ? error.message : "Document upload failed."); }
    finally { setFileBusy(false); }
  };

  return <section aria-labelledby="member-messages-title" className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 id="member-messages-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-1 text-sm text-[#59645D]">{text.intro}</p></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#D9E2DC] bg-white px-3 sm:w-[min(32vw,320px)] sm:flex-none"><Search size={17} aria-hidden="true" className="shrink-0 text-[#68736C]"/><span className="sr-only">{text.search}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} className="min-h-10 w-full bg-transparent text-xs outline-none"/></label><button type="button" onClick={() => setNewOpen(true)} className="hidden min-h-10 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white sm:inline-flex sm:items-center sm:justify-center">＋ {text.newMessage}</button></div></header>
    {failed ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{text.error}<button onClick={retry} className="ml-3 font-semibold underline">{text.retry}</button></div> : loading ? <p role="status" className="rounded-xl border p-6 text-sm text-[#53645A]">{t("loading")}</p> : <div className="grid min-h-[680px] items-stretch gap-3 xl:grid-cols-[260px_minmax(0,1fr)_220px]">
      <aside className={`${selectedId ? "hidden" : "block"} rounded-xl border border-[#E6ECE8] bg-white p-3 xl:block`}><h2 className="px-1 font-bold text-[#17211B]">{text.conversations}</h2><div role="tablist" aria-label={text.conversations} className="mt-3 grid grid-cols-4 gap-1"><FilterButton current={filter} value="all" label={text.all} count={conversations.length} onClick={setFilter}/><FilterButton current={filter} value="unread" label={text.unread} count={unreadCount} onClick={setFilter}/><FilterButton current={filter} value="mentors" label={text.mentors} onClick={setFilter}/><FilterButton current={filter} value="partners" label={text.partners} onClick={setFilter}/></div>
        {filteredConversations.length ? <ul className="mt-2 divide-y divide-[#E9EEEB]">{filteredConversations.map((conversation) => { const name = conversation.title || conversation.participantNames.join(", ") || text.unknown; const active = selectedId === conversation.id; return <li key={conversation.id}><button onClick={() => setSelectedId(conversation.id)} aria-current={active ? "true" : undefined} className={`flex w-full gap-3 rounded-lg p-3 text-left ${active ? "bg-[#F0F8F2]" : "hover:bg-[#F7F9F8]"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EDF7F0] text-sm font-bold text-[#087443]">{initials(name)}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold">{name}</span><time className="shrink-0 text-[10px] text-[#68736C]">{conversation.lastMessage ? formatDate(conversation.lastMessage.sentAt) : ""}</time></span><span className="mt-1 block truncate text-xs text-[#59645D]">{conversation.lastMessage?.body ?? conversation.conversationType}</span></span>{conversation.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center self-center rounded-full bg-[#087443] px-1 text-[10px] font-bold text-white">{conversation.unreadCount}</span>}</button></li>; })}</ul> : <p className="mt-4 p-3 text-sm text-[#68736C]">{conversations.length ? text.emptySearch : text.noConversations}</p>}
      </aside>

      <section className={`${selectedId ? "flex" : "hidden"} min-h-[640px] flex-col overflow-hidden rounded-xl border border-[#E6ECE8] bg-white xl:flex`} aria-label={conversationTitle}>
        {detail ? <><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9EEEB] p-4"><div className="flex items-center gap-3"><button type="button" onClick={() => setSelectedId(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#F4F8F5] xl:hidden" aria-label={text.back}><ArrowLeft size={18}/></button><span className="grid h-11 w-11 place-items-center rounded-full bg-[#EDF7F0] font-bold text-[#087443]">{initials(conversationTitle)}</span><div><h2 className="font-bold">{conversationTitle}</h2><p className="text-xs text-[#68736C]">{detail.peerUserId && presence?.id === selectedId ? (presence.online ? (isFrench ? "En ligne" : "Online") : (isFrench ? "Hors ligne" : "Offline")) : detail.conversationType}</p></div></div><div className="flex gap-2"><button onClick={() => void call.start("audio")} disabled={!isDirect || !!call.activeCall || !!call.incoming} title={!isDirect ? text.noDirectCall : text.schedule} className="grid h-10 w-10 place-items-center rounded-lg border border-[#D9E2DC] text-[#087443] disabled:cursor-not-allowed disabled:opacity-40" aria-label={text.schedule}><Phone size={17}/></button><button onClick={() => void call.start("video")} disabled={!isDirect || !!call.activeCall || !!call.incoming} title={!isDirect ? text.noDirectCall : text.video} className="grid h-10 w-10 place-items-center rounded-lg border border-[#D9E2DC] text-[#087443] disabled:cursor-not-allowed disabled:opacity-40" aria-label={text.video}><Video size={18}/></button></div></header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#FCFDFC] p-4">{detailLoading ? <p role="status" className="text-sm text-[#68736C]">{t("loading")}</p> : detail.messages.length ? detail.messages.map((message, index) => {
            const day = formatMessageDay(message.sentAt);
            const previousDay = index > 0 ? formatMessageDay(detail.messages[index - 1].sentAt) : null;
            return <div key={message.id} ref={index === detail.messages.length - 1 ? latestMessageRef : undefined} className="space-y-2">{day !== previousDay && <p className="mx-auto w-fit rounded-full bg-[#F0F2F1] px-3 py-1 text-[11px] text-[#59645D]">{day}</p>}<div className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}><article className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${message.isOwn ? "bg-[#DDF1E3] text-[#17211B]" : "bg-[#F0F2F1] text-[#17211B]"}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>{message.attachments?.map((attachment) => <button type="button" key={attachment.id} onClick={() => void downloadChatDocument(attachment.id, attachment.filename).catch(() => setFileError(isFrench ? "Impossible de télécharger le document." : "Document could not be downloaded."))} className="mt-2 flex items-center gap-2 rounded border border-green-700 px-3 py-2 text-left text-xs font-semibold text-green-800"><FileText size={16}/>{isFrench ? "Télécharger" : "Download"} · {Math.ceil(attachment.size / 1024)} KB</button>)}<time className="mt-1 block text-right text-[10px] text-[#68736C]">{formatMessageTime(message.sentAt)}</time></article></div></div>;
          }) : <p className="py-10 text-center text-sm text-[#68736C]">{text.noMessages}</p>}</div>
          {fileError && <p role="alert" className="px-4 pb-2 text-sm text-red-700">{fileError}</p>}
          {sendFailed && <p role="alert" className="px-4 pb-2 text-sm text-red-700">{text.sendError}</p>}
          <form onSubmit={submit} className="flex items-end gap-2 border-t border-[#E9EEEB] p-3"><label title={isFrench ? "Joindre un document" : "Attach a document"} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg text-[#087443]"><Paperclip size={17}/><input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" disabled={fileBusy} aria-label={isFrench ? "Joindre un document" : "Attach a document"} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }}/></label><label className="sr-only" htmlFor="member-message-draft">{text.compose}</label><textarea id="member-message-draft" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendDraft(); } }} maxLength={5000} rows={1} placeholder={text.compose} className="max-h-32 min-h-10 flex-1 resize-y rounded-lg border border-[#D9E2DC] px-3 py-2 text-sm outline-none focus:border-[#087443]"/><button type="submit" disabled={!draft.trim() || detailLoading} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#006B3B] text-white disabled:opacity-50" aria-label={text.send}><Send size={17}/></button></form>
        </> : <div className="grid flex-1 place-items-center p-6 text-center text-sm text-[#68736C]">{detailLoading ? t("loading") : detailFailed ? <div role="alert">{text.detailError}<button onClick={retryDetail} className="ml-2 font-semibold text-[#087443] underline">{text.retry}</button></div> : text.select}</div>}
      </section>

      <aside className={`${selectedId && detail ? "block" : "hidden"} space-y-3 xl:block`}><section className="rounded-xl border border-[#E6ECE8] p-4"><h2 className="font-bold">{text.contact}</h2>{detail?.participantNames.length ? <ul className="mt-3 space-y-3">{detail.participantNames.map((name) => <li key={name} className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#EDF7F0] text-xs font-bold text-[#087443]">{initials(name)}</span><span className="text-sm font-semibold">{name}</span></li>)}</ul> : <p className="mt-3 text-sm text-[#68736C]">{text.viewProfile}</p>}</section><section className="rounded-xl border border-[#E6ECE8] p-4"><h2 className="flex items-center gap-2 font-bold"><CalendarDays size={17}/>{text.actions}</h2><div className="mt-3 grid gap-2">
        <button disabled={!isDirect || !!call.activeCall || !!call.incoming} title={!isDirect ? text.noDirectCall : undefined} onClick={() => void call.start("audio")} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left text-sm text-[#39443D] hover:bg-[#F4F8F5] disabled:cursor-not-allowed disabled:opacity-50"><Mic size={16}/>{text.schedule}</button>
        <button disabled={!isDirect || !!call.activeCall || !!call.incoming} title={!isDirect ? text.noDirectCall : undefined} onClick={() => void call.start("video")} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left text-sm text-[#39443D] hover:bg-[#F4F8F5] disabled:cursor-not-allowed disabled:opacity-50"><Video size={16}/>{text.video}</button>
        <QuickAction icon={CalendarDays} label={text.meeting} unavailable={text.actionUnavailable}/>
        <QuickAction icon={Link2} label={text.shareResource} unavailable={text.actionUnavailable}/>
        <QuickAction icon={FileText} label={text.pastSessions} unavailable={text.actionUnavailable}/>
        <QuickAction icon={UserPlus} label={text.addContact} unavailable={text.actionUnavailable}/>
        <QuickAction icon={Ban} label={text.blockUser} unavailable={text.actionUnavailable} destructive/>
      </div>{!isDirect && <p className="mt-2 text-xs text-[#68736C]">{text.noDirectCall}</p>}</section><section className="rounded-xl border border-[#E6ECE8] p-4"><h2 className="flex items-center gap-2 font-bold"><FileText size={17}/>{text.files}</h2>{detail?.messages.flatMap((message) => message.attachments ?? []).length ? <div className="mt-3 space-y-2">{detail.messages.flatMap((message) => message.attachments ?? []).map((attachment) => <button type="button" key={attachment.id} onClick={() => void downloadChatDocument(attachment.id, attachment.filename).catch(() => setFileError(isFrench ? "Impossible de télécharger le document." : "Document could not be downloaded."))} className="block w-full break-all text-left text-xs text-green-800 underline">{attachment.filename}</button>)}</div> : <p className="mt-3 text-xs leading-5 text-[#68736C]">{isFrench ? "Aucun document partagé." : "No documents shared yet."}</p>}</section></aside>
    </div>}
    {call.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{text.callError} {call.error}<button onClick={call.clearError} className="ml-2 underline"><X size={14} className="inline"/></button></p>}
    {!failed && !loading && <button type="button" onClick={() => setNewOpen(true)} aria-label={text.newMessage} className="fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#006B3B] text-white shadow-lg sm:hidden"><span aria-hidden="true" className="text-2xl">＋</span></button>}
    {newOpen && <NewConversationDialog close={() => setNewOpen(false)} onStarted={(id) => { setNewOpen(false); retry(); setSelectedId(id); }}/>}

  </section>;
}

function FilterButton({ current, value, label, count, onClick }: { current: string; value: string; label: string; count?: number; onClick: (value: string) => void }) {
  return <button role="tab" aria-selected={current === value} onClick={() => onClick(value)} className={`min-h-9 rounded-md px-2 text-xs font-semibold ${current === value ? "bg-[#EAF5EE] text-[#006B3B]" : "text-[#59645D] hover:bg-[#F5F8F6]"}`}>{label}{count !== undefined && <span className="ml-1">{count}</span>}</button>;
}

function QuickAction({ icon: Icon, label, unavailable, destructive = false }: { icon: LucideIcon; label: string; unavailable: string; destructive?: boolean }) {
  return <button type="button" disabled title={unavailable} className={`flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg px-2 text-left text-sm opacity-55 ${destructive ? "text-red-600" : "text-[#39443D]"}`}><Icon size={16}/>{label}</button>;
}

