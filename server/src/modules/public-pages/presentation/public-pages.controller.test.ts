import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { createPublicPagesRouter } from "./public-pages.controller.js";
import dotenv from "dotenv";
import { resolve } from "node:path";
import { PrismaPublicHomePreviewRepository } from "../infrastructure/prisma-public-home-preview.repository.js";
import { GetHomePreviewsUseCase } from "../application/get-home-previews.usecase.js";
import { GetPublicProgrammesUseCase } from "../application/get-public-programmes.usecase.js";
import { GetPublicEventsUseCase } from "../application/get-public-events.usecase.js";
import { GetPublicEventDetailsUseCase } from "../application/get-public-event-details.usecase.js";
import { PrismaPublicEventsRepository } from "../infrastructure/prisma-public-events.repository.js";
import { PrismaPublicNewsRepository } from "../infrastructure/prisma-public-news.repository.js";
import { GetPublicNewsUseCase, GetPublicNewsDetailsUseCase } from "../application/get-public-news.usecase.js";

test("public home previews route returns a safe preview DTO", async () => {
  const app = express();
  app.use("/api/public", createPublicPagesRouter({
    execute: async () => ({
      programmes: [{ title: "Published programme", href: "/programmes", summary: "Public summary" }],
      events: [],
      businesses: [],
      news: [],
    }),
  } as never, { execute: async () => [
    { name: "Green Skills", slug: "green-skills", description: "Public description", startDate: null, endDate: null },
  ] } as never, { execute: async () => ({ upcoming: [], past: [] }) } as never, { execute: async () => null } as never));
  const server = createServer(app);
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/public/home-previews`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      message: "Public home previews loaded.",
      data: {
        programmes: [{ title: "Published programme", href: "/programmes", summary: "Public summary" }],
        events: [],
        businesses: [],
        news: [],
      },
    });
    const programmesResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/programmes`);
    assert.equal(programmesResponse.status, 200);
    assert.deepEqual(await programmesResponse.json(), {
      message: "Published programmes loaded.",
      data: [{ name: "Green Skills", slug: "green-skills", description: "Public description", startDate: null, endDate: null }],
    });
    const eventsResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/events`);
    assert.equal(eventsResponse.status, 200);
    assert.deepEqual(await eventsResponse.json(), {
      message: "Published events loaded.",
      data: { upcoming: [], past: [] },
    });
    const missingEventResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/events/00000000-0000-4000-8000-000000000000`);
    assert.equal(missingEventResponse.status, 404);
    assert.deepEqual(await missingEventResponse.json(), { message: "Event not found." });
    const invalidEventResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/events/not-an-id`);
    assert.equal(invalidEventResponse.status, 404);
  } finally {
    server.close();
  }
});

test("public home previews route reads the existing database models", async () => {
  dotenv.config({ path: resolve(process.cwd(), ".env") });
  const repository = new PrismaPublicHomePreviewRepository();
  const eventsRepository = new PrismaPublicEventsRepository();
  const newsRepository = new PrismaPublicNewsRepository();
  const useCase = new GetHomePreviewsUseCase(repository);
  const app = express();
  app.use("/api/public", createPublicPagesRouter(
    useCase,
    new GetPublicProgrammesUseCase(repository),
    new GetPublicEventsUseCase(eventsRepository),
    new GetPublicEventDetailsUseCase(eventsRepository),
    new GetPublicNewsUseCase(newsRepository),
    new GetPublicNewsDetailsUseCase(newsRepository),
  ));
  const server = createServer(app);
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/public/home-previews`);
    assert.equal(response.status, 200);
    const body = await response.json() as { data: Record<string, unknown> };
    assert.deepEqual(Object.keys(body.data).sort(), ["businesses", "events", "news", "programmes"]);
    for (const values of Object.values(body.data)) assert.ok(Array.isArray(values));
    assert.equal(JSON.stringify(body).includes("logoStorageKey"), false);
    assert.equal(JSON.stringify(body).includes("reviewComment"), false);
    const programmesResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/programmes`);
    assert.equal(programmesResponse.status, 200);
    const programmeBody = await programmesResponse.json() as { data: unknown };
    assert.ok(Array.isArray(programmeBody.data));
    const eventsResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/events`);
    assert.equal(eventsResponse.status, 200);
    const eventBody = await eventsResponse.json() as { data: { upcoming: unknown; past: unknown } };
    assert.ok(Array.isArray(eventBody.data.upcoming));
    assert.ok(Array.isArray(eventBody.data.past));
    const newsResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/news`);
    assert.equal(newsResponse.status, 200);
    const newsBody = await newsResponse.json() as { data: unknown[] };
    assert.ok(Array.isArray(newsBody.data));
    const draftResponse = await fetch(`http://127.0.0.1:${address.port}/api/public/news/not-a-published-article`);
    assert.equal(draftResponse.status, 404);
    assert.deepEqual(await draftResponse.json(), { message: "Article not found." });
  } finally {
    server.close();
  }
});

test("public contact and newsletter submissions validate requests and remain disabled until their contracts are approved", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/public", createPublicPagesRouter(
    { execute: async () => ({ programmes: [], events: [], businesses: [], news: [] }) } as never,
    { execute: async () => [] } as never,
    { execute: async () => ({ upcoming: [], past: [] }) } as never,
    { execute: async () => null } as never,
  ));
  const server = createServer(app);
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  const base = `http://127.0.0.1:${address.port}/api/public`;
  try {
    const invalidContact = await fetch(`${base}/contact-enquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "A", email: "bad", subject: "", message: "x", consent: false }) });
    assert.equal(invalidContact.status, 400);
    const validContact = await fetch(`${base}/contact-enquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Test Visitor", email: "visitor@example.test", subject: "Question", message: "A valid message", consent: true }) });
    assert.equal(validContact.status, 503);
    assert.match((await validContact.json()).message, /temporarily unavailable/i);
    const invalidNewsletter = await fetch(`${base}/newsletter-subscriptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "invalid" }) });
    assert.equal(invalidNewsletter.status, 400);
    const validNewsletter = await fetch(`${base}/newsletter-subscriptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "visitor@example.test", source: "public-footer" }) });
    assert.equal(validNewsletter.status, 503);
    assert.match((await validNewsletter.json()).message, /temporarily unavailable/i);
  } finally {
    server.close();
  }
});
