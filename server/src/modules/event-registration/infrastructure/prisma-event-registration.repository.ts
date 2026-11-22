import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { EventRegistrationRepository, GuestRegistration } from "../domain/event-registration.repository.js";

export class PrismaEventRegistrationRepository implements EventRegistrationRepository {
  private async register(eventId: string, identity: { memberId: string | null; name: string | null; email: string; phone: string | null; userId: string | null }) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
      const event = await tx.event.findFirst({ where: { id: eventId, status: "published" }, select: { id: true, title: true, startAt: true, registrationDeadline: true, capacity: true, registrationRequired: true } });
      if (!event) throw new Error("EVENT_NOT_FOUND");
      if (!event.registrationRequired) throw new Error("REGISTRATION_NOT_REQUIRED");
      const now = new Date();
      if (event.startAt <= now || (event.registrationDeadline && event.registrationDeadline <= now)) throw new Error("REGISTRATION_CLOSED");
      const duplicate = await tx.eventRegistration.findFirst({ where: { eventId, registrationStatus: "registered", cancelledAt: null, OR: [{ guestEmail: { equals: identity.email, mode: "insensitive" } }, { member: { user: { email: { equals: identity.email, mode: "insensitive" } } } }, ...(identity.memberId ? [{ memberId: identity.memberId }] : [])] }, select: { id: true } });
      if (duplicate) throw new Error("REGISTRATION_EXISTS");
      if (event.capacity !== null && await tx.eventRegistration.count({ where: { eventId, registrationStatus: "registered", cancelledAt: null } }) >= event.capacity) throw new Error("EVENT_FULL");
      const registration = await tx.eventRegistration.create({ data: { eventId, memberId: identity.memberId, guestName: identity.name, guestEmail: identity.memberId ? null : identity.email, guestPhone: identity.phone, consentAcceptedAt: now, consentVersion: process.env.EVENT_REGISTRATION_CONSENT_VERSION || "event-registration-v1" } });
      if (identity.userId) await tx.auditLog.create({ data: { actorUserId: identity.userId, action: "MEMBER_EVENT_REGISTERED", entityType: "EventRegistration", entityId: registration.id, details: { eventId } } });
      if (identity.userId) await tx.notification.create({ data: { userId: identity.userId, title: "Event registration confirmed", body: `You are registered for ${event.title}.`, notificationType: "event" } });
      return { eventId: event.id, eventTitle: event.title };
    });
  }
  registerGuest(input: GuestRegistration) { return this.register(input.eventId, { memberId: null, name: input.name.trim(), email: input.email.trim().toLowerCase(), phone: input.phone.trim(), userId: null }); }
  async registerMember(eventId: string, userId: string) {
    const member = await prisma.member.findFirst({ where: { userId, membershipStatus: "active", user: { status: "ACTIVE", deletedAt: null } }, select: { id: true, user: { select: { email: true } } } });
    if (!member) throw new Error("MEMBER_NOT_ACTIVE");
    return this.register(eventId, { memberId: member.id, name: null, email: member.user.email, phone: null, userId });
  }
  async cancelMember(eventId: string, userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
      const event = await tx.event.findFirst({ where: { id: eventId, status: "published" }, select: { startAt: true } });
      if (!event) throw new Error("EVENT_NOT_FOUND");
      if (event.startAt <= new Date()) throw new Error("CANCELLATION_CLOSED");
      const registration = await tx.eventRegistration.findFirst({ where: { eventId, member: { userId }, registrationStatus: "registered", cancelledAt: null }, select: { id: true } });
      if (!registration) throw new Error("REGISTRATION_NOT_FOUND");
      await tx.eventRegistration.update({ where: { id: registration.id }, data: { registrationStatus: "cancelled", cancelledAt: new Date() } });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "MEMBER_EVENT_REGISTRATION_CANCELLED", entityType: "EventRegistration", entityId: registration.id, details: { eventId } } });
    });
  }
}
