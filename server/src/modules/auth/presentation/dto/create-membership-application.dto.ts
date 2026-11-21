import { z } from 'zod';

export const createMembershipApplicationSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(1).max(30),
  location: z.string().trim().min(1).max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10); }),
  gender: z.string().trim().min(1).max(50), nationality: z.string().trim().min(1).max(100),
  preferredLanguage: z.enum(["en", "fr"]).nullable().optional(), timezone: z.string().trim().max(100).nullable().optional(), bio: z.string().trim().min(1).max(250),
}).strict();

export type CreateMembershipApplicationDto = z.infer<
  typeof createMembershipApplicationSchema
>;
