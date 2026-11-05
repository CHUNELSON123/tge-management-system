# Public Pages backend module

This module owns anonymous endpoints used by the public website. `GET /api/public/home-previews` supplies bounded Home page previews. `GET /api/public/programmes` supplies the public programme browse list. `GET /api/public/events` separates published events into upcoming and past lists, `GET /api/public/events/:eventId` returns public details, `GET /api/public/gallery` returns admin-approved media, and `POST /api/public/events/:eventId/registrations` accepts guest registrations.

News is available at `GET /api/public/news` and `GET /api/public/news/:slug`. Both require `status: "published"` and `publishedAt <= now`; details use the same safe not-found response for missing, draft, and future-published slugs. The public DTO contains only ID, slug, title, summary, content, and publication date. It excludes author relations and the private featured-image storage key. News is ordered newest first. Category/tag filters, search, and pagination are omitted because the current News schema and approved PUB-01 contract do not define them.

Approved business browsing is mounted at `GET /api/public/businesses`, `GET /api/public/business-categories`, and `GET /api/public/businesses/:slug`. It uses stable name/ID ordering, bounded pagination, category/search filters, active plus approved status, and explicit public DTOs.

The shared footer and News sidebar include newsletter forms. `POST /api/public/newsletter-subscriptions` validates input and throttles submissions but returns HTTP 503 until TGE approves the provider or local persistence, consent, confirmation, and unsubscribe contract (PUB-13 / D8). `POST /api/public/contact-enquiries` similarly validates and throttles but returns HTTP 503 without storing the message until the contact handler, privacy wording, and persistence policy are approved (PUB-11 / D7). These routes deliberately do not write to existing tables based on an unapproved choice.

Keep public controllers, DTOs, use cases, and repository adapters in this module. Read the existing domain records rather than adding duplicate content models:

- `database/prisma/models/website.prisma`: public pages and news
- `database/prisma/models/programmes.prisma`: programmes
- `database/prisma/models/events.prisma`: events
- `database/prisma/models/business-directory.prisma`: business listings

The current query rules are fail-closed: programmes, events, and news must have `status: "published"`; news must have a publication date not later than now; events must have a publication status of published; businesses must have both `status: "active"` and `publicationStatus: "approved"`. Event DTOs contain only ID, title, type, description, start/end time, timezone, and venue. They omit meeting links, capacity, attendee registrations, assigned staff, and internal creator fields. Programme queries return only name, slug, description, and start/end dates; they never include cohorts or enrollments. These conservative literals are centralized in `application/public-content-policy.ts`. TGE-PUB-01 records the exact status vocabulary as an open decision (D4), so confirm the literals against the publishing workflow before production data is published. The schema has no locale fields, so this endpoint returns content in its stored language; the existing client translates interface labels only.

Gallery media must have `approvedAt`, `publicUrl`, and descriptive `altText`; its event must be published. The URL must use HTTPS and its hostname must be listed in `PUBLIC_MEDIA_HOSTS` (comma-separated). Admin media upload/approval UI belongs to the authenticated event-management workflow, not this anonymous module.

Guest registration requires a published upcoming event, open deadline, capacity, valid contact details, and consent. The API prevents duplicate active registrations by event and case-insensitive guest email, and stores `consentAcceptedAt` plus `consentVersion` (`EVENT_REGISTRATION_CONSENT_VERSION`, default `event-registration-v1`). Before production, TGE must approve the linked privacy/terms wording and retention period; no automatic deletion is configured until that period is approved. Event publishing status is currently the registration-open signal because the existing Event model has no separate registration setting.
