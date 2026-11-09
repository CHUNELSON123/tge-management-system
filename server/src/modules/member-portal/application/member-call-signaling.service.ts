import type { MemberCallMedia, MemberCallSignal, MemberCallSignalKind } from "../domain/member-call-signaling.js";
import type { MemberMessagesRepository } from "../domain/member-messages.repository.js";

interface StoredCallSignal extends MemberCallSignal { toUserId: string; createdAt: number }
export class MemberCallSignalingService {
  private sequence = 0;
  private readonly signals = new Map<string, StoredCallSignal[]>();
  constructor(private readonly repository: MemberMessagesRepository) {}

  async publish(userId: string, conversationId: string, input: { callId: string; kind: MemberCallSignalKind; media: MemberCallMedia; payload: Record<string, unknown> | null }): Promise<number | null> {
    const peerUserId = await this.repository.findCallPeer(userId, conversationId);
    if (!peerUserId) return null;
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
      signals: queue.filter((signal) => signal.toUserId === userId && signal.id > after).map(({ toUserId: _to, createdAt: _created, ...signal }) => signal),
      cursor: this.sequence,
    };
  }
}
