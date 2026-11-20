# TGE-ADM-13 — Website Content Implementation

## Architecture

- Admin routes use the existing admin layout, browser-token gate, route guard, module pages, typed services, application use case, repository contract, Prisma adapter, DTO validation, and permission middleware.
- `website.manage` protects list, read, write, publish, unpublish, archive, and restore operations.
- Page, News, WebsiteEntry (blog, testimonial, FAQ), and WebsiteMedia rows are the source of truth. New records begin as drafts. Allowed transitions are `draft -> published|archived`, `published -> draft|archived`, and `archived -> draft`.
- Publishing writes the current timestamp. Unpublishing and archiving clear it. Public delivery requires `status = published` and `publishedAt <= now`.
- Edits keep the current status and record the updater. Page uses `updatedByUserId`; News gained a nullable updater relation and migration. Each mutation writes an AuditLog entry containing the actor, action, entity, and limited status/slug metadata.

## Content safety and scope

- Title, slug, summary, and body are validated. Slugs are unique lowercase kebab case. News summaries are limited to 500 characters.
- Editor content is plain text. React renders it as text, which escapes markup. The API rejects HTML tags. The media library stores PNG, JPEG and WebP images up to 3 MB in the database; uploads validate file signatures. Admin preview requires website.manage and the public media endpoint only serves published images.
- Public Page DTOs return only ID, slug, title, body, and publication time. They never include author IDs, updater IDs, storage keys, or drafts. Public News retains its existing safe DTO/query.
- Draft preview is rendered locally from the current editor fields; it is not a public route and is not stored as a separate version.
- Published blog posts, testimonials and FAQs are delivered via /blog, /testimonials and /faqs. Blog details use /blog/:slug. The public website entry API excludes drafts, archived entries and future publication times.

## Verification notes

- The News updater migration is additive and nullable, preserving existing authors and records.
- The schema has no locale, structured blocks, page template, scheduled publication state, or content version table. Those features remain out of scope pending approved contracts.
