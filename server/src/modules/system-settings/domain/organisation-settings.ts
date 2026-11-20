import { z } from "zod";
export const organisationSettingsSchema = z.object({
  name: z.string().trim().max(200),
  email: z.union([z.literal(""), z.string().trim().email().max(255)]),
  phone: z.string().trim().max(50),
  address: z.string().trim().max(500),
  allowPublicRegistration: z.boolean(),
}).strict();
export const defaultOrganisationSettings = { name: "", email: "", phone: "", address: "", allowPublicRegistration: true };
