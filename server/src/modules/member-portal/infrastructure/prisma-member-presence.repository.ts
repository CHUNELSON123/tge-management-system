import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberPresenceRepository } from "../application/member-presence.service.js";
export class PrismaMemberPresenceRepository implements MemberPresenceRepository {
  async heartbeat(userId: string, now: Date): Promise<void> {
    await prisma.$executeRaw`INSERT INTO user_presence (user_id, last_seen_at) VALUES (${userId}::uuid, ${now}) ON CONFLICT (user_id) DO UPDATE SET last_seen_at = GREATEST(user_presence.last_seen_at, EXCLUDED.last_seen_at)`;
  }
  async lastSeen(userId: string): Promise<Date | null> {
    const records = await prisma.$queryRaw<{ last_seen_at: Date }[]>`SELECT last_seen_at FROM user_presence WHERE user_id = ${userId}::uuid`;
    return records[0]?.last_seen_at ?? null;
  }
}
