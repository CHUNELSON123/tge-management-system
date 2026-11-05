import "dotenv/config";
import { prisma } from "../src/infrastructure/database/prisma-client.js";

const admin = await prisma.user.findFirst({
  where: { status: "ACTIVE", deletedAt: null, role: { name: { in: ["System Administrator", "Organisation Administrator"] } } },
  select: { id: true, email: true, role: { select: { name: true } } },
});

if (!admin) throw new Error("No active administrator account is available to create the test event.");

const title = "TGE Public Pages Test Event";
const existing = await prisma.event.findFirst({ where: { title, status: "published" }, select: { id: true } });
const event = existing ?? await prisma.event.create({
  data: {
    title,
    description: "A test event for checking the public event listing, event details and guest registration flow.",
    eventType: "Workshop",
    startAt: new Date("2026-11-14T10:00:00.000Z"),
    endAt: new Date("2026-11-14T12:00:00.000Z"),
    timezone: "Africa/Douala",
    venue: "TGE Test Venue",
    registrationDeadline: new Date("2026-11-13T23:59:00.000Z"),
    capacity: 20,
    status: "published",
    createdByUserId: admin.id,
  },
  select: { id: true, title: true, startAt: true },
});

console.log(JSON.stringify({ createdByRole: admin.role.name, createdBy: admin.email, ...event }));
await prisma.$disconnect();
