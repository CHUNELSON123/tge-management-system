import { z } from "zod";
export const adminBusinessIdSchema = z.string().uuid();
export const adminBusinessesQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  status: z.enum(["pending_review", "approved", "rejected", "suspended"]).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
export const adminBusinessReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
  reason: z.string().trim().max(5000).nullable().optional(),
}).superRefine((value, context) => {
  if ((value.status === "rejected" || value.status === "suspended") && !value.reason?.trim()) {
    context.addIssue({ code: "custom", path: ["reason"], message: "A reason is required for rejection or suspension." });
  }
});
export const adminBusinessWriteSchema = z.object({
  memberId: z.string().uuid(),
  name: z.string().trim().min(1).max(250),
  description: z.string().trim().max(20000).nullable().optional(),
  categoryIds: z.array(z.string().uuid()).max(20).default([]),
  address: z.string().trim().max(1000).nullable().optional(),
  websiteUrl: z.string().trim().url().max(1000).refine((value) => value.startsWith("https://"), "Use an HTTPS website URL.").nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
}).strict();
export const adminBusinessUpdateSchema = adminBusinessWriteSchema.omit({ memberId: true });
