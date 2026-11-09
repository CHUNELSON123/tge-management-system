# TGE-MEM-01 Member Portal Scope and Contracts

**Task:** TGE-MEM-01 — Confirm Member Portal Scope and Contracts  
**Status:** Scope inventory drafted; policy and service decisions require product-owner review  
**Branch:** `feature/TGE-MEM-01-confirm-member-portal-scope-contracts`  
**Review date:** 2026-11-08

## Purpose and outcome

This document maps the twelve supplied member-page designs to proposed frontend routes, existing domain records, current API coverage, required member-scoped contracts, and open product decisions. It is the TGE-MEM-01 scope artifact; it does not implement the member pages or approve new persistence, permissions, or workflow behavior.

The initial portal access baseline already enforced by authentication is an active, non-deleted account. Protected member endpoints must additionally verify the Member role and resolve the linked Member record from the verified session. Whether a member whose membership status is not `active` may enter the portal remains for TGE product-owner approval. Account status and membership status are separate fields and must never be changed implicitly together.

## Scope boundary

This inventory covers all supplied Member designs: Dashboard, Profile, Programmes, My Events, Event Details, Mentorship, Resources, Messages, Notifications, My Businesses, Settings, and Help & Support. Each page is represented as a task in the proposed Member sprint backlog.

The current client has only the role-routed `/portal` entry; the member-specific subroutes below are proposed. Current public read endpoints may serve public information, but they do not authorize member data. The repository currently has no member-scoped API module. New protected APIs must authenticate the request, verify the Member role and required permission, and derive the member identity from the authenticated user. They must not trust a client-supplied member ID.

Do not invent profile fields, dashboard metrics, records, or media to fill the designs. Reuse existing records when the model and access policy support the intended behavior. Keep controls disabled, omitted, or honestly unavailable until their API, storage, policy, and privacy contracts are approved.

## Current account, member, and authorization contract

### Existing identity data

`database/prisma/models/identity.prisma` defines:

