import { raw, Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { GetMemberDashboardUseCase } from "../application/get-member-dashboard.usecase.js";
import type { GetMemberProfileUseCase } from "../application/get-member-profile.usecase.js";
import type { MemberProfilePhotoUseCase } from "../application/member-profile-photo.usecase.js";
import type { GetMemberProgrammesUseCase } from "../application/get-member-programmes.usecase.js";
import type { GetMemberEventsUseCase } from "../application/get-member-events.usecase.js";
import type { GetMemberMentorshipUseCase } from "../application/get-member-mentorship.usecase.js";
import type { GetMemberResourcesUseCase } from "../application/get-member-resources.usecase.js";
import type { GetMemberBusinessesUseCase } from "../application/get-member-businesses.usecase.js";

const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null).nullable().optional();
const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
}).nullable().optional();
const memberProfileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: optionalText(30),
  location: optionalText(255),
  dateOfBirth: dateOfBirthSchema,
  gender: optionalText(50),
  nationality: optionalText(100),
  preferredLanguage: z.enum(["en", "fr"]).nullable().optional(),
  timezone: optionalText(100),
  bio: optionalText(250),
}).strict().refine((input) => Object.keys(input).length > 0);

const allowedProfilePhotoTypes = ["image/jpeg", "image/png"] as const;
const profilePhotoBody = raw({ type: [...allowedProfilePhotoTypes], limit: "2mb" });

