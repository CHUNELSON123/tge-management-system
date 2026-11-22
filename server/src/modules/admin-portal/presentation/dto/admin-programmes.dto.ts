import { z } from "zod";

const uuid = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
});
const optionalText = (max: number) => z.string().trim().max(max).nullable();

export const programmesQuerySchema = z.object({ search: z.string().trim().max(100).optional(), status: z.enum(["draft", "published", "archived"]).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) }).strict();
export const cohortsQuerySchema = z.object({ search: z.string().trim().max(100).optional(), status: z.enum(["planned", "upcoming", "ongoing", "completed", "cancelled", "archived"]).optional(), programmeId: uuid.optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) }).strict();
export const participantProgressQuerySchema = z.object({ search: z.string().trim().max(100).optional(), status: z.enum(["enrolled", "completed", "withdrawn"]).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) }).strict();
export const programmeWriteSchema = z.object({
  code: optionalText(50), name: z.string().trim().min(1).max(200), slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(10000), programmeType: z.string().trim().min(1).max(100), targetAudience: z.string().trim().min(1).max(500), durationWeeks: z.number().int().positive().max(520),
  deliveryMode: z.string().trim().min(1).max(100), coverImageUrl: z.union([z.string().url().max(500), z.string().regex(/^\/api\/public\/website-media\/[0-9a-f-]{36}$/i)]).nullable(), learningObjectives: z.array(z.string().trim().min(1).max(500)).max(30), programContent: z.array(z.string().trim().min(1).max(1000)).min(1).max(50), eligibility: z.string().trim().min(1).max(10000),
  startDate: date, endDate: date,
}).strict().refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { message: "End date must be on or after the start date." });
export const cohortWriteSchema = z.object({ name: z.string().trim().min(1).max(150), startDate: date, endDate: date.nullable(), capacity: z.number().int().positive().max(100000).nullable() }).strict().refine((v) => !v.endDate || v.endDate >= v.startDate, { message: "End date must be on or after the start date." });
export const programmeStatusSchema = z.object({ status: z.enum(["published", "archived"]) }).strict();
export const cohortStatusSchema = z.object({ status: z.enum(["upcoming", "ongoing", "completed", "cancelled", "archived"]) }).strict();
export const enrollmentStatusSchema = z.object({ status: z.enum(["completed", "withdrawn"]) }).strict();
export const enrollMemberSchema = z.object({ memberId: uuid, feeId: uuid.nullable().optional() }).strict();
export const programmeStaffAssignmentSchema = z.object({ userId: uuid, assignmentRole: z.enum(["mentor", "trainer"]) }).strict();
export const programmeIdSchema = uuid;
