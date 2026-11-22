import "dotenv/config";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "../src/app.module.js";
import { prisma } from "../src/infrastructure/database/prisma-client.js";

const event = await prisma.event.findFirst({ where: { title: "TGE Public Pages Test Event", status: "published" }, select: { id: true } });
if (!event) throw new Error("The test event is missing.");
const email = `pub07-test-${Date.now()}@example.org`;
const server = createServer(createApp());
server.listen(0);
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server did not bind.");
try {
  const events = await fetch(`http://127.0.0.1:${address.port}/api/public/events`).then((response) => response.json()) as { data: { upcoming: Array<{ id: string }>; past: unknown[] } };
  const details = await fetch(`http://127.0.0.1:${address.port}/api/public/events/${event.id}`).then((response) => response.json()) as { data: { id: string } };
  const gallery = await fetch(`http://127.0.0.1:${address.port}/api/public/gallery`).then((response) => response.json()) as { data: unknown[] };
  if (!events.data.upcoming.some((item) => item.id === event.id) || details.data.id !== event.id || !Array.isArray(gallery.data)) throw new Error("Public event page queries failed.");
  const input = { name: "PUB-07 Test Guest", email, phone: "+237 600 000 000", consent: true };
  const first = await fetch(`http://127.0.0.1:${address.port}/api/public/events/${event.id}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const duplicate = await fetch(`http://127.0.0.1:${address.port}/api/public/events/${event.id}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  console.log(JSON.stringify({ listing: "passed", detail: "passed", gallery: `passed (${gallery.data.length} approved items)`, first: first.status, firstBody: await first.json(), duplicate: duplicate.status, duplicateBody: await duplicate.json() }));
  if (first.status !== 201 || duplicate.status !== 409) throw new Error("Registration checks failed.");
} finally {
  await prisma.eventRegistration.deleteMany({ where: { eventId: event.id, guestEmail: email } });
  server.close();
  await prisma.$disconnect();
}
