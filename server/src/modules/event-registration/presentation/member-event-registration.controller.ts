import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { ManageEventRegistrationUseCase } from "../application/manage-event-registration.usecase.js";

export const registrationMessages: Record<string, string> = { EVENT_NOT_FOUND: "Event not found or registration unavailable.", REGISTRATION_NOT_REQUIRED: "Registration is not required for this event.", REGISTRATION_CLOSED: "Registration for this event is closed.", REGISTRATION_EXISTS: "A registration already exists for this email and event.", EVENT_FULL: "This event is full.", MEMBER_NOT_ACTIVE: "An active membership is required to register.", CANCELLATION_CLOSED: "Registration cannot be cancelled after the event starts.", REGISTRATION_NOT_FOUND: "Your active registration was not found." };
export function sendRegistrationError(error: unknown, res: import("express").Response, next: import("express").NextFunction) {
  if (error instanceof Error && registrationMessages[error.message]) { res.status(["EVENT_NOT_FOUND", "REGISTRATION_NOT_FOUND"].includes(error.message) ? 404 : 409).json({ message: registrationMessages[error.message] }); return; }
  void next;
  res.status(503).json({ message: "Registration could not be completed. Please try again later." });
}
export function createMemberEventRegistrationRouter(useCase: ManageEventRegistrationUseCase) {
  const router = Router();
  router.post("/events/:eventId/registrations", authenticate, async (req: AuthenticatedRequest, res, next) => {
    const id = z.string().uuid().safeParse(req.params.eventId), body = z.object({ consent: z.literal(true) }).strict().safeParse(req.body);
    if (!id.success || !body.success) { res.status(400).json({ message: "Accept the event terms and privacy notice." }); return; }
    if (req.authenticatedUser?.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try { res.status(201).json({ message: "Registration confirmed.", data: await useCase.registerMember(id.data, req.authenticatedUser.userId) }); } catch (error) { sendRegistrationError(error, res, next); }
  });
  router.post("/events/:eventId/cancel-registration", authenticate, async (req: AuthenticatedRequest, res, next) => {
    const id = z.string().uuid().safeParse(req.params.eventId);
    if (!id.success) { res.status(404).json({ message: "Event not found." }); return; }
    if (req.authenticatedUser?.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try { await useCase.cancelMember(id.data, req.authenticatedUser.userId); res.json({ message: "Registration cancelled.", data: { cancelled: true } }); } catch (error) { sendRegistrationError(error, res, next); }
  });
  return router;
}
