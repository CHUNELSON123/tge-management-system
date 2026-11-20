import type { MemberCallMedia, MemberCallSignal, MemberCallSignalKind } from "../domain/member-call-signaling.js";
import type { MemberMessagesRepository } from "../domain/member-messages.repository.js";
import type { PrismaCallHistoryRepository } from "../infrastructure/prisma-call-history.repository.js";

interface StoredCallSignal extends MemberCallSignal { toUserId: string; createdAt: number }
export class MemberCallSignalingService {
  private sequence = 0;
  private readonly signals = new Map<string, StoredCallSignal[]>();
  constructor(private readonly repository: MemberMessagesRepository, private readonly history?: PrismaCallHistoryRepository) {}

  pendingOffer(userId: string): { conversationId: string; fromUserId: string } | null {
    const now = Date.now();
    for (const [conversationId, queue] of this.signals) {
      const offer = [...queue].reverse().find((event) => event.toUserId === userId && event.kind === "offer" && now - event.createdAt < 30_000 && !queue.some((later) => later.callId === event.callId && (later.kind === "answer" || later.kind === "end")));
      if (offer) return { conversationId, fromUserId: offer.fromUserId };
    }
    return null;
  }

  async publish(userId: string, conversationId: string, input: { callId: string; kind: MemberCallSignalKind; media: MemberCallMedia; payload: Record<string, unknown> | null }): Promise<number | null> {
    const peerUserId = await this.repository.findCallPeer(userId, conversationId);
    if (!peerUserId) return null;
    if (input.kind === "offer") await this.history?.start(conversationId, userId, input.callId, input.media);
    if (input.kind === "answer") await this.history?.answer(conversationId, input.callId, userId, input.media);
    if (input.kind === "end") await this.history?.finish(conversationId, input.callId, userId, input.media);
    const createdAt = Date.now();
    const queue = (this.signals.get(conversationId) ?? []).filter((signal) => createdAt - signal.createdAt < 10 * 60 * 1000);
    const signal: StoredCallSignal = { ...input, id: ++this.sequence, fromUserId: userId, toUserId: peerUserId, createdAt };
    queue.push(signal);
    this.signals.set(conversationId, queue.slice(-2000));
    return signal.id;
  }

  async list(userId: string, conversationId: string, after: number): Promise<{ signals: MemberCallSignal[]; cursor: number } | null> {
    const peerUserId = await this.repository.findCallPeer(userId, conversationId);
    if (!peerUserId) return null;
    const now = Date.now();
    const queue = (this.signals.get(conversationId) ?? []).filter((signal) => now - signal.createdAt < 10 * 60 * 1000);
    this.signals.set(conversationId, queue);
    return {
      signals: queue.filter((signal) => signal.toUserId === userId && signal.id > after && (signal.kind !== "offer" || (now - signal.createdAt < 30_000 && !queue.some((other) => other.callId === signal.callId && (other.kind === "end" || other.kind === "answer"))))).map(({ toUserId: _to, createdAt: _created, ...signal }) => signal),
      cursor: this.sequence,
    };
  }
}
