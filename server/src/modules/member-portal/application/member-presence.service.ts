export interface MemberPresenceRepository {
  heartbeat(userId: string, now: Date): Promise<void>;
  lastSeen(userId: string): Promise<Date | null>;
}
export class MemberPresenceService {
  constructor(private readonly repository: MemberPresenceRepository, private readonly timeoutMs = 45_000) {}
  heartbeat(userId: string, now = new Date()): Promise<void> { return this.repository.heartbeat(userId, now); }
  async isOnline(userId: string, now = new Date()): Promise<boolean> {
    const lastSeen = await this.repository.lastSeen(userId);
    return lastSeen !== null && now.getTime() - lastSeen.getTime() <= this.timeoutMs;
  }
}
