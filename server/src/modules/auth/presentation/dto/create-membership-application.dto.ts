import { z } from 'zod';

export const createMembershipApplicationSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30).nullable().optional(),
}).strict();

export type CreateMembershipApplicationDto = z.infer<
  typeof createMembershipApplicationSchema
>;
