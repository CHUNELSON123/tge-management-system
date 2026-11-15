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

const allowedProfilePhotoTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const profilePhotoBody = raw({ type: [...allowedProfilePhotoTypes], limit: "3mb" });

function matchesImageType(contentType: string, data: Buffer) {
  if (contentType === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (contentType === "image/png") return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === "image/webp") return data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
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
    if (!contentType || !allowedProfilePhotoTypes.includes(contentType as (typeof allowedProfilePhotoTypes)[number]) || !Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > 3 * 1024 * 1024 || !matchesImageType(contentType, req.body)) {
      res.status(400).json({ message: "Choose a JPG, PNG, or WebP image up to 3 MB." });
      return;
    }
    try {
      await memberProfilePhoto.save(actor.userId, { contentType, data: req.body });
      res.status(200).json({ message: "Profile photo saved." });
    } catch {
      res.status(503).json({ message: "Profile photo could not be saved right now." });
    }
  });

  return router;
}
