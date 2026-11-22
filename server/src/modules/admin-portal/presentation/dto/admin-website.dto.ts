import { z } from "zod";
const slug = z.string().trim().min(1).max(280).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const title = z.string().trim().min(1).max(250);
const content = z.string().trim().min(1).max(100000).refine((value) => !/<\/?[a-z][^>]*>/i.test(value), "Content must be plain text until rich-text sanitization is approved.");
export const websiteIdSchema = z.string().uuid();
export const websiteContentQuerySchema = z.object({
  search: z.string().trim().max(150).optional(), type: z.enum(["page", "news", "blog", "testimonial", "faq", "media"]).optional(), status: z.enum(["draft", "published", "archived"]).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1), pageSize: z.coerce.number().int().min(1).max(25).default(10),
});
export const websitePageWriteSchema = z.object({ slug, title, content }).strict();
export const websiteNewsWriteSchema = z.object({ slug, title, summary: z.string().trim().min(1).max(500), content }).strict();
export const websiteEntryWriteSchema = z.object({ slug, title, summary: z.string().trim().max(500).optional(), content }).strict();
export const websiteTransitionSchema = z.object({ status: z.enum(["draft", "published", "archived"]) }).strict();
