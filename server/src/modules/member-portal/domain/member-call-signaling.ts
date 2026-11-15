export type MemberCallSignalKind = "offer" | "answer" | "ice" | "end";
export type MemberCallMedia = "audio" | "video";
export interface MemberCallSignal {
  id: number; callId: string; fromUserId: string; kind: MemberCallSignalKind; media: MemberCallMedia; payload: Record<string, unknown> | null;
}
