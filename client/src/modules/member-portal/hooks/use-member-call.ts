"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readCallSignals, sendCallSignal } from "../services/member-messages.service";
import type { MemberCallMedia, MemberCallSignal } from "../types/member-messages.types";

interface IncomingCall { callId: string; media: MemberCallMedia; offer: RTCSessionDescriptionInit }
interface ActiveCall { callId: string; media: MemberCallMedia; phase: "calling" | "connected" }
function description(payload: Record<string, unknown> | null): RTCSessionDescriptionInit | null {
  if (!payload || (payload.type !== "offer" && payload.type !== "answer") || typeof payload.sdp !== "string") return null;
  return { type: payload.type, sdp: payload.sdp };
}

export function useMemberCall(conversationId: string | null, peerUserId: string | null) {
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callRef = useRef<ActiveCall | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const cursorRef = useRef(0);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingLocalIceRef = useRef<RTCIceCandidateInit[]>([]);
  const localSignalReadyRef = useRef(false);
  const pollingRef = useRef(false);
  const busyRef = useRef(false);
  const generationRef = useRef(0);
  const cameraFacingRef = useRef<"user" | "environment">("user");
  const answeredRef = useRef(false);
  useEffect(() => {
    incomingRef.current = incoming;
    callRef.current = activeCall;
    localRef.current = localStream;
  }, [incoming, activeCall, localStream]);

  const cleanup = useCallback(() => {
    generationRef.current++;
    pcRef.current?.close(); pcRef.current = null;
    localRef.current?.getTracks().forEach((track) => track.stop());
    localRef.current = null; setLocalStream(null); setRemoteStream(null); setActiveCall(null); setIncoming(null);
    callRef.current = null; incomingRef.current = null; pendingIceRef.current = []; pendingLocalIceRef.current = []; localSignalReadyRef.current = false;
    busyRef.current = false; answeredRef.current = false; setMuted(false); setCameraOff(false); setSpeakerMuted(false);
  }, []);
  // Stop the active media session when changing conversations.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cursorRef.current = 0; cleanup(); setError(""); }, [conversationId, cleanup]);
  useEffect(() => () => cleanup(), [cleanup]);

  const signal = useCallback(async (kind: MemberCallSignal["kind"], callId: string, media: MemberCallMedia, payload?: Record<string, unknown> | null) => {
    if (!conversationId) return;
    await sendCallSignal(conversationId, { callId, kind, media, payload });
  }, [conversationId]);

  const applyIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    const waiting = pendingIceRef.current.splice(0);
    for (const candidate of waiting) { try { await pc.addIceCandidate(candidate); } catch { /* stale candidates are ignored */ } }
  }, []);

  const makePeer = useCallback((callId: string, media: MemberCallMedia) => {
    const turnUrls = (process.env.NEXT_PUBLIC_WEBRTC_TURN_URLS ?? "").split(",").map((url) => url.trim()).filter(Boolean);
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, ...(turnUrls.length ? [{ urls: turnUrls, username: process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME, credential: process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL }] : [])] });
    pcRef.current = pc;
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON() as unknown as Record<string, unknown>;
      if (localSignalReadyRef.current) void signal("ice", callId, media, candidate).catch(() => setError("Call connection was interrupted. Check the connection and try again."));
      else pendingLocalIceRef.current.push(candidate as RTCIceCandidateInit);
    };
    pc.ontrack = (event) => setRemoteStream(event.streams[0] ?? null);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setActiveCall((current) => current ? { ...current, phase: "connected" } : current);
      if (pc.connectionState === "failed") { void signal("end", callId, media).catch(() => {}); cleanup(); setError("The call could not connect. Try again from a different network."); }
    };
    return pc;
  }, [signal, cleanup]);

  const start = useCallback(async (media: MemberCallMedia) => {
    if (!conversationId || !peerUserId || activeCall || incoming || busyRef.current) return;
    busyRef.current = true;
    const generation = generationRef.current;
    setError("");
    const callId = crypto.randomUUID();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Media devices are unavailable. Use HTTPS or localhost and allow microphone and camera access.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: media === "video" });
      if (generation !== generationRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      localSignalReadyRef.current = false; pendingLocalIceRef.current = [];
      localRef.current = stream; setLocalStream(stream);
      const pc = makePeer(callId, media);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const next: ActiveCall = { callId, media, phase: "calling" }; callRef.current = next; setActiveCall(next);
      await signal("offer", callId, media, { type: offer.type, sdp: offer.sdp });
      localSignalReadyRef.current = true;
      for (const candidate of pendingLocalIceRef.current.splice(0)) await signal("ice", callId, media, candidate as unknown as Record<string, unknown>);
    } catch (err) {
      void signal("end", callId, media).catch(() => {}); cleanup(); setError(err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError") ? "Allow microphone and camera access in your browser settings." : err instanceof Error ? err.message : "The call could not be started.");
    } finally { busyRef.current = false; }
  }, [conversationId, peerUserId, activeCall, incoming, makePeer, signal, cleanup]);

  const accept = useCallback(async () => {
    const offer = incomingRef.current;
    if (!conversationId || !peerUserId || !offer || busyRef.current) return;
    busyRef.current = true;
    const generation = generationRef.current;
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Media devices are unavailable. Use HTTPS or localhost and allow microphone and camera access.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: offer.media === "video" });
      if (generation !== generationRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      localSignalReadyRef.current = false; pendingLocalIceRef.current = [];
      localRef.current = stream; setLocalStream(stream);
      const pc = makePeer(offer.callId, offer.media);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(offer.offer); await applyIce();
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
      const next: ActiveCall = { callId: offer.callId, media: offer.media, phase: "calling" }; callRef.current = next; incomingRef.current = null; setActiveCall(next); setIncoming(null);
      answeredRef.current = true;
      await signal("answer", offer.callId, offer.media, { type: answer.type, sdp: answer.sdp });
      localSignalReadyRef.current = true;
      for (const candidate of pendingLocalIceRef.current.splice(0)) await signal("ice", offer.callId, offer.media, candidate as unknown as Record<string, unknown>);
    } catch (err) {
      await signal("end", offer.callId, offer.media).catch(() => {});
      cleanup(); setError(err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError") ? "Allow microphone and camera access in your browser settings." : err instanceof Error ? err.message : "The call could not be answered.");
    } finally { busyRef.current = false; }
  }, [conversationId, peerUserId, makePeer, applyIce, signal, cleanup]);

  const decline = useCallback(async () => {
    const offer = incomingRef.current;
    if (offer) await signal("end", offer.callId, offer.media).catch(() => {});
    cleanup();
  }, [signal, cleanup]);

  const end = useCallback(async () => {
    const call = callRef.current;
    if (call) await signal("end", call.callId, call.media).catch(() => {});
    cleanup();
  }, [signal, cleanup]);

  useEffect(() => {
    if (!activeCall || activeCall.phase !== "calling") return;
    const timer = window.setTimeout(() => {
      const current = callRef.current;
      if (!current || current.callId !== activeCall.callId || current.phase !== "calling") return;
      const message = answeredRef.current ? "The call could not connect. Please try again." : "No answer.";
      void signal("end", current.callId, current.media).catch(() => {}); cleanup(); setError(message);
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [activeCall, cleanup, signal]);
  useEffect(() => {
    if (!incoming) return;
    const timer = window.setTimeout(() => { if (incomingRef.current?.callId === incoming.callId) cleanup(); }, 30_000);
    return () => window.clearTimeout(timer);
  }, [incoming, cleanup]);

  const toggleMute = useCallback(() => { const track = localRef.current?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); } }, []);
  const toggleCamera = useCallback(() => { const track = localRef.current?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); } }, []);
  const toggleSpeaker = useCallback(() => setSpeakerMuted((current) => !current), []);
  const switchCamera = useCallback(async () => {
    const stream = localRef.current; const old = stream?.getVideoTracks()[0]; const sender = pcRef.current?.getSenders().find((item) => item.track === old);
    if (!stream || !old || !sender) return;
    try {
      const nextFacing = cameraFacingRef.current === "user" ? "environment" : "user";
      const replacement = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: nextFacing } }, audio: false });
      const track = replacement.getVideoTracks()[0]; if (!track) throw new Error("No camera found.");
      track.enabled = old.enabled;
      try { await sender.replaceTrack(track); } catch (err) { track.stop(); throw err; }
      stream.removeTrack(old); old.stop(); stream.addTrack(track); cameraFacingRef.current = nextFacing; setLocalStream(new MediaStream(stream.getTracks()));
    } catch { setError("The other camera is not available on this device."); }
  }, []);

  useEffect(() => {
    if (!conversationId || !peerUserId) return;
    const poll = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const result = await readCallSignals(conversationId, cursorRef.current);
        cursorRef.current = Math.max(cursorRef.current, result.cursor);
        for (const event of result.signals) {
          if (event.kind === "offer" && !callRef.current && !incomingRef.current) {
            const offer = description(event.payload);
            if (offer) { const next = { callId: event.callId, media: event.media, offer }; incomingRef.current = next; setIncoming(next); }
          } else if (event.kind === "end" && (callRef.current?.callId === event.callId || incomingRef.current?.callId === event.callId)) {
            const wasCalling = callRef.current?.phase === "calling";
            cleanup();
            if (wasCalling) setError("The call was declined or ended before connecting.");
          }
          else if (event.callId === callRef.current?.callId) {
            const pc = pcRef.current;
            if (event.kind === "answer" && pc && !pc.remoteDescription) { const answer = description(event.payload); if (answer) { answeredRef.current = true; await pc.setRemoteDescription(answer); await applyIce(); } }
            if (event.kind === "ice" && event.payload && typeof event.payload.candidate === "string") {
              const candidate = event.payload as RTCIceCandidateInit;
              if (pc?.remoteDescription) { try { await pc.addIceCandidate(candidate); } catch { /* stale candidates are ignored */ } }
              else pendingIceRef.current.push(candidate);
            }
          } else if (event.kind === "ice" && event.callId === incomingRef.current?.callId && event.payload && typeof event.payload.candidate === "string") {
            pendingIceRef.current.push(event.payload as RTCIceCandidateInit);
          }
        }
      } catch { /* polling retries while the conversation remains open */ }
      finally { pollingRef.current = false; }
    };
    void poll();
    const interval = window.setInterval(() => { void poll(); }, 1200);
    return () => window.clearInterval(interval);
  }, [conversationId, peerUserId, cleanup, applyIce]);

  return { incoming, activeCall, localStream, remoteStream, error, muted, cameraOff, speakerMuted, toggleMute, toggleCamera, toggleSpeaker, switchCamera, start, accept, decline, end, clearError: () => setError("") };
}