function matchesImageType(contentType: string, data: Buffer) {
  if (contentType === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (contentType === "image/png") return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return false;
}

export function createMemberPortalRouter(
  getMemberDashboard: GetMemberDashboardUseCase,
  getMemberProfile: GetMemberProfileUseCase,
  memberProfilePhoto: MemberProfilePhotoUseCase,
  getMemberProgrammes: GetMemberProgrammesUseCase,
  getMemberEvents: GetMemberEventsUseCase,
  getMemberMentorship: GetMemberMentorshipUseCase,
  getMemberResources: GetMemberResourcesUseCase,
  getMemberBusinesses: GetMemberBusinessesUseCase,
): Router {
  const router = Router();
  const memberBusinessInputSchema = z.object({
    name: z.string().trim().min(1).max(250),
    description: optionalText(20000),
    categoryIds: z.array(z.string().uuid()).max(20).default([]),
    address: optionalText(1000),
    websiteUrl: z.string().trim().url().max(1000).refine((value) => value.startsWith("https://"), "Use an HTTPS website URL.").nullable().optional(),
    email: z.string().trim().email().max(255).nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
  }).strict();

  router.get("/mentorship", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try {
      const data = await getMemberMentorship.execute(actor.userId);
      if (!data) { res.status(404).json({ message: "Member profile was not found." }); return; }
      res.status(200).json({ message: "Member mentorship loaded.", data });
    } catch {
      res.status(503).json({ message: "Member mentorship is temporarily unavailable." });
    }
  });

  router.get("/resources", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try {
      const data = await getMemberResources.execute(actor.userId);
      if (!data) { res.status(404).json({ message: "Member profile was not found." }); return; }
      res.status(200).json({ message: "Member resources loaded.", data });
    } catch {
      res.status(503).json({ message: "Member resources are temporarily unavailable." });
    }
  });

  router.get("/businesses", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try {
      const data = await getMemberBusinesses.execute(actor.userId);
      if (!data) { res.status(404).json({ message: "Member profile was not found." }); return; }
      res.status(200).json({ message: "Member businesses loaded.", data });
    } catch {
      res.status(503).json({ message: "Member businesses are temporarily unavailable." });
    }
  });

  router.get("/businesses/categories", authenticate, async (req: AuthenticatedRequest, res) => {
    if (req.authenticatedUser?.roleName !== "Member") { res.status(req.authenticatedUser ? 403 : 401).json({ message: "Member access is required." }); return; }
    try { res.status(200).json({ message: "Business categories loaded.", data: await getMemberBusinesses.categories() }); }
    catch { res.status(503).json({ message: "Business categories are temporarily unavailable." }); }
  });

  router.post("/businesses", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    const input = memberBusinessInputSchema.safeParse(req.body);
    if (!input.success) { res.status(400).json({ message: "Business details are invalid.", issues: input.error.flatten() }); return; }
    try {
      const data = await getMemberBusinesses.save(actor.userId, { ...input.data, description: input.data.description ?? null, address: input.data.address ?? null, websiteUrl: input.data.websiteUrl ?? null, email: input.data.email ?? null, phone: input.data.phone ?? null, categoryIds: [...new Set(input.data.categoryIds)] });
      if (!data) { res.status(404).json({ message: "Member profile was not found." }); return; }
      res.status(201).json({ message: "Business submitted for review.", data });
    } catch (error) {
      if (error instanceof Error && error.message === "ACTIVE_MEMBERSHIP_REQUIRED") { res.status(403).json({ message: "An active membership is required to list a business." }); return; }
      if (error instanceof Error && error.message === "BUSINESS_CATEGORY_INVALID") { res.status(400).json({ message: "Choose valid business categories." }); return; }
      if (error instanceof Error && error.message === "BUSINESS_STATE_CHANGED") { res.status(409).json({ message: "This business changed while you were editing. Reload it before saving." }); return; }
      res.status(503).json({ message: "Business could not be saved." });
    }
  });

  router.patch("/businesses/:businessId", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    const id = z.string().uuid().safeParse(req.params.businessId);
    const input = memberBusinessInputSchema.safeParse(req.body);
    if (!id.success) { res.status(404).json({ message: "Business not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "Business details are invalid.", issues: input.error.flatten() }); return; }
    try {
      const data = await getMemberBusinesses.save(actor.userId, { ...input.data, description: input.data.description ?? null, address: input.data.address ?? null, websiteUrl: input.data.websiteUrl ?? null, email: input.data.email ?? null, phone: input.data.phone ?? null, categoryIds: [...new Set(input.data.categoryIds)] }, id.data);
      if (!data) { res.status(404).json({ message: "Business not found." }); return; }
      res.json({ message: "Business updated and submitted for review.", data });
    } catch (error) {
      if (error instanceof Error && error.message === "BUSINESS_CATEGORY_INVALID") { res.status(400).json({ message: "Choose valid business categories." }); return; }
      if (error instanceof Error && error.message === "BUSINESS_STATE_CHANGED") { res.status(409).json({ message: "This business changed while you were editing. Reload it before saving." }); return; }
      res.status(503).json({ message: "Business could not be saved." });
    }
  });

  router.get("/programmes", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try {
      const data = await getMemberProgrammes.execute(actor.userId);
      if (!data) { res.status(404).json({ message: "Member profile was not found." }); return; }
      res.status(200).json({ message: "Member programmes loaded.", data });
    } catch {
      res.status(503).json({ message: "Member programmes are temporarily unavailable." });
    }
  });

  router.get("/events", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try {
      const data = await getMemberEvents.execute(actor.userId);
      if (!data) { res.status(404).json({ message: "Member profile was not found." }); return; }
      res.status(200).json({ message: "Member events loaded.", data });
    } catch {
      res.status(503).json({ message: "Member events are temporarily unavailable." });
    }
  });

  router.get("/events/:eventId", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
      res.status(404).json({ message: "Event not found." }); return;
    }
    try {
      const data = await getMemberEvents.getDetails(actor.userId, eventId);
      if (!data) { res.status(404).json({ message: "Event not found." }); return; }
      res.status(200).json({ message: "Member event loaded.", data });
    } catch {
      res.status(503).json({ message: "Event details are temporarily unavailable." });
    }
  });

  router.get("/dashboard", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }
    if (actor.roleName !== "Member") {
      res.status(403).json({ message: "Member access is required." });
      return;
    }

    try {
      const data = await getMemberDashboard.execute({ userId: actor.userId, roleId: actor.roleId });
      res.status(200).json({ message: "Member dashboard loaded.", data });
    } catch {
      res.status(503).json({ message: "Member dashboard is temporarily unavailable." });
    }
  });

  router.get("/profile", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }
    if (actor.roleName !== "Member") {
      res.status(403).json({ message: "Member access is required." });
      return;
    }

    try {
      const data = await getMemberProfile.execute(actor.userId);
      if (!data) {
        res.status(404).json({ message: "Member profile was not found." });
        return;
      }
      res.status(200).json({ message: "Member profile loaded.", data });
    } catch {
      res.status(503).json({ message: "Member profile is temporarily unavailable." });
    }
  });

  router.patch("/profile", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }
    if (actor.roleName !== "Member") {
      res.status(403).json({ message: "Member access is required." });
      return;
    }

    const parsed = memberProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Profile details are invalid." });
      return;
    }

    try {
      const data = await getMemberProfile.update(actor.userId, parsed.data);
      if (!data) {
        res.status(404).json({ message: "Member profile was not found." });
        return;
      }
      res.status(200).json({ message: "Profile details saved.", data });
    } catch {
      res.status(503).json({ message: "Profile details could not be saved right now." });
    }
  });

  router.get("/profile/photo", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try {
      const photo = await memberProfilePhoto.get(actor.userId);
      if (!photo) { res.status(404).json({ message: "No profile photo is available." }); return; }
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.status(200).type(photo.contentType).send(Buffer.from(photo.data));
    } catch {
      res.status(503).json({ message: "Profile photo is temporarily unavailable." });
    }
  });

  router.put("/profile/photo", authenticate, profilePhotoBody, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
    const photo = req.body;
    if (!contentType || !allowedProfilePhotoTypes.includes(contentType as (typeof allowedProfilePhotoTypes)[number]) || Array.isArray(photo) || !Buffer.isBuffer(photo) || photo.length === 0 || photo.length > 2 * 1024 * 1024 || !matchesImageType(contentType, photo)) {
      res.status(400).json({ message: "Choose a JPG or PNG image up to 2 MB." });
      return;
    }
    try {
      await memberProfilePhoto.save(actor.userId, { contentType, data: photo });
      res.status(200).json({ message: "Profile photo saved." });
    } catch {
      res.status(503).json({ message: "Profile photo could not be saved right now." });
    }
  });

  return router;
}
