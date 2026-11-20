import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../common/middleware/require-role.middleware.js";
import type { ManageProgrammeRegistration } from "../application/manage-programme-registration.usecase.js";

const uuid = z.string().uuid();
const feeInput = z.object({ feeId: uuid.nullable() }).strict();
const reviewInput = z.object({ decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(1000).nullable().optional(), feeId: uuid.nullable().optional() }).strict();
const messages: Record<string, string> = { MEMBER_NOT_ELIGIBLE: "An active member account is required.", COHORT_NOT_OPEN: "This cohort is not open for registration.", COHORT_NOT_FOUND: "Foundation cohort not found.", COHORT_FULL: "This cohort is full. The request remains on the waiting list or pending.", ALREADY_ENROLLED: "You already have an enrollment in this cohort.", REQUEST_EXISTS: "A request for this cohort already exists.", REQUEST_NOT_FOUND: "Registration request not found.", REQUEST_NOT_PENDING: "This request is no longer awaiting a decision.", REASON_REQUIRED: "Enter a reason for rejection.", FEE_INVALID: "Select an active Foundation fee for members." };
function fail(error: unknown, res: import("express").Response, next: import("express").NextFunction) { if (error instanceof Error && messages[error.message]) { res.status(409).json({ message: messages[error.message] }); return; } if (typeof error === "object" && error && "code" in error && error.code === "P2002") { res.status(409).json({ message: "A registration or charge already exists." }); return; } next(error); }
export function createProgrammeRegistrationRouters(useCase: ManageProgrammeRegistration) {
  const member = Router(); const admin = Router();
  member.use(authenticate);
  member.use((req: AuthenticatedRequest, res, next) => { if (req.authenticatedUser?.roleName !== "Member") { res.status(403).json({ message: "Member access required." }); return; } next(); });
  member.get("/foundation/cohorts", async (req: AuthenticatedRequest, res, next) => { try { res.json({ data: await useCase.memberCohorts(req.authenticatedUser!.userId) }); } catch (error) { fail(error, res, next); } });
  member.post("/foundation/cohorts/:id/requests", async (req: AuthenticatedRequest, res, next) => { const id = uuid.safeParse(req.params.id); if (!id.success) { res.status(400).json({ message: "Invalid cohort." }); return; } try { res.status(201).json({ data: await useCase.request(req.authenticatedUser!.userId, id.data) }); } catch (error) { fail(error, res, next); } });
  member.post("/foundation/requests/:id/cancel", async (req: AuthenticatedRequest, res, next) => { const id = uuid.safeParse(req.params.id); if (!id.success) { res.status(400).json({ message: "Invalid request." }); return; } try { res.json({ data: await useCase.cancel(req.authenticatedUser!.userId, id.data) }); } catch (error) { fail(error, res, next); } });
  admin.use(authenticate, requirePermission("programmes.manage"));
  admin.get("/foundation/cohorts", async (_req, res, next) => { try { res.json({ data: await useCase.adminCohorts() }); } catch (error) { fail(error, res, next); } });
  admin.get("/foundation/cohorts/:id/requests", async (req, res, next) => { const id = uuid.safeParse(req.params.id); if (!id.success) { res.status(400).json({ message: "Invalid cohort." }); return; } try { res.json({ data: await useCase.requests(id.data) }); } catch (error) { fail(error, res, next); } });
  admin.put("/foundation/cohorts/:id/fee", async (req: AuthenticatedRequest, res, next) => { const id = uuid.safeParse(req.params.id); const input = feeInput.safeParse(req.body); if (!id.success || !input.success) { res.status(400).json({ message: "Invalid fee." }); return; } try { res.json({ data: await useCase.setFee(id.data, input.data.feeId, req.authenticatedUser!.userId) }); } catch (error) { fail(error, res, next); } });
  admin.post("/foundation/requests/:id/review", async (req: AuthenticatedRequest, res, next) => { const id = uuid.safeParse(req.params.id); const input = reviewInput.safeParse(req.body); if (!id.success || !input.success) { res.status(400).json({ message: "Invalid decision." }); return; } try { res.json({ data: await useCase.review(id.data, input.data.decision, input.data.reason ?? null, input.data.feeId, req.authenticatedUser!.userId) }); } catch (error) { fail(error, res, next); } });
  return { member, admin };
}
