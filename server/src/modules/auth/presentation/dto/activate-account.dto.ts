import { z } from "zod";

export const activateAccountSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
}).strict();

export type ActivateAccountDto = z.infer<typeof activateAccountSchema>;
