import test from "node:test";
import assert from "node:assert/strict";
import { PublicEventNotFoundError, PublicNewsNotFoundError, publicPagesService } from "./public-pages.service";

test("public pages service loads Home previews from the public API", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      message: "Public home previews loaded.",
      data: { programmes: [], events: [], businesses: [], news: [] },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    assert.deepEqual(await publicPagesService.getHomePreviews(), {
      programmes: [], events: [], businesses: [], news: [],
    });
    assert.equal(requestedUrl, "http://localhost:4000/api/public/home-previews");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public pages service exposes API failures without leaking server details", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Public content is temporarily unavailable." }), { status: 503 });
  try {
    await assert.rejects(publicPagesService.getHomePreviews(), /Public content is temporarily unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public pages service loads programme cards from the public programme API", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      message: "Published programmes loaded.",
      data: [{ name: "Green Skills", slug: "green-skills", description: "Public description", startDate: null, endDate: null }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    assert.deepEqual(await publicPagesService.getProgrammes(), [
      { name: "Green Skills", slug: "green-skills", description: "Public description", startDate: null, endDate: null },
    ]);
    assert.equal(requestedUrl, "http://localhost:4000/api/public/programmes");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public pages service loads upcoming and past published events", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ message: "Published events loaded.", data: { upcoming: [], past: [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    assert.deepEqual(await publicPagesService.getEvents(), { upcoming: [], past: [] });
    assert.equal(requestedUrl, "http://localhost:4000/api/public/events");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public event details preserve the selected identifier and safely map 404", async () => {
  const originalFetch = globalThis.fetch;
  const eventId = "00000000-0000-4000-8000-000000000000";
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      message: "Public event loaded.",
      data: {
        id: eventId, title: "Workshop", eventType: "workshop", description: "Public description",
        startAt: "2026-11-05T10:00:00.000Z", endAt: null, timezone: null, venue: "Public venue", isUpcoming: true, relatedEvents: [],
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const event = await publicPagesService.getEventDetails(eventId);
    assert.equal(event.id, eventId);
    assert.equal(requestedUrl, `http://localhost:4000/api/public/events/${eventId}`);
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "Event not found." }), { status: 404 });
    await assert.rejects(publicPagesService.getEventDetails(eventId), PublicEventNotFoundError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("events service maps the two public event periods from the API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    message: "Published events loaded.",
    data: { upcoming: [], past: [] },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
  try {
    assert.deepEqual(await publicPagesService.getEvents(), { upcoming: [], past: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public news service loads published articles and safely handles missing slugs", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  const article = { id: "news-1", slug: "public-story", title: "Public story", summary: "Summary", content: "Body", publishedAt: "2026-11-03T10:00:00.000Z" };
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ message: "Published news loaded.", data: [article] }), { status: 200 });
  };
  try {
    assert.deepEqual(await publicPagesService.getNews(), [article]);
    assert.equal(requestedUrl, "http://localhost:4000/api/public/news");
    globalThis.fetch = async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ message: "Public article loaded.", data: article }), { status: 200 });
    };
    assert.deepEqual(await publicPagesService.getNewsArticle(article.slug), article);
    assert.equal(requestedUrl, "http://localhost:4000/api/public/news/public-story");
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "Article not found." }), { status: 404 });
    await assert.rejects(publicPagesService.getNewsArticle("draft-story"), PublicNewsNotFoundError);
  } finally { globalThis.fetch = originalFetch; }
});
