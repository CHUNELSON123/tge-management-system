import { Router, raw } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminProgrammesUseCase } from "../../application/manage-admin-programmes.usecase.js";
import { cohortStatusSchema, cohortWriteSchema, cohortsQuerySchema, enrollMemberSchema, enrollmentStatusSchema, participantProgressQuerySchema, programmeIdSchema, programmeStaffAssignmentSchema, programmeStatusSchema, programmeWriteSchema, programmesQuerySchema } from "../dto/admin-programmes.dto.js";

export function createAdminProgrammesRouter(useCase: ManageAdminProgrammesUseCase): Router {
  const router = Router();
  const protect = [authenticate, requirePermission("programmes.manage")];
  const id = (value: unknown) => programmeIdSchema.safeParse(value);
  const actor = (req: AuthenticatedRequest) => req.authenticatedUser?.userId;
  const conflictMessages: Record<string, string> = {
    PROGRAMME_ARCHIVED: "An archived programme cannot be changed.",
    PROGRAMME_PATHWAY_FIXED: "The programme pathway cannot be changed after it has been assigned.",
    PROGRAMME_PATHWAY_HAS_HISTORY: "The programme code cannot be changed because it has enrollment history. Existing records need review before assigning a pathway.",
    FOUNDATION_REQUIRED: "The member must complete TGE Foundation before enrolling in this programme. Check that Foundation has its correct programme code.",
    SECOND_STAGE_REQUIRED: "The member must complete Young Entrepreneur or The Entrepreneur after Foundation before entering mentorship.",
    REQUIREMENTS_NOT_CONFIGURED: "Configure completion requirements before approving completion.",
    COMPLETION_REQUIREMENTS_NOT_MET: "Attendance and required deliverables must meet the current requirements before completion can be approved.",
    PROGRAMME_STATUS_CHANGED: "The programme status changed. Refresh and try again.",
    COHORT_ARCHIVED: "An archived cohort or programme cannot be changed.",
    COHORT_DATES_OUTSIDE_PROGRAMME: "Cohort dates must stay within the programme dates.",
    PROGRAMME_DATES_CONFLICT_WITH_COHORTS: "Programme dates cannot exclude an existing cohort.",
    CAPACITY_BELOW_ENROLLMENT: "Capacity cannot be lower than the number of currently enrolled participants.",
    COHORT_NOT_OPEN_FOR_ENROLLMENT: "This cohort is not open for enrollment.",
    COHORT_CAPACITY_REACHED: "This cohort has reached its capacity.",
    MEMBER_NOT_ELIGIBLE: "Only active members can be enrolled.",
    FOUNDATION_FEE_INVALID: "The cohort's configured fee is unavailable. Update its Foundation registration fee first.",
    COHORT_STATUS_CHANGED: "The cohort status changed. Refresh and try again.",
    ENROLLMENT_STATUS_CHANGED: "The enrollment status changed. Refresh and try again.",
    ASSIGNEE_NOT_ELIGIBLE: "Choose an active mentor or trainer account.",
    ASSIGNMENT_NOT_ACTIVE: "This staff assignment is already inactive.",
  };
  const handleError = (error: unknown, res: import("express").Response, next: import("express").NextFunction) => {
    if (error instanceof Error && (error.name.startsWith("Invalid") || error.name === "ProgrammeNotReadyForPublicationError" || Object.hasOwn(conflictMessages, error.message))) { res.status(409).json({ message: conflictMessages[error.message] ?? error.message }); return; }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") { res.status(409).json({ message: "A programme or cohort with this identifier already exists." }); return; }
    next(error);
  };

  router.get("/programmes", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = programmesQuerySchema.safeParse(req.query); if (!parsed.success) { res.status(400).json({ message: "Programme filters are invalid." }); return; }
    try { res.status(200).json({ message: "Programmes loaded.", data: await useCase.listProgrammes(parsed.data) }); } catch (error) { next(error); }
  });
  router.get("/cohorts", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = cohortsQuerySchema.safeParse(req.query); if (!parsed.success) { res.status(400).json({ message: "Cohort filters are invalid." }); return; }
    try { res.status(200).json({ message: "Cohorts loaded.", data: await useCase.listCohorts(parsed.data) }); } catch (error) { next(error); }
  });
  router.get("/assignable-staff", ...protect, async (_req: AuthenticatedRequest, res, next) => {
    try { res.status(200).json({ message: "Programme staff loaded.", data: await useCase.listAssignableStaff() }); } catch (error) { next(error); }
  });
  router.post("/programmes/cover-images", ...protect, raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "3mb" }), async (req: AuthenticatedRequest, res, next) => {
    const contentType = req.get("content-type")?.split(";")[0] ?? "";
    const data = req.body;
    const valid = Buffer.isBuffer(data) && data.length > 0 && ((contentType === "image/png" && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) || (contentType === "image/jpeg" && data[0] === 255 && data[1] === 216 && data[2] === 255) || (contentType === "image/webp" && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP"));
    if (!valid) { res.status(400).json({ message: "Choose a valid PNG, JPEG or WebP image up to 3 MB." }); return; }
    try { const url = await useCase.createCoverImage("Programme cover image", contentType, data, req.authenticatedUser!.userId); res.status(201).json({ message: "Cover image uploaded.", data: { url } }); } catch (error) { next(error); }
  });
  router.post("/programmes", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = programmeWriteSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsed.success) { res.status(400).json({ message: "Programme details are invalid.", issues: parsed.error.flatten() }); return; }
    if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { res.status(201).json({ message: "Programme created and published.", data: await useCase.createProgramme(parsed.data, actorUserId) }); } catch (error) { handleError(error, res, next); }
  });
  router.get("/programmes/:programmeId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = id(req.params.programmeId); if (!parsed.success) { res.status(404).json({ message: "Programme was not found." }); return; }
    try { const data = await useCase.getProgramme(parsed.data); if (!data) { res.status(404).json({ message: "Programme was not found." }); return; } res.status(200).json({ message: "Programme loaded.", data }); } catch (error) { next(error); }
  });
  router.patch("/programmes/:programmeId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.programmeId); const input = programmeWriteSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Programme was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Programme details are invalid.", issues: input.error.flatten() }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.updateProgramme(parsedId.data, input.data, actorUserId); if (!data) { res.status(404).json({ message: "Programme was not found." }); return; } res.status(200).json({ message: "Programme saved.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/programmes/:programmeId/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.programmeId); const input = programmeStatusSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Programme was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Programme status is invalid." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.transitionProgramme(parsedId.data, input.data.status, actorUserId); if (!data) { res.status(404).json({ message: "Programme was not found." }); return; } res.status(200).json({ message: `Programme ${input.data.status}.`, data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/programmes/:programmeId/assignments", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.programmeId); const input = programmeStaffAssignmentSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Programme was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Staff assignment details are invalid." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.assignProgrammeStaff(parsedId.data, input.data.userId, input.data.assignmentRole, actorUserId); if (!data) { res.status(404).json({ message: "Programme was not found." }); return; } res.status(200).json({ message: "Staff member assigned to programme.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/programmes/:programmeId/assignments/:assignmentId/deactivate", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.programmeId); const parsedAssignmentId = id(req.params.assignmentId); const actorUserId = actor(req);
    if (!parsedId.success || !parsedAssignmentId.success) { res.status(404).json({ message: "Programme assignment was not found." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.deactivateProgrammeStaff(parsedId.data, parsedAssignmentId.data, actorUserId); if (!data) { res.status(404).json({ message: "Programme assignment was not found." }); return; } res.status(200).json({ message: "Programme staff assignment deactivated.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/programmes/:programmeId/cohorts", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.programmeId); const input = cohortWriteSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Programme was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Cohort details are invalid.", issues: input.error.flatten() }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.createCohort(parsedId.data, input.data, actorUserId); if (!data) { res.status(404).json({ message: "Programme was not found." }); return; } res.status(201).json({ message: "Cohort created.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.get("/cohorts/:cohortId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = id(req.params.cohortId); if (!parsed.success) { res.status(404).json({ message: "Cohort was not found." }); return; }
    try { const data = await useCase.getCohort(parsed.data); if (!data) { res.status(404).json({ message: "Cohort was not found." }); return; } res.status(200).json({ message: "Cohort loaded.", data }); } catch (error) { next(error); }
  });
  router.get("/cohorts/:cohortId/participants", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.cohortId); const filters = participantProgressQuerySchema.safeParse(req.query);
    if (!parsedId.success) { res.status(404).json({ message: "Cohort was not found." }); return; }
    if (!filters.success) { res.status(400).json({ message: "Participant filters are invalid." }); return; }
    try { const data = await useCase.listParticipantProgress(parsedId.data, filters.data); if (!data) { res.status(404).json({ message: "Cohort was not found." }); return; } res.status(200).json({ message: "Participant progress loaded from enrollment records.", data }); } catch (error) { next(error); }
  });
  router.patch("/cohorts/:cohortId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.cohortId); const input = cohortWriteSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Cohort was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Cohort details are invalid.", issues: input.error.flatten() }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.updateCohort(parsedId.data, input.data, actorUserId); if (!data) { res.status(404).json({ message: "Cohort was not found." }); return; } res.status(200).json({ message: "Cohort saved.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/cohorts/:cohortId/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.cohortId); const input = cohortStatusSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Cohort was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Cohort status is invalid." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.transitionCohort(parsedId.data, input.data.status, actorUserId); if (!data) { res.status(404).json({ message: "Cohort was not found." }); return; } res.status(200).json({ message: "Cohort status updated.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/cohorts/:cohortId/assignments", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.cohortId); const input = programmeStaffAssignmentSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Cohort was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Staff assignment details are invalid." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.assignCohortStaff(parsedId.data, input.data.userId, input.data.assignmentRole, actorUserId); if (!data) { res.status(404).json({ message: "Cohort was not found." }); return; } res.status(200).json({ message: "Staff member assigned to cohort.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/cohorts/:cohortId/assignments/:assignmentId/deactivate", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.cohortId); const parsedAssignmentId = id(req.params.assignmentId); const actorUserId = actor(req);
    if (!parsedId.success || !parsedAssignmentId.success) { res.status(404).json({ message: "Cohort assignment was not found." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.deactivateCohortStaff(parsedId.data, parsedAssignmentId.data, actorUserId); if (!data) { res.status(404).json({ message: "Cohort assignment was not found." }); return; } res.status(200).json({ message: "Cohort staff assignment deactivated.", data }); } catch (error) { handleError(error, res, next); }
  });
  router.post("/cohorts/:cohortId/enrollments", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.cohortId); const input = enrollMemberSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Cohort was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Member details are invalid." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { res.status(201).json({ message: "Member enrolled.", data: await useCase.enrollMember(parsedId.data, input.data.memberId, actorUserId, input.data.feeId) }); } catch (error) { if (error instanceof Error && error.message === "COHORT_NOT_FOUND") { res.status(404).json({ message: "Cohort was not found." }); return; } handleError(error, res, next); }
  });
  router.post("/enrollments/:enrollmentId/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsedId = id(req.params.enrollmentId); const input = enrollmentStatusSchema.safeParse(req.body); const actorUserId = actor(req);
    if (!parsedId.success) { res.status(404).json({ message: "Enrollment was not found." }); return; } if (!input.success) { res.status(400).json({ message: "Enrollment status is invalid." }); return; } if (!actorUserId) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.transitionEnrollment(parsedId.data, input.data.status, actorUserId); if (!data) { res.status(404).json({ message: "Enrollment was not found." }); return; } res.status(200).json({ message: "Enrollment status updated.", data }); } catch (error) { handleError(error, res, next); }
  });
  return router;
}