- `User`: `id`, `roleId`, `email`, `passwordHash`, `firstName`, `lastName`, `phone`, `status`, `emailVerifiedAt`, `lastLoginAt`, `createdAt`, `updatedAt`, and `deletedAt`.
- `Member`: `id`, unique `userId`, optional unique `membershipNo`, optional `joinedAt`, string `membershipStatus` (default `active`), `createdAt`, and `updatedAt`.
- `User.memberProfile` is a one-to-one relation to `Member`; `Member.userId` is unique.
- `AccountStatus` is an enum: `PENDING_ACTIVATION`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`.
- `Member.membershipStatus` is a free-form string, not an enum. No allowed membership-status values or transition rules are enforced by the schema.

`server/src/common/middleware/authenticate.middleware.ts` accepts a valid, non-revoked bearer token and reloads a user whose account is `ACTIVE` and `deletedAt` is null. It loads the role from the database. It does not itself require the `Member` role or a linked `Member` record.

The account activation repository changes a successfully activated account from `PENDING_ACTIVATION` to `ACTIVE`. No administrator account-suspension/deactivation route or membership-status transition workflow was found in the current server API. Authentication rejects non-active accounts, but the permitted administrative transitions to `SUSPENDED` or `DEACTIVATED` are not specified by a production use case. `Member.membershipStatus` has no enum or transition validation.

`server/src/common/middleware/require-role.middleware.ts` checks permission grants by the authenticated user's role ID. Existing seeded Member grants are `profile.manage`, `resources.read`, `events.read`, and `mentorship.read`. No specific member permissions are currently defined for messages, notifications, business management, saved events, settings, or support submissions. Permission grants must not be broadened implicitly by a new route.

### Proposed portal access rule — approval required

For member-only routes, require all of the following:

1. Valid bearer session and non-revoked token.
2. Account status `ACTIVE` and `deletedAt` null, as enforced by the current authentication middleware.
3. Role name `Member` (or an explicit member permission with an approved role grant).
4. A `Member` row linked to the authenticated `User`.

The proposed initial behavior for non-active `membershipStatus` is to allow portal entry but display the status while TGE decides whether any membership state limits access to paid or cohort services. This is a proposal, not an approved rule; confirm it before implementing route guards or membership-gated actions. A missing linked Member profile should fail safely and should not create one automatically.

## Page and contract inventory

The route paths below are proposed. No member subroutes or member APIs currently exist unless identified in the Current API column.

| Supplied design | Proposed client route | Data mapping | Current API / gap |
| --- | --- | --- | --- |
| Member Dashboard | `/portal` | User display name; Member number, joined date, membership status. Counts could be derived from Enrollment, EventRegistration, MentorAssignment/MentoringSession, and Notification after status/date rules are agreed. There is no Certificate model. | The existing `/portal` page only restores the auth session and renders a role landing label. No dashboard API. |
| Member Profile | `/portal/profile` | User name/email/phone and Member number/joined date/membership status. Design fields such as birth date, gender, nationality, timezone, bio, profile photo, business profile completion, and professional details do not exist in the current User/Member schema. | Existing `GET /api/auth/session` returns session identity only. No member profile read/update API. |
| Member Programmes | `/portal/programmes` | Programme, Cohort, Enrollment, ProgrammeAssignment, CohortAssignment. Enrollment does not store lesson-level progress or next lesson; programme availability eligibility needs policy. | Public `GET /api/public/programmes` returns public programme fields only. No member enrollment API. |
| Member My Events | `/portal/events` | Event and EventRegistration linked to Member. Upcoming/past views can be derived from event dates and registration status after definitions are approved. There is no saved-event model. | Public `GET /api/public/events` lists public events; no member registration history or saved-event API. |
| Member Event Details | `/portal/events/:eventId` | Event and the current member's EventRegistration. Event has no ticket/QR, speaker, agenda, or explicit cancellation policy fields. | Public `GET /api/public/events/:eventId` omits member registration details. No member event-detail/registration action API. |
| Member Mentorship | `/portal/mentorship` | Mentor, MentorAssignment, MentoringSession, MentoringObjective, MentoringProgressRecord. Ratings, reviews, matching recommendations, and aggregate hours are not defined as member-facing contracts. | No member mentorship API. Existing permission `mentorship.read` can be reused only after ownership and field scope are defined. |
| Member Resources | `/portal/resources` | ResourceCategory, Resource, ResourceVersion, ResourceProgramme, ResourceCohort. Available resources depend on role, programme, cohort, and storage access rules. | No resource API was found in the current server routes. Existing `resources.read` permission is present but a route and safe download contract are not. |
| Member Messages | `/portal/messages` | Conversation, ConversationParticipant, Message, MessageAttachment. Conversation membership must scope all reads and writes; attachment delivery needs storage authorization. | No messaging API or specific member messaging permission. |
| Member Notifications | `/portal/notifications` | Notification and optionally Announcement/target relations. `readAt` supports unread/read state. Notification preferences have no current model. | No notification API or preference contract. |
| Member My Businesses | `/portal/businesses` | Business linked to Member; BusinessCategoryAssignment, BusinessReview, BusinessMedia. Profile views, inquiries, and growth percentages are not stored as analytics. | Public business list/detail routes exist and must remain public-field-only. No member-owned business management API or permission. |
| Member Settings | `/portal/settings` | Existing User identity and account status. Account password change exists. Notification preferences, privacy settings, appearance/timezone preferences, and member account deletion are not represented by approved APIs/models. | `POST /api/auth/password/change` exists behind authentication. No settings or account deletion API. |
| Member Help & Support | `/portal/help` | No dedicated FAQ/knowledge-base model was found. Existing ContactEnquiry model exists, but public contact submission currently returns 503 pending an approved handler and privacy contract. | No member help/support API. Public enquiry route is not approved for member support use and must not be silently reused. |

### Current API routes relevant to the portal

- Authentication: `GET /api/auth/session`, `POST /api/auth/logout`, and `POST /api/auth/password/change` are implemented. Reuse them; do not duplicate session or password behavior.
- Public programmes, events, event details, businesses, and categories exist under `/api/public/*`. These return public DTOs and are not member enrollment, registration-history, or management endpoints.
- Public event guest registration exists at `POST /api/public/events/:eventId/registrations`; do not treat it as the member's event-management API without an approved member registration workflow.
- Contact and newsletter endpoints currently return unavailable responses until their respective handling contracts are approved.
- There are no member-profile, member-dashboard, enrollment, registered-event, mentorship, resource, messaging, notification, business-management, settings, or support routes in the current server module.

## Proposed member API surface

These routes are planning placeholders, not implemented endpoints or final API contracts. Confirm DTOs, permission codes, validation, pagination, status filters, and errors in the implementation task before coding.

| Proposed route | Intended action | Minimum authorization/data boundary |
| --- | --- | --- |
| `GET /api/member/dashboard` | Read dashboard summary | Member role; derive User and Member from session; include only approved counts with agreed rules. |
| `GET /api/member/profile` | Read self profile | Member role; select explicit safe User and Member fields. |
| `PATCH /api/member/profile` | Update approved profile fields | Not enabled until self-edit whitelist, email verification consequences, uniqueness, and audit rules are approved. |
| `GET /api/member/programmes` | Read enrolled/completed/available programmes | Scope enrollment to linked Member; define availability and progress rules. |
| `GET /api/member/events` | Read upcoming/past/registered events | Scope EventRegistration to linked Member; saved filter requires approved storage. |
| `GET /api/member/events/:eventId` | Read event detail and own registration | Do not return other attendee details, staff-only values, or private meeting links. |
| `GET /api/member/mentorship` | Read own assignment/session summary | Scope through MentorAssignment.memberId; allowlist safe mentor/session fields. |
| `GET /api/member/resources` | Browse member-authorized resources | Require approved `resources.read` grant and resource-target policy; downloads must be authorized. |
| `GET /api/member/conversations` and `GET/POST /api/member/conversations/:id/messages` | Read conversations and send messages | Verify ConversationParticipant membership on each request; attachment policy/permissions require approval. |
| `GET /api/member/notifications` and `PATCH /api/member/notifications/:id` | Read and mark own notifications | Scope by authenticated `userId`; mark only own records; preferences require a separate contract. |
| `GET/POST /api/member/businesses` and `PATCH /api/member/businesses/:id` | Read/create/update own listings | Enforce Business.memberId ownership and admin approval/publication workflow; permission grant needs approval. |
| `GET /api/member/settings` and `PATCH /api/member/settings` | Read/update approved preferences | Only expose settings backed by an approved API/model. Existing password change remains under `/api/auth/password/change`. |
| `GET /api/member/help` and `POST /api/member/support-enquiries` | Read help content / submit a support request | Help content source, handler, privacy notice, retention, abuse control, and storage/provider must be approved first. |

## Open decisions and dependencies

| ID | Decision needed | Impact |
| --- | --- | --- |
| MEM-D01 | Does a non-active membership status prevent portal access, limit only particular services, or remain informational? Define allowed membership status values and transitions. Separately define who may suspend/deactivate a User account and the permitted account-status transitions. | Route access, dashboard badges, programme eligibility, and profile display. Account status remains independent. |
| MEM-D02 | Which profile fields can a member edit? Can email change be permitted, and if so, how are verification, uniqueness, and audit handled? | Profile form and `PATCH /api/member/profile`. |
| MEM-D03 | Which identity/contact fields may appear in the profile, messages, and other members' business views? | Privacy allowlists and DTOs. |
| MEM-D04 | Are saved events required? If yes, define lifecycle and persistence. | Current schema has no saved-event relation. |
| MEM-D05 | Are profile/programme completion and certificates in scope? Define the completion formula and certificate source. | Schema currently has no lesson progress or Certificate model. |
| MEM-D06 | Define programme availability, enrollment states, completion states, and any member eligibility rules. | Programme page and dashboard aggregates. |
| MEM-D07 | Define member event cancellation, ticket/QR, calendar, speaker, agenda, attendee privacy, and registration-status policies. | My Events and Event Details actions. |
| MEM-D08 | Define mentor discovery/matching, member visibility, scheduling/rescheduling, ratings, and session-hour calculation. | Mentorship dashboard and actions. |
| MEM-D09 | Confirm resource visibility, target rules, file storage, version access, and download URL lifetime. | Member Resources routes and DTOs. |
| MEM-D10 | Confirm message conversation creation, blocking/reporting, retention, attachment restrictions, and unread/presence behavior. | Messages API and UI. |
| MEM-D11 | Confirm notification categories and whether per-category preferences are required and where stored. | Notifications and Settings. |
| MEM-D12 | Confirm member business create/edit fields, ownership transfer, review workflow, public visibility, and allowed role permissions. | My Businesses write API and status controls. |
| MEM-D13 | Confirm supported settings and privacy controls; define account deletion or closure policy before exposing any destructive action. | Settings API and account lifecycle. |
| MEM-D14 | Identify help/FAQ content owner and approve support submission handler, privacy copy, retention, and abuse controls. | Help & Support page and API. |
| MEM-D15 | Confirm translation policy for member-generated or administrator-managed content. Existing bilingual support translates interface labels; current domain models do not provide a general locale contract. | Programme, event, resource, announcement, help, and message display. |

## Acceptance review

- [x] The scope inventory covers all twelve supplied Member designs and maps them to proposed client routes.
- [x] Account status and membership status are documented as distinct; current middleware behavior and the unresolved membership gating policy are stated.
- [x] Each design is mapped to existing models, current API coverage, and proposed service contracts or dependencies.
- [x] Profile editing, email changes, notification preferences, saved-event state, support handling, business actions, and account closure are recorded as decisions required before enabling controls.
- [x] UI-only profile fields, dashboard metrics, and model gaps are identified; no schema additions are authorized by this task.

## Next action

Review MEM-D01 through MEM-D15 with the product owner. Resolve the decisions needed for the page cards being committed to the sprint. Then freeze the API DTOs, permissions, and acceptance criteria before beginning implementation. The full page backlog remains proposed until the team estimates it against sprint capacity.

## Epic C implementation contract notes

- `GET /api/member/programmes` scopes enrollments through the authenticated user's linked `Member`. The member page separates `Enrollment.status = enrolled` from `Enrollment.status = completed`. Published programmes without one of those enrollments are shown as published catalogue entries for browsing only; this does not approve enrollment eligibility or create an enrollment action. Those remain subject to MEM-D06.
- Lesson progress and next-lesson values are omitted because the schema has no member learning-progress record. Available programme details link to the existing public programme browse page.
- `GET /api/member/events` returns only published events with the authenticated member's non-cancelled `registered` registration. Upcoming and past use the persisted `Event.startAt` against the current time. The Saved Events view is visibly unavailable because no saved-event persistence exists.
- `GET /api/member/events/:eventId` returns only a published event and the authenticated member's own non-cancelled registration. It does not return attendee lists, staff data, or meeting links. Ticket, cancellation, agenda, and speaker information remain unavailable pending MEM-D07; approved public gallery media may be shown when present.
- Calendar export preserves persisted `startAt`, optional `endAt`, and the event timezone when supplied; it does not infer a duration when no end time exists.
