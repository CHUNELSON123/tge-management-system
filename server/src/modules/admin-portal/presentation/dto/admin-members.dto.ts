import { z } from "zod";

const uuid = z.string().uuid();
const dateOfBirth = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
}).nullable().optional();
const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null).nullable().optional();

export const adminMembersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.string().trim().min(1).max(50).optional(),
  programmeId: uuid.optional(),
  cohortId: uuid.optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
}).strict();

export const adminMemberUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: optionalText(30),
  location: optionalText(255),
  dateOfBirth,
  gender: optionalText(50),
  nationality: optionalText(100),
  preferredLanguage: z.enum(["en", "fr"]).nullable().optional(),
  timezone: optionalText(100),
  bio: optionalText(250),
}).strict().refine((input) => Object.keys(input).length > 0);

export const adminDirectMemberSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(1).max(30),
  location: z.string().trim().min(1).max(255),
  dateOfBirth: dateOfBirth.refine((value) => !!value, "Date of birth is required."),
  gender: z.string().trim().min(1).max(50),
  nationality: z.string().trim().min(1).max(100),
  preferredLanguage: z.enum(["en", "fr"]).nullable().optional(),
  timezone: optionalText(100),
  bio: z.string().trim().min(1).max(250),
}).strict();

export const adminApplicationsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
}).strict();

export const rejectMembershipApplicationSchema = z.object({ reason: z.string().trim().min(1).max(2000) }).strict();

export const adminMemberIdSchema = uuid;
