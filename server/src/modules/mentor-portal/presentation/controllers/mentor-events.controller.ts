import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import type { GetMentorEventsUseCase } from "../../application/use-cases/get-mentor-events.usecase.js";
export function createMentorEventsRouter(useCase: GetMentorEventsUseCase) { const router = Router(); router.get("/events", authenticate, async (req: AuthenticatedRequest, res, next) => { if (req.authenticatedUser?.roleName !== "Mentor") { res.status(403).json({ message: "Mentor access is required." }); return; } try { res.json({ data: await useCase.execute(req.authenticatedUser.userId) }); } catch (error) { next(error); } }); return router; }
