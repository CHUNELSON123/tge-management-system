"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Camera, CameraOff, Maximize2, Mic, MicOff, Minimize2, Phone, PhoneOff, SwitchCamera, Video, Volume2, VolumeX, X } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberCall } from "../hooks/use-member-call";
import { getIncomingCall, getMemberConversation, updatePresence } from "../services/member-messages.service";
import { BrowserNotifications } from "./browser-notifications";

type Selection = { id: string; peer: string; title: string };
type CallSession = ReturnType<typeof useMemberCall> & { selectConversation: (id: string, peer: string, title: string) => void };
const Context = createContext<CallSession | null>(null);

export function CallSessionProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const call = useMemberCall(selection?.id ?? null, selection?.peer ?? null);
  const selectConversation = useCallback((id: string, peer: string, title: string) => {
    if (call.activeCall || call.incoming) return;
    setSelection((current) => current?.id === id && current.peer === peer && current.title === title ? current : { id, peer, title });
  }, [call.activeCall, call.incoming]);
  const value = useMemo(() => ({ ...call, selectConversation }), [call, selectConversation]);
  const fr = locale === "fr";

  useEffect(() => {
    if (call.activeCall?.phase !== "connected") return;
    const start = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [call.activeCall?.callId, call.activeCall?.phase]);

  useEffect(() => { if (!call.activeCall) { setMinimized(false); setElapsed(0); } }, [call.activeCall]);

  useEffect(() => {
    if (call.activeCall || call.incoming) return;
    let active = true;
    const check = async () => {
      if (!localStorage.getItem("tge.accessToken") && !sessionStorage.getItem("tge.accessToken")) return;
      try {
        const { call: pending } = await getIncomingCall();
        if (!pending || !active || pending.conversationId === selection?.id) return;
        const detail = await getMemberConversation(pending.conversationId);
        if (active && detail.peerUserId === pending.fromUserId) setSelection({ id: pending.conversationId, peer: pending.fromUserId, title: detail.title || detail.participantNames.join(", ") });
      } catch { /* Retry while signed in. */ }
    };
    void check();
    const timer = window.setInterval(() => void check(), 1200);
    return () => { active = false; window.clearInterval(timer); };
  }, [call.activeCall, call.incoming, selection?.id]);

  useEffect(() => {
    const heartbeat = () => {
      if (localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken")) void updatePresence().catch(() => {});
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 15_000);
    window.addEventListener("focus", heartbeat);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", heartbeat); };
  }, []);

  useEffect(() => {
    if (!call.incoming) return;
    let context: AudioContext | null = null;
    let timer: number | undefined;
    try {
      context = new AudioContext();
      const play = () => {
        if (!context || context.state !== "running") return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 440;
        gain.gain.setValueAtTime(0.06, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(); oscillator.stop(context.currentTime + 0.6);
      };
      void context.resume().then(play).catch(() => {});
      timer = window.setInterval(play, 1800);
    } catch { /* Audio may be blocked until the user interacts with the page. */ }
    return () => { if (timer) window.clearInterval(timer); if (context) void context.close(); };
  }, [call.incoming]);

  return <Context.Provider value={value}>
    {children}
    <BrowserNotifications incoming={call.incoming} caller={selection?.title ?? ""} conversationId={selection?.id ?? null}/>
    {call.incoming && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 sm:p-4"><section role="dialog" aria-modal="true" aria-label={fr ? "Appel entrant" : "Incoming call"} className="flex h-[100dvh] w-full flex-col items-center justify-between bg-[#003b28] px-6 py-12 text-center text-white sm:h-[640px] sm:max-w-md sm:rounded-3xl"><div><p className="text-2xl font-bold"><span className="text-emerald-400">●</span> TGE</p><h2 className="mt-10 text-2xl font-bold">{selection?.title}</h2><p className="mt-2 text-emerald-100">{call.incoming.media === "video" ? (fr ? "Appel vidéo entrant…" : "Incoming video call…") : (fr ? "Appel vocal entrant…" : "Incoming voice call…")}</p></div><Avatar name={selection?.title ?? ""}/><div className="flex w-full max-w-xs justify-between"><CallButton label={fr ? "Refuser" : "Decline"} icon={PhoneOff} color="red" onClick={() => void call.decline()}/><CallButton label={fr ? "Répondre" : "Accept"} icon={call.incoming.media === "video" ? Video : Phone} color="green" onClick={() => void call.accept()}/></div></section></div>}
    {call.activeCall && <div className={minimized ? "fixed bottom-4 right-4 z-[80] w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-[#003b28] p-4 text-white shadow-2xl" : "fixed inset-0 z-[80] grid place-items-center bg-black/80 sm:p-4"}><section className={minimized ? "w-full" : "relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#003b28] text-white sm:h-[min(720px,90dvh)] sm:max-w-2xl sm:rounded-3xl"} aria-label={fr ? "Appel en cours" : "Active call"}>
      <audio ref={(el) => { if (el && el.srcObject !== call.remoteStream) el.srcObject = call.remoteStream; }} muted={call.speakerMuted} autoPlay playsInline/>
      {!minimized && call.activeCall.media === "video" && call.remoteStream && <video ref={(el) => { if (el && el.srcObject !== call.remoteStream) el.srcObject = call.remoteStream; }} aria-label={selection?.title} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover"/>}
      {!minimized && call.activeCall.media === "video" && <video ref={(el) => { if (el && el.srcObject !== call.localStream) el.srcObject = call.localStream; }} aria-label={fr ? "Votre caméra" : "Your camera"} autoPlay playsInline muted className="absolute left-4 top-16 z-10 h-32 w-24 rounded-xl bg-black object-cover shadow-lg sm:h-40 sm:w-32"/>}
      <div className="relative z-10 flex items-start justify-between gap-3 p-4"><div><p className="font-bold"><span className="text-emerald-400">●</span> TGE</p><p className="text-sm">{selection?.title} · {call.activeCall.phase === "connected" ? `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}` : (fr ? "Connexion…" : "Connecting…")}</p></div><div className="flex gap-2">{!minimized && call.activeCall.media === "video" && <button onClick={() => void call.switchCamera()} className="rounded-full bg-black/40 p-3" aria-label={fr ? "Changer de caméra" : "Switch camera"}><SwitchCamera size={20}/></button>}<button onClick={() => setMinimized(!minimized)} className="rounded-full bg-black/40 p-3" aria-label={minimized ? (fr ? "Agrandir" : "Expand call") : (fr ? "Réduire" : "Minimize call")}>{minimized ? <Maximize2 size={20}/> : <Minimize2 size={20}/>}</button></div></div>
      {!minimized && <div className="relative z-[1] flex flex-1 flex-col items-center justify-center">{(call.activeCall.media === "audio" || !call.remoteStream) && <><Avatar name={selection?.title ?? ""}/><h2 className="mt-5 text-2xl font-bold">{selection?.title}</h2></>}</div>}
      <div className={`relative z-10 flex items-start justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent ${minimized ? "pt-3" : "pb-10 pt-8 sm:gap-6"}`}><CallButton label={call.muted ? (fr ? "Activer le micro" : "Unmute") : (fr ? "Micro" : "Mute")} icon={call.muted ? MicOff : Mic} onClick={call.toggleMute}/>{call.activeCall.media === "video" && <CallButton label={call.cameraOff ? (fr ? "Activer la caméra" : "Camera on") : (fr ? "Caméra" : "Camera")} icon={call.cameraOff ? CameraOff : Camera} onClick={call.toggleCamera}/>}<CallButton label={call.speakerMuted ? (fr ? "Activer le son" : "Unmute sound") : (fr ? "Son" : "Sound")} icon={call.speakerMuted ? VolumeX : Volume2} onClick={call.toggleSpeaker}/><CallButton label={fr ? "Terminer" : "End"} icon={PhoneOff} color="red" onClick={() => void call.end()}/></div>
    </section></div>}
    {call.error && <div role="alert" className="fixed bottom-4 left-4 z-[90] flex max-w-md items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-900 shadow-lg"><span>{call.error}</span><button aria-label={fr ? "Fermer" : "Dismiss"} onClick={call.clearError}><X size={18}/></button></div>}
  </Context.Provider>;
}
export function useCallSession() { const value = useContext(Context); if (!value) throw new Error("CallSessionProvider is missing."); return value; }

function Avatar({ name }: { name: string }) { const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); return <div aria-hidden="true" className="grid h-40 w-40 place-items-center rounded-full border-4 border-emerald-600 bg-emerald-100 text-5xl font-bold text-emerald-900 shadow-[0_0_0_24px_rgba(0,130,85,.16)]">{initials || "TGE"}</div>; }
function CallButton({ label, icon: Icon, color, onClick }: { label: string; icon: typeof Phone; color?: "red" | "green"; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-w-14 flex-col items-center gap-2 text-xs font-semibold" aria-label={label}><span className={`grid h-14 w-14 place-items-center rounded-full ${color === "red" ? "bg-red-600" : color === "green" ? "bg-emerald-500" : "bg-white/15"}`}><Icon size={23}/></span><span>{label}</span></button>; }
