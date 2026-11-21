import { raw, Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { GetAdminMembersUseCase } from "../../application/get-admin-members.usecase.js";
import type { RegisterAdminMemberUseCase } from "../../application/register-admin-member.usecase.js";
import type { ReviewMembershipApplicationUseCase } from "../../application/review-membership-application.usecase.js";
import { adminApplicationsQuerySchema, adminDirectMemberSchema, adminMemberIdSchema, adminMembersQuerySchema, adminMemberUpdateSchema, rejectMembershipApplicationSchema } from "../dto/admin-members.dto.js";

export function createAdminMembersRouter(useCase: GetAdminMembersUseCase, registerMember: RegisterAdminMemberUseCase, reviewApplication: ReviewMembershipApplicationUseCase): Router {
  const router = Router();
  const protect = [authenticate, requirePermission("members.manage")];
  const allowedPhotoTypes = ["image/jpeg", "image/png"] as const;
  const photoBody = raw({ type: [...allowedPhotoTypes], limit: "2mb" });

  function validPhoto(type: string | undefined, data: Buffer) {
    if (!type || data.length === 0 || data.length > 2 * 1024 * 1024) return false;
    if (type === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    return type === "image/png" && data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  router.get("/members", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = adminMembersQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ message: "Member filters are invalid." }); return; }
    try { res.status(200).json({ message: "Members loaded.", data: await useCase.list(parsed.data) }); }
    catch (error) { next(error); }
  });

  router.get("/members/:memberId/photo", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.memberId);
    if (!parsedId.success) { res.status(404).json({ message: "Member was not found." }); return; }
    try {
      const photo = await useCase.getProfilePhoto(parsedId.data);
      if (!photo) { res.status(404).json({ message: "Profile photo was not found." }); return; }
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.status(200).type(photo.contentType).send(Buffer.from(photo.data));
    } catch (error) { next(error); }
  });

  router.put("/members/:memberId/photo", ...protect, photoBody, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.memberId);
    const actorUserId = req.authenticatedUser?.userId;
    const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
    if (!parsedId.success) { res.status(404).json({ message: "Member was not found." }); return; }
    if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    if (!Buffer.isBuffer(req.body) || !validPhoto(contentType, req.body)) { res.status(400).json({ message: "Choose a JPG or PNG image up to 2 MB." }); return; }
    try {
      if (!await useCase.saveProfilePhoto(parsedId.data, actorUserId, contentType!, req.body)) { res.status(404).json({ message: "Member was not found." }); return; }
      res.status(200).json({ message: "Member profile photo saved." });
    } catch (error) { next(error); }
  });

  router.post("/members", authenticate, requirePermission("members.manage"), requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    const parsed = adminDirectMemberSchema.safeParse(req.body);
    const actorUserId = req.authenticatedUser?.userId;
    if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    if (!parsed.success) { res.status(400).json({ message: "Member registration details are invalid." }); return; }
    try {
      const data = await registerMember.execute(parsed.data, actorUserId);
      res.status(201).json({ message: data.invitationSent ? "Member registered. Account activation instructions were sent." : "Member registered, but the activation invitation could not be sent. Resend the invitation from Users & Roles.", data });
    } catch (error) {
      if ((error instanceof Error && error.message === "DUPLICATE_ACCOUNT") || (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")) {
        res.status(409).json({ message: "An account with this email already exists." }); return;
      }
      next(error);
    }
  });

  router.get("/members/applications", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    const parsed = adminApplicationsQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ message: "Application filters are invalid." }); return; }
    try { res.status(200).json({ message: "Pending membership applications loaded.", data: await useCase.listPendingApplications(parsed.data.page, parsed.data.pageSize, parsed.data.search) }); }
    catch (error) { next(error); }
  });

  router.post("/members/applications/:applicationId/approve", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.applicationId);
    const actorUserId = req.authenticatedUser?.userId;
    if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    if (!parsedId.success) { res.status(404).json({ message: "Membership application was not found." }); return; }
    try {
      const data = await reviewApplication.approve(parsedId.data, actorUserId);
      res.status(200).json({ message: data.invitationSent ? "Membership application approved. Account activation instructions were sent." : "Application approved, but the activation invitation could not be sent. Resend it from Users & Roles.", data });
    } catch (error) {
      if (error instanceof Error && error.message === "APPLICATION_NOT_FOUND") { res.status(404).json({ message: "Membership application was not found." }); return; }
      if (error instanceof Error && error.message === "APPLICATION_NOT_PENDING") { res.status(409).json({ message: "This application has already been reviewed." }); return; }
      if ((error instanceof Error && error.message === "DUPLICATE_ACCOUNT") || (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")) { res.status(409).json({ message: "An account with this email already exists." }); return; }
      next(error);
    }
  });

  router.post("/members/applications/:applicationId/reject", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.applicationId);
    const parsedBody = rejectMembershipApplicationSchema.safeParse(req.body);
    const actorUserId = req.authenticatedUser?.userId;
    if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    if (!parsedId.success) { res.status(404).json({ message: "Membership application was not found." }); return; }
    if (!parsedBody.success) { res.status(400).json({ message: "A rejection reason is required." }); return; }
    try {
      const data = await reviewApplication.reject(parsedId.data, actorUserId, parsedBody.data.reason);
      res.status(200).json({ message: data.notificationSent ? "Membership application rejected. The applicant was notified." : "Application rejected, but the notification could not be sent.", data });
    } catch (error) {
      if (error instanceof Error && error.message === "APPLICATION_NOT_FOUND") { res.status(404).json({ message: "Membership application was not found." }); return; }
      if (error instanceof Error && error.message === "APPLICATION_NOT_PENDING") { res.status(409).json({ message: "This application has already been reviewed." }); return; }
      next(error);
    }
  });

  router.get("/members/:memberId/programmes", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.memberId);
    if (!parsedId.success) { res.status(404).json({ message: "Member was not found." }); return; }
    try {
      const data = await useCase.getProgrammes(parsedId.data);
      if (!data) { res.status(404).json({ message: "Member was not found." }); return; }
      res.status(200).json({ message: "Member programme participation loaded.", data });
    } catch (error) { next(error); }
  });

  router.get("/members/:memberId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.memberId);
    if (!parsedId.success) { res.status(404).json({ message: "Member was not found." }); return; }
    try {
      const data = await useCase.getDetail(parsedId.data);
      if (!data) { res.status(404).json({ message: "Member was not found." }); return; }
      res.status(200).json({ message: "Member details loaded.", data });
    } catch (error) { next(error); }
  });

  router.patch("/members/:memberId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = adminMemberIdSchema.safeParse(req.params.memberId);
    const parsedInput = adminMemberUpdateSchema.safeParse(req.body);
    if (!parsedId.success) { res.status(404).json({ message: "Member was not found." }); return; }
    if (!parsedInput.success) { res.status(400).json({ message: "Member profile details are invalid." }); return; }
    const actorUserId = req.authenticatedUser?.userId;
    if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try {
      const data = await useCase.updateProfile(parsedId.data, actorUserId, parsedInput.data);
      if (!data) { res.status(404).json({ message: "Member was not found." }); return; }
      res.status(200).json({ message: "Member profile saved.", data });
    } catch (error) { next(error); }
  });

  return router;
}
