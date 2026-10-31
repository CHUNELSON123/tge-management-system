import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

export type LoginDto = z.infer<typeof loginSchema>;
