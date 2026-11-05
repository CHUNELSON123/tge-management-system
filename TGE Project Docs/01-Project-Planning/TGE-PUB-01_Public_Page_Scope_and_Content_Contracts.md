# TGE-PUB-01 Public Page Scope and Content Contracts

**Task:** TGE-PUB-01 — Confirm Public Page Scope and Content Contracts

**Status:** Contract review and implementation in progress; contact and newsletter submission contracts remain release dependencies

**Branch:** `feature/TGE-PUB-01-public-page-scope-content-contracts`

**Review date:** 2026-11-02

## Purpose and outcome

This document maps the supplied public-page designs to requirements, frontend routes, backend APIs, and Prisma models. It records the public content and submission contracts for the sprint. Implementation status and test steps are tracked in `TGE-Public-Pages-Sprint-Tester-Guide.md`.

The approved account-onboarding decision supports a public membership application that does not immediately create an account. Public read routes, guest event registration, business browsing, and membership application submission are implemented in the current working tree. Contact and newsletter forms have validation and honest unavailable states, but their backend handling remains disabled until the decisions in [Open decisions and dependencies](#open-decisions-and-dependencies) are approved. Existing content models still do not define an English/French content-storage contract.

## Scope boundary

This task covers public visitors browsing TGE information and submitting the public forms shown in the supplied designs. It includes identifying safe public data and API contracts for later tasks.

It does not include administrator content-management screens or CRUD, the member portal, new authentication flows, public social sign-in, anonymous gallery uploads, content entry, or unapproved database changes. Login, session restoration, account activation, password recovery, and access control reuse the existing authentication work.

## Public page inventory

The routes below map the supplied designs to the public page implementation. Route files re-export page components from the public-pages module. Contact and newsletter submission behavior remains gated by its handling contracts.

| Design / proposed route | Public content and actions | Data source and required contract | Responsive and English/French mapping |
| --- | --- | --- | --- |
| Home — `/` (`TGE-Homepage.png`) | Hero, TGE introduction, programme/event/news/business previews, public calls to action, newsletter form, shared header/footer. | Approved Home content plus public programme, event, news, and business summaries. Do not use sample counts or placeholder copy as production facts. A decision is needed on fixed frontend sections versus `Page` content because `Page.content` is an untyped text field. | Use the supplied desktop and mobile compositions. Translate interface labels via existing i18n; dynamic content needs a locale contract. |
| About Us — `/about` (`TGE-Aboutus.png`) | Organisation story, mission, vision, values, impact figures, and membership call to action. | Approved `Page` content or an agreed static source. Confirm approved wording and evidence for impact figures. | Match desktop/mobile design. Translate labels and obtain approved English/French body copy. |
| Programmes — `/programmes` (`TGE-Programme.png`) | Programme introduction/cards, approach steps, and calls to action. | Public query over published `Programme` records. Current fields: name, slug, description, status, start/end dates. Cohorts, enrollments, schedules, participants, and resources remain restricted/member features. | Cards and steps follow both supplied layouts. UI labels use existing i18n; programme copy needs localized records or an approved language fallback rule. |
| Events — `/events` (`TGE-Events.png`) | Upcoming/past event lists, event summaries, and links to detail pages. | Public query over published `Event` records. Current fields cover title, description, type, dates, timezone, venue/meeting URL, registration deadline, capacity, and status. A publication-state rule and public field allowlist are needed. | Match desktop/mobile list designs. No event should be presented as open for registration unless the event contract says it is open. |
| Event Details — `/events/:eventId` (`TGE-Event-Detail.png`) | Event description, date/time/location, agenda/speakers when available, related events, gallery, registration action. | `Event` plus explicitly public related data. Event has no slug, agenda model, published timestamp, or speaker profile relation; `EventStaffAssignment` identifies assigned users and staff roles only. Do not invent speaker details, attendance counts, or agenda items. | Preserve the selected event through links to registration/gallery. Localize UI; event copy must follow the approved locale strategy. |
| Event Gallery — `/events/:eventId/gallery` (`TGE-Event-Gallery.png`) | Read-only event images, event context, and any approved filters supported by actual metadata. | `EventMedia` has event ID, storage key, media type, and caption. There is no per-media approval state, alt-text field, or public visibility flag. Restrict visibility to assets approved for public display and associated with a public event. | Gallery adapts to mobile. The design’s “Upload Photos” action is hidden for anonymous visitors; upload permission is not part of public browsing. |
| Event Registration — `/events/:eventId/register` (`TGE-Event-Registration.png`) | Event summary, registration fields, privacy/consent text, validation, submission confirmation/errors. | A registration endpoint is absent. `EventRegistration` supports nullable `memberId` and guest name/email/phone, but permitted audiences and duplicate rules need agreement. Do not submit until the SRS conflict and consent/retention rules are resolved. | Follow both form layouts. Provide English/French UI and approved localized privacy copy. |
| News — `/news` and `/news/:slug` (`TGE-News.png`) | Article discovery, article reading, search/category/tag/sort/pagination controls as supported, and newsletter form. | Public read queries over published `News`. Current fields: slug, title, summary, body, image key, status, published date. No category/tag model exists in the current schema. Controls must be limited to agreed query capabilities. | Match list/article design at mobile and desktop. Translate controls; article content needs a locale strategy. |
| Business Directory — `/business-directory` (`TGE-Businessdirectory.png`) | Public search, categories/filters, approved listing cards, and member call to action. | Public query over approved and active `Business` records and approved categories. SRS FR-BIZ-13 requires approved listings only. The exact canonical approval condition must be agreed because the model has both `status` and `publicationStatus`, and reviews have their own `reviewStatus`. | Search/filter controls must work at mobile widths. Listing text and category labels need an agreed language behavior. Member CTA uses existing login/onboarding paths. |
| Business Details — `/business-directory/:slug` (`TGE-BusinessDirectory-Details.png`) | Public business overview, products/services/impact, gallery, and external contact/social links where approved. | Public business detail query. Current `Business` includes name, slug, description, logo, website, email, phone, address, status, and publication status; related categories, reviews, and media exist. Product/service/impact sections and social URLs are not represented in the current model. Do not expose private member data or review notes. | Use responsive details/gallery layout. Social/external links require validated URLs and an agreed public field allowlist. |
| Contact Us — `/contact` (`TGE-Contactus.png`) | Public contact details, enquiry form, privacy consent, and partner CTA. | `ContactEnquiry` model exists with name, email, subject, message, status, optional user and assignee. No public submission API is mounted. Phone and consent-record fields are absent. Approved contact values and handling/privacy rules are required. | Match mobile/desktop layouts; translate form feedback and approved consent wording. |
| Membership Application — proposed `/membership-application` (`TGE-Signup.png`) | Public application form; confirmation that an application was received. | Existing public `POST /api/membership-applications` contract accepts first name, last name, email, and optional phone. It creates a pending application, not a login account. Current controller returns the full application entity; the response should be narrowed to a safe receipt before the public form relies on it. | Adapt the supplied signup design to an application, not direct account/password creation. Translate the form and confirmation; reuse AUTH-03 after approval only. |

The following designs are references to existing authentication tasks, not additional public-page routes in this task: `TGE-Login.png`, `TGE-Forgotpassword.png`, `TGE-Resetpassword.png`, `TGE-Passwordresetsuccess.png`, `TGE-Emailverification.png`, and `TGE-Accessdenied.png`. Do not duplicate AUTH-03/04/05/09/10/12 behavior. Public social sign-in is omitted under the AUTH-01 decision.

## Current frontend and language behavior

The client contains Home, About, Programmes, Events, event detail/gallery/registration, News, business directory/detail, Contact, membership application, and the existing authentication/portal routes. The shared public shell provides desktop/mobile navigation, English/French interface labels, and the footer newsletter form. Contact and newsletter submissions return a generic unavailable state until their handling contracts are approved.

The existing English/French provider and message catalog already contain many shared navigation, login, footer, newsletter, and contact-placeholder labels. They do not provide all public-page copy. The language switch alone does not localize dynamic records: `Page`, `News`, `Programme`, `Event`, and `Business` currently have no locale or translation relation. A content-localization strategy is therefore a prerequisite to promising bilingual dynamic content. Do not add a second frontend language system.

## Backend contract inventory

### Existing contracts

| Method and route | Access | Current behavior | Contract note |
| --- | --- | --- | --- |
| `POST /api/membership-applications` | Public | Accepts `{ firstName, lastName, email, phone? }`; validates name/email/phone; creates a `PENDING` application; returns HTTP 201. | This supports the approved public application distinction. The response currently includes the full application record, including internal review/linkage fields. Recommend returning only a generic receipt and non-sensitive reference. Duplicate-email behavior and rate limiting are not explicit in this endpoint contract. |
| `POST /api/membership-applications/activate` | Public token submission | Activates an invited account using AUTH-03 behavior. | Authentication/onboarding flow; reuse it, do not reimplement as part of the public page contract. |
| `/api/auth/*` | Per existing endpoint | Login, session, logout, password change/recovery/reset, and related behavior exist. | Reuse existing agreed AUTH request/response contracts and pages. |

Mounted anonymous public APIs provide Home previews, published programmes, events and event details, approved event gallery media, guest event registration, published News, and approved business list/category/detail queries. Membership application submission remains in the auth module. Contact and newsletter POST routes validate inputs and apply basic request throttling, then return HTTP 503 without storing data because D7 and D8 are not approved. These POSTs must not be described as completed integrations.

### Proposed contracts for later implementation

These paths are recommendations for team review, not existing endpoints or approved API names. Keep API DTOs in the owning module and return only fields approved for public display.

| Method and proposed route | Access and purpose | Minimum response/input contract |
| --- | --- | --- |
| `GET /api/public/pages/:slug` | Anonymous; retrieve one published informational page. | Localized page title/body and approved metadata, or a consistent not-found response. |
| `GET /api/public/programmes` | Anonymous; list published programmes. | Paginated or bounded public summaries; no cohorts, enrollments, member records, or resources. |
| `GET /api/public/events` | Anonymous; list public events with agreed upcoming/past filters. | Public event summary fields and registration-open indicator derived from event policy. |
| `GET /api/public/events/:eventId` | Anonymous; retrieve one public event. | Public event details and explicitly public speaker/agenda information only. |
| `GET /api/public/events/:eventId/media` | Anonymous; retrieve public event media. | Approved media URLs, captions, and accessible text if available; no storage keys or private paths. |
| `POST /api/public/events/:eventId/registrations` | Anonymous only if guest registration is approved; otherwise authenticated member flow. | Validated event ID and only the participant fields permitted by the resolved policy; safe receipt, never an attendee record. |
| `GET /api/public/news` and `GET /api/public/news/:slug` | Anonymous; list/read published news. | Public article DTO; pagination/filter parameters only after category/tag/search behavior is agreed. |
| `GET /api/public/businesses` and `GET /api/public/businesses/:slug` | Anonymous; browse/detail approved listings. | Public business allowlist only; list supports agreed search/category/pagination. |
| `POST /api/contact-enquiries` | Anonymous; submit a contact message. | Validated name/email/subject/message and only any other approved field; generic receipt. |
| `POST /api/newsletter-subscriptions` | Anonymous; request subscription. | Email and consent source/confirmation behavior defined by the selected provider or approved local model; generic response. |

All anonymous GETs must filter on the canonical published/approved status in the backend; hiding records in the client is insufficient. Public error responses must not reveal drafts, review comments, attendee lists, storage keys, internal user IDs, or unpublished content. Public POSTs require server-side validation and agreed abuse controls. Specific status literals, pagination defaults, and error shapes should be settled with the owning module contracts before cards are implemented.

## Existing data model mapping

This mapping reflects the current checked-out Prisma model files. Several Prisma files are already modified in the working tree before this task began; these local edits are not changed by this review. Confirm the model definitions against the committed `develop` schema before treating uncommitted fields as a settled baseline.

| Model | Existing fields/relations useful to public pages | Gaps or restrictions to resolve |
| --- | --- | --- |
| `Page` | Slug, title, content, status, published timestamp. | No locale/translation, typed sections, hero media, SEO metadata, or explicit content type. Keep drafts private. |
| `News` | Slug, title, summary, content, featured image key, status, published timestamp. | No locale, category, tags, or public author DTO. Keep drafts and author-private fields private. |
| `Programme` | Name, slug, description, status, start/end dates. | No locale, summary/image, target audience, duration, or explicit public publication timestamp. Do not expose linked cohorts/enrollments. |
| `Event` | Title/description/type, date/time/timezone, venue/meeting URL, registration deadline/capacity/status, registrations, staff assignments, media. | No slug, publication timestamp, agenda or speaker profile model, explicit public registration policy, or event content locale. Meeting URL visibility is not automatically public. |
| `EventRegistration` | Event relation, optional member ID, guest name/email/phone, registration/attendance statuses and timestamps. | SRS audience conflict remains. No unique constraint for duplicate prevention, consent record, guest verification, or documented retention rule. Never return guest/attendee rows publicly. |
| `EventMedia` | Event relation, storage key, media type, caption. | No publication/approval flag, alt text, or ordering field. Storage key is internal; a safe media delivery contract is needed. |
| `Business` | Member relation, name/slug/description, logo key, website/email/phone/address, status and publication status; categories/reviews/media relations. | Canonical rule for approved + active is not agreed. No locale or explicit product/service/impact/social fields; avoid exposing member-private profile fields and review notes. |
| `BusinessCategory`, `BusinessCategoryAssignment` | Category names and business association. | Category publication/localization rules are undefined. |
| `BusinessMedia` | Business relation, storage key, media type, caption, sort order. | No asset visibility or alt-text field. Expose only approved media through safe URLs. |
| `ContactEnquiry` | Name, email, subject, message, status, optional user/assignee, timestamps. | No phone or consent/version record, and no mounted submission endpoint. Assignment/status are administrative only. |
| `NewsletterSubscription` | Unique email, status, subscribe/unsubscribe timestamps, consent source. | Provider, confirmation/double opt-in, unsubscribe, deletion, and delivery ownership are not selected. No mounted API. |
| `MembershipApplication` | Applicant name/email/phone, status, review metadata, optional linked account. | Public DTO should be limited to receipt; the UI cannot promise fields beyond the current endpoint without an approved contract change. |

No schema migration is proposed by TGE-PUB-01. Missing fields are recorded as contract/content gaps; any migration requires a separately reviewed design and approval.

## Publication and privacy rules proposed for agreement

1. Visitors may read public website content without an account, as recorded by AUTH-01.
2. Public page and news queries return only records whose approved publication state is public. Event publication and registration-open states need explicit rules before implementation.
3. The Business Directory returns only businesses that TGE has approved for publication and that remain active. The backend must enforce the filter. The exact fields/status values and how `BusinessReview.reviewStatus`, `Business.publicationStatus`, and `Business.status` combine need agreement.
4. Home-page summaries use the same visibility rules as their destination pages. No screenshots’ sample counts, attendee numbers, sample contact details, or sample records are production facts.
5. Public membership applications do not create an account, assign a role, grant a session, or enroll the applicant in a programme. Administrator review and the approved invite/activation process remain in effect.
6. Public gallery access is read-only. No anonymous photo upload action is available.
7. Each public response is an explicit DTO allowlist. Do not return credential data, private member fields, internal review history, guest registration rows, internal storage keys, or unapproved event meeting links.

## Open decisions and dependencies

| ID | Decision/dependency | Evidence and impact | Recommended next action |
| --- | --- | --- | --- |
| D1 | Choose the source of truth for the Home page and About content. | The `Page` model has slug/title/content but no section structure; the Home design combines multiple module previews. | Keep page layout in the frontend and use approved page copy plus module summary APIs, unless TGE wants CMS-managed page sections. Do not invent a JSON/page-builder schema in this task. |
| D2 | Approve how dynamic content is bilingual. | Existing client translations cover interface labels, but dynamic Page/News/Programme/Event/Business records have no locale fields or translation relation. | Choose localized records/translation relations and a locale request/response contract before dynamic pages commit; define fallback behavior. This may need a separately approved schema task. |
| D3 | Resolve event registration eligibility. | Updated SRS says administrators can register members and unregistered guests (`FR-EVT-08`) and members/public guests may register (`FR-EVT-10`). The older SRS says members register and does not agree on guest access. `EventRegistration.memberId` is nullable and guest fields exist, but that schema alone does not approve guest access. | TGE product owner confirms member-only versus guest-and-member registration, duplicate rules, capacity/deadline behavior, consent/retention, confirmation, and cancellation behavior. Update the authoritative SRS if required. |
| D4 | Agree canonical publication status values/filters for each data type. | Page/News/Programme/Event use free-text `status`; Event has no `publishedAt`. Business has `status`, `publicationStatus`, and review records. | Define publish/approved/suspended and event registration-open rules once with module owners; enforce them in backend queries. |
| D5 | Confirm public event detail/media data. | Event has no agenda or speaker-profile structure; EventMedia lacks per-asset approval and alt text. The design shows speakers, agenda, gallery, and event metrics. | Confirm which sections are content supplied elsewhere; omit unsupported data and sample figures. Define public media approval and serving rules before gallery work. |
| D6 | Confirm business profile data and approval workflow. | Products/services/impact and social links visible in the design are not represented in the current `Business` model excerpt; member contact fields may be sensitive. | Identify approved existing source fields and public contact choices. Extend schema only through a separate approval if required. |
| D7 | Select contact enquiry handling and consent wording. | A `ContactEnquiry` model exists, but no submission API; the model lacks phone/consent record. Official contact values and recipient/assignment behavior are not confirmed. | Confirm required fields, privacy text, recipients, retention, abuse protection, and whether current model suffices before exposing POST. |
| D8 | Select newsletter delivery/confirmation owner. | A local subscription model exists, but there is no API or documented provider, opt-in, unsubscribe, or retention behavior. | Choose the approved provider or local ownership and define consent, confirmation, unsubscribe, and duplicate response behavior before enabling subscribe. |
| D9 | Confirm content/assets and translations. | Designs contain example copy, metrics, contact/social details, images, and illustrative speakers. | Provide approved English/French copy, real media, social URLs, organization contact details, and any verified impact figures. |
| D10 | Narrow membership-application public response and settle duplicate behavior. | The existing route returns the complete application entity after submit; it accepts only first/last name, email, and optional phone. The design may suggest additional questions. | Reuse the existing application flow; have the owning AUTH task/API contract return a safe receipt and define duplicate/email behavior before the public form depends on it. |

## Dependencies for later public-page cards

- **TGE-PUB-02:** Use the existing bilingual provider and language switcher; expand public navigation to the agreed inventory. Do not create a second i18n mechanism.
- **TGE-PUB-03:** Depends on approved Home/About copy and the decision in D1; dynamic previews depend on the relevant public read APIs.
- **TGE-PUB-04:** Depends on programme public fields, publication filtering, and D2 locale handling.
- **TGE-PUB-05 to TGE-PUB-07:** Depend on D3–D5 and the event/read-registration API contracts.
- **TGE-PUB-08:** Depends on news publication, categories/tags/search scope, public read DTO, and D2.
- **TGE-PUB-09 to TGE-PUB-10:** Depend on the approved-business predicate, public field allowlist, media rules, and D6.
- **TGE-PUB-11:** Depends on D7 and the contact submission contract.
- **TGE-PUB-12:** Reuses existing `POST /api/membership-applications` and AUTH-03 onboarding; depends on D10 and the approved application form fields.
- **TGE-PUB-13:** Depends on D8 and a newsletter provider/API contract.
- **TGE-PUB-14:** Verifies the final agreed route, bilingual content, privacy, visibility, and form behavior across the above tasks.

## Acceptance review

- [x] The design inventory is mapped to a proposed route, visible content, actions, data source, and bilingual/responsive expectations.
- [x] Public visibility is defined as backend-enforced published content and approved business listings; unresolved status literals and predicates are listed as D4.
- [x] Membership application is separated from account creation and programme enrollment; the existing public endpoint and AUTH-03 handoff are identified.
- [x] Existing authentication pages and behavior are assigned to AUTH work and excluded from duplicate implementation.
- [x] API, schema, content, language, provider, privacy, event-policy, and approval dependencies are recorded.
- [ ] Product/technical owners approve the proposed contracts and close or explicitly defer D1–D10 before dependent implementation cards are committed.

## Reviewed sources

- `TGE Project Docs/01-Project-Planning/TGE_Sprint1_Public_Pages_Backlog.docx` and `TGE_Authentication_Authorization_Sprint_Backlog.docx`.
- `TGE Project Docs/TGE-AUTH-01_Account_Registration_and_Onboarding_Decision_Record.docx`.
- `TGE Project Docs/TGE Software Requirements Specification (SRS) - Updated.docx`, `TGE Project Docs/02-SRS/TGE SRS Document.docx`, and `TGE Project Docs/02-SRS/software-requirement-specification.md`.
- `TGE Project Docs/TGE Software Design Document (SDD) - Updated.docx`, `TGE Project Docs/03-SDD/TGE SDD Document.docx`, and `TGE Project Docs/03-SDD/software-design-document.md`.
- `TGE UI/TGE-Public-Pages-Design.pdf` and the individual images under `TGE UI/Public Pages/`.
- Current frontend route files, site header/footer, language messages/provider, server route mounts and auth API, and Prisma models for website, onboarding, programmes, events, and business directory.
