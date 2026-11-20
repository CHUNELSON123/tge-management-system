import { Router } from "express";
import type { GetHomePreviewsUseCase } from "../application/get-home-previews.usecase.js";
import type { GetPublicProgrammesUseCase } from "../application/get-public-programmes.usecase.js";
import type { GetPublicEventsUseCase } from "../application/get-public-events.usecase.js";
import type { GetPublicEventDetailsUseCase } from "../application/get-public-event-details.usecase.js";
import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { GetPublicNewsUseCase, GetPublicNewsDetailsUseCase } from "../application/get-public-news.usecase.js";
import type { GetPublicPageUseCase } from "../application/get-public-page.usecase.js";
import { eventRegistrationUseCase } from "../../event-registration/event-registration.module.js";
import { sendRegistrationError } from "../../event-registration/presentation/member-event-registration.controller.js";
import { WebsiteSettingsRepository } from "../infrastructure/website-settings.repository.js";
import { EmailService } from "../../../common/services/email.service.js";

const submissionBuckets = new Map<string, { startedAt: number; count: number }>();
function allowSubmission(ip: string, kind: string): boolean {
  const now = Date.now();
  const key = `${kind}:${ip}`;
  const current = submissionBuckets.get(key);
  if (!current || now - current.startedAt >= 10 * 60 * 1000) {
    if (submissionBuckets.size > 5000) {
      for (const [bucket, value] of submissionBuckets) if (now - value.startedAt >= 10 * 60 * 1000) submissionBuckets.delete(bucket);
    }
    submissionBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export function createPublicPagesRouter(
  getHomePreviews: GetHomePreviewsUseCase,
  getPublicProgrammes: GetPublicProgrammesUseCase,
  getPublicEvents: GetPublicEventsUseCase,
  getPublicEventDetails: GetPublicEventDetailsUseCase,
  getPublicNews?: GetPublicNewsUseCase,
  getPublicNewsDetails?: GetPublicNewsDetailsUseCase,
  getPublicPage?: GetPublicPageUseCase,
  getOrganisation?: () => Promise<{ name: string; email: string; phone: string; address: string }>,
  subscribeOverride?: (email: string, source: string) => Promise<{ status: "subscribed" | "already-subscribed"; notificationSent?: boolean }>,
): Router {
  const router = Router();
  const websiteSettings = new WebsiteSettingsRepository();
  router.get("/website-settings", async (_req, res) => {
    try { const { newsletterEmail: _privateEmail, ...data } = await websiteSettings.get(); res.json({ data }); }
    catch { res.status(503).json({ message: "Website settings are unavailable." }); }
  });

  router.get("/organisation", async (_req, res) => {
    if (!getOrganisation) { res.status(503).json({ message: "Organisation details are unavailable." }); return; }
    try {
      const { name, email, phone, address } = await getOrganisation();
      res.json({ data: { name, email, phone, address } });
    } catch { res.status(503).json({ message: "Organisation details are unavailable." }); }
  });

  router.get("/pages/:slug", async (req, res) => {
    if (!getPublicPage || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug)) { res.status(404).json({ message: "Page not found." }); return; }
    try {
      const page = await getPublicPage.execute(req.params.slug);
      if (!page) { res.status(404).json({ message: "Page not found." }); return; }
      res.status(200).json({ message: "Public page loaded.", data: page });
    } catch { res.status(503).json({ message: "Page content is temporarily unavailable." }); }
  });

  router.post("/contact-enquiries", async (req, res) => {
    const { name, email, subject, message, consent } = req.body ?? {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 200 ||
      typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof subject !== "string" || subject.trim().length < 2 || subject.trim().length > 250 ||
      typeof message !== "string" || message.trim().length < 5 || message.trim().length > 10000 || consent !== true) {
      res.status(400).json({ message: "Enter valid contact details and accept the privacy notice." });
      return;
    }
    if (!allowSubmission(req.ip || "unknown", "contact")) {
      res.status(429).json({ message: "Too many enquiries. Please try again later." });
      return;
    }
    res.status(503).json({ message: "Contact enquiries are temporarily unavailable." });
  });

  router.post("/newsletter-subscriptions", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Enter a valid email address." });
      return;
    }
    if (!allowSubmission(req.ip || "unknown", "newsletter")) {
      res.status(429).json({ message: "Too many subscription requests. Please try again later." });
      return;
    }
    try {
      const source = typeof req.body?.source === "string" ? req.body.source.slice(0, 150) : "website";
      if (subscribeOverride) { const result = await subscribeOverride(email, source); res.status(result.status === "subscribed" ? 201 : 200).json(result); return; }
      const existing = await prisma.newsletterSubscription.findUnique({ where: { email } });
      if (existing?.status === "subscribed") { res.json({ status: "already-subscribed" }); return; }
      await prisma.newsletterSubscription.upsert({ where: { email }, create: { email, consentSource: source }, update: { status: "subscribed", subscribedAt: new Date(), unsubscribedAt: null, consentSource: source } });
      let notificationSent = false;
      try {
        const { newsletterEmail } = await websiteSettings.get();
        if (newsletterEmail) {
          const safeEmail = email.replace(/[&<>"']/g, "");
          await new EmailService().sendEmail({ to: newsletterEmail, subject: "New TGE newsletter subscriber", html: `<p>A visitor subscribed to the newsletter: ${safeEmail}</p>` });
          notificationSent = true;
        }
      } catch (error) { console.error("Newsletter notification could not be sent", error); }
      res.status(201).json({ status: "subscribed", notificationSent });
    } catch { res.status(503).json({ message: "Newsletter subscription is temporarily unavailable." }); }
  });

  router.get("/home-previews", async (_req, res) => {
    try {
      const data = await getHomePreviews.execute();
      res.status(200).json({ message: "Public home previews loaded.", data });
    } catch {
      res.status(503).json({ message: "Public content is temporarily unavailable." });
    }
  });

  router.get("/programmes", async (_req, res) => {
    try {
      const data = await getPublicProgrammes.execute();
      res.status(200).json({ message: "Published programmes loaded.", data });
    } catch {
      res.status(503).json({ message: "Programmes are temporarily unavailable." });
    }
  });

  router.get("/news", async (_req, res) => {
    if (!getPublicNews) { res.status(503).json({ message: "News are temporarily unavailable." }); return; }
    try {
      const data = await getPublicNews.execute();
      res.status(200).json({ message: "Published news loaded.", data });
    } catch {
      res.status(503).json({ message: "News are temporarily unavailable." });
    }
  });

  router.get("/news/:slug", async (req, res) => {
    if (!getPublicNewsDetails) { res.status(503).json({ message: "Article details are temporarily unavailable." }); return; }
    try {
      const article = await getPublicNewsDetails.execute(req.params.slug);
      if (!article) { res.status(404).json({ message: "Article not found." }); return; }
      res.status(200).json({ message: "Public article loaded.", data: article });
    } catch {
      res.status(503).json({ message: "Article details are temporarily unavailable." });
    }
  });

  router.get("/events", async (_req, res) => {
    try {
      const data = await getPublicEvents.execute();
      res.status(200).json({ message: "Published events loaded.", data });
    } catch {
      res.status(503).json({ message: "Events are temporarily unavailable." });
    }
  });

  router.get("/events/:eventId", async (req, res) => {
    const eventId = req.params.eventId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    try {
      const data = await getPublicEventDetails.execute(eventId);
      if (!data) {
        res.status(404).json({ message: "Event not found." });
        return;
      }
      res.status(200).json({ message: "Public event loaded.", data });
    } catch {
      res.status(503).json({ message: "Event details are temporarily unavailable." });
    }
  });

  router.get("/gallery", async (_req, res) => {
    try {
      const data = await prisma.eventMedia.findMany({
        where: { approvedAt: { not: null }, publicUrl: { not: null }, event: { status: "published" } },
        select: { id: true, eventId: true, publicUrl: true, altText: true, event: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      });
      const allowedHosts = (process.env.PUBLIC_MEDIA_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
      const publicItems = data.flatMap((item) => {
        const url = item.publicUrl as string | null;
        const altText = item.altText as string | null;
        let parsedUrl: URL;
        try { parsedUrl = new URL(url || ""); } catch { return []; }
        if (parsedUrl.protocol !== "https:" || !allowedHosts.includes(parsedUrl.hostname.toLowerCase()) || !altText?.trim()) return [];
        return [{ id: item.id, eventId: item.eventId, eventTitle: item.event.title, url, altText }];
      });
      res.status(200).json({ message: "Published event gallery loaded.", data: publicItems });
    } catch {
      res.status(503).json({ message: "Event gallery is temporarily unavailable." });
    }
  });

  router.post("/events/:eventId/registrations", async (req, res, next) => {
    const eventId = req.params.eventId;
    const { name, email, phone, consent } = req.body ?? {};
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId) ||
      typeof name !== "string" || name.trim().length < 2 || name.trim().length > 200 ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 ||
      typeof phone !== "string" || phone.trim().length < 5 || phone.length > 30 || consent !== true) {
      res.status(400).json({ message: "Enter valid registration details and accept the event terms and privacy notice." });
      return;
    }
    try {
      const data = await eventRegistrationUseCase.registerGuest({ eventId, name, email, phone });
      res.status(201).json({ message: "Registration confirmed.", data });
    } catch (error) { sendRegistrationError(error, res, next); }
  });

  return router;
}
