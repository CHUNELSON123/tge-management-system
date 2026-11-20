# TGE core workflow implementation checklist

**Purpose:** Agree on and deliver the essential admin, member and mentor journeys before expanding the system.

**Status:** Working proposal for review with the project owner. This checklist records decisions already made in discussion; unchecked items are not claims of completion. Page dispositions are recommendations, not permission to remove pages. Update the checklist as work is implemented and verified.

**Source:** TGE Strategic Plan 2026–2028, sections 5–7 and 11, plus the project owner's decisions on progression, payments, communication, events and the business directory. Earlier discovery documents describe historical snapshots and should not be read as the current implementation status.

## Agreed rules

- [x] Every member must complete TGE Foundation before entering Young Entrepreneur or The Entrepreneur. No exception or administrative bypass.
- [x] A member must complete Young Entrepreneur or The Entrepreneur before a mentor can be assigned. No exception or administrative bypass.
- [x] The administrator can configure minimum attendance and required deliverables, with programme defaults and cohort overrides; completion also requires an administrator's decision.
- [ ] Payments will be accepted in the system and recorded manually. Until a real provider is selected, online payment is a clearly labelled simulation; no real card details, charges or claims of actual payment. A simulated success is test data only and must never be presented as a real payment or carry over as a real transaction.
- [ ] Members, mentors and admins can communicate at any time using text, audio and video, including with a person of the same role. Conversation and call data are accessible only to authorised participants. A contact/consent rule remains to be agreed.
- [ ] Members can submit businesses for review; approved, eligible listings appear in the public business directory.
- [ ] The pitch competition is an event, not a separate competition module for this scope. Public events remain open to visitors when configured for public participation.
- [ ] Newly issued access tokens have a 14-day lifetime. An account's application decision, membership status and login activation status are separate concepts.
- [ ] Implement changes using the existing feature-module approach: frontend pages/components/hooks/services/types; backend presentation/validation, application, domain and infrastructure; Prisma models and reviewed migrations when persistence changes. Enforce permissions and workflow rules on the server, not only in the UI.

## What “working” means

For each item, all relevant role interfaces, API operations and database records must agree. Verify successful actions, validation, access restrictions, empty/loading/error states, duplicate submissions and the effects on connected public/member/mentor views. A green page or successful read alone is not an end-to-end pass. Use real persisted records for live information; clearly label test or simulated data.

## Workflow checklist

### 1. Application, invitation and account activation

**Roles:** Visitor, administrator, member, mentor.

**Current baseline:** Public membership applications, admin approval/rejection, direct member registration, role-based invitations, activation and sign-in exist. Account creation now reports a failed invitation separately from the created account. Real delivery and the complete journeys still require verification against the configured mail service.

**Task 2 verification:** Database-backed HTTP tests cover application, approval, rejection and reapplication, member creation with a simulated email failure and resend, mentor invitation, activation, login and suspended-account protection. They use isolated temporary accounts and mock email delivery. Real provider delivery, browser journeys and the dedicated mentor experience remain to be verified; the mentor portal is planned for its own phase.

- [ ] Visitor can submit an application and sees a clear confirmation without gaining access before approval.
- [ ] Administrator can find, approve or reject the application and see the recorded decision.
- [ ] Approval creates the intended member profile and a pending-activation account, and sends an invitation or clearly reports that delivery failed.
- [ ] Administrator can directly create a member or invite a mentor; duplicate email and forbidden role choices are rejected without creating duplicate records.
- [ ] Member/mentor can activate with a valid single-use invitation, set a password and sign in to the correct role experience; expired or reused invitations fail clearly.
- [ ] Administrator can resend an invitation after delivery failure. Confirm the actual delivery configuration without sending test mail to real people.
- [ ] Role changes and account activation produce the required Member or Mentor profile and preserve existing history.
- [ ] Sign-out and suspended/deactivated account access behave correctly; new access tokens expire after 14 days.
- [ ] Test the frontend, endpoints, persisted records, email failure and duplicate-submission outcomes for all three roles.

### 2. Programmes, cohorts and progression

**Roles:** Administrator, member; mentor reads assigned delivery context where appropriate.

**Current baseline:** Admin programme/cohort, staff assignment, enrollment and completion operations and member programme reads exist. Prior testing verified draft/public programme visibility. The agreed mandatory Foundation and second-stage prerequisites are not yet enforced as a complete workflow.

**Task 3 update:** New programmes are published immediately on creation, as requested; existing drafts remain drafts until published. The three strategic templates use reserved programme codes when created or saved through the admin form. Existing records have not been silently recategorised. Cohort dates, capacity and staff are configurable, and member programme records show their own cohorts.

**Task 4 update:** Enrollment, mentorship creation and reassignment now enforce recorded prerequisites on the server. A qualifying second-stage enrollment must start after Foundation completion and have a recorded completion time. Existing records are preserved; missing pathway codes, completion timestamps or evidence of the required order do not unlock progression. On the reviewed local database there were no active mentorship assignments, and The Entrepreneur had not yet been created. Completion criteria remain a separate task; the current recorded completion decision is the existing admin action.

- [ ] Identify Foundation, Young Entrepreneur and The Entrepreneur in durable programme data; do not depend on a display name that can be edited.
- [ ] Admin creates/edits programme and cohort, dates, capacity and responsible staff.
- [ ] Published programme information is visible on the public site; drafts and archived programmes are not.
- [ ] Member can see applicable programmes and their own cohort, dates, resources, progress and status.
- [ ] Agree and implement how a member requests a place or an admin enrolls them; prevent duplicate enrollment and enforce capacity.
- [ ] Server refuses all second-stage enrollment attempts until Foundation completion is recorded. Cover UI, direct API calls, role changes and existing records; no bypass.
- [ ] Server refuses mentorship assignment until a qualifying second-stage completion is recorded. Cover UI, direct API calls and reassignment; no bypass.
- [ ] Explain unmet prerequisites to the administrator and member; do not rely only on disabled buttons.
- [ ] Define how historical or already-enrolled records are assessed against these mandatory rules without silently changing or deleting them.

### 3. Admin-configured progress and completion

**Roles:** Administrator configures and records; member views their own progress; mentor sees only the authorised assignment context.

**Current baseline:** Programme defaults and cohort overrides can define minimum attendance and required deliverables. Admins record attendance as sessions attended and total sessions, record each required deliverable, and approve completion only after the current requirements are met. Members can view their recorded requirements and progress.

**Change policy:** Requirements apply to existing enrollments. Changing the effective requirements requires a fresh admin completion decision. Until requirements have ever been configured for the applicable cohort, untouched historical completed records retain their existing decision; no new completion can be approved without configured requirements. Previously completed records remain in history and show that review is needed when current requirements or approval no longer match. An existing assignment is not silently removed when eligibility changes, but new assignments and reassignments are blocked until prerequisites are met again.

- [x] Agree which criteria an admin may configure, such as attendance, deliverables, minimum values or an explicit completion decision, and whether criteria apply to a programme or a cohort.
- [x] Admin can set and review criteria before using them; changes have a clear effect on existing participants and an audit history.
- [x] Admin can record and correct participant progress and completion, with validation and attribution. A completion decision can be removed and later reapproved without erasing the recorded history.
- [x] Member sees the same applicable requirements, recorded progress and completion result.
- [x] Only a valid recorded completion unlocks the next stage. Test incomplete, complete, correction and attempted bypass cases.
- [ ] Do not invent percentages or claim a requirement is met without persisted evidence and a defined rule.

### 4. Fees and payment records

**Roles:** Administrator configures/reconciles; member sees and pays their own charges.

**Current baseline:** An admin can configure USD (default), CAD, EUR or GBP fees for membership, programmes and events, assign a fee to a member or guest, and record or correct a manual payment. Members can see their own charges and perform a labelled card-payment simulation; simulation records never reduce the real balance. Fee amounts and eligibility are not prefilled because the strategic plan contains conflicting statements. Fee assignment is manual and does not automatically occur during application, programme enrollment or event registration. A real provider and final fee policy are not yet selected.

- [ ] Define chargeable items, amount, currency, due dates and when payment affects registration; resolve the strategic plan's inconsistent fees with the client.
- [x] Admin can configure fees and see a member's payment history and outstanding amounts.
- [x] Build a clearly marked test-only online payment simulation with success, pending and failure outcomes. It must not request or store real card numbers, security codes or other real card credentials.
- [x] Build a manual recording flow with amount, currency, method, date, reference and recording administrator; define correction and duplicate handling. Manual records can be voided with a reason and remain in history; references and duplicate charges are checked.
- [ ] Separate simulated transactions from manual and future real provider transactions in storage, UI, totals and exports. Storage, UI and balances are separated; payment exports and a real-provider integration are not yet implemented.
- [ ] Define receipt, refund, cancellation and reconciliation behaviour before connecting a provider.
- [ ] When a provider is selected, add server-side provider confirmation, idempotency and secure processing; test provider sandbox separately before real payments.

### 5. Mentor onboarding and mentorship

**Roles:** Administrator assigns; mentor delivers; member participates.

**Current baseline:** Mentor accounts/profiles and admin assignment, session, objective and progress records exist. A dedicated mentor portal is still to be built from the principal designs supplied later. The hard second-stage prerequisite and quarterly report workflow are not yet established.

**Task 11 update:** The mentor portal, prerequisite checks, and admin assignment workflows now exist. An assignment's objectives, progress notes, session outcomes and quarterly reports are visible to its member, assigned mentor and administrators; administrator-only assignment notes are excluded from mentor and member views. Mentors and administrators can maintain objectives, sessions and reports for active assignments. Only an administrator can mark an assignment completed; its completion date and shared history remain available. A report is unique per assignment and quarter, and editing it is explicit. The programme progression and role-scope integration tests pass. The existing reassignment updates the assigned mentor in place, with the former mentor recorded in the audit log; a dedicated cancellation workflow and a separate immutable report-revision history are not part of this update.

- [ ] Mentor accepts an invitation, activates their account and manages their profile, expertise and availability.
- [ ] Admin sees eligible active mentors and eligible members and can create an assignment only after the member completes a second-stage programme.
- [ ] Prevent duplicate active assignments according to the agreed policy; keep attribution and history when reassigned.
- [ ] Mentor sees assigned members and only the records needed for their work; member sees their own assigned mentor and agreed information.
- [ ] Mentor and/or admin records objectives, meetings and progress according to agreed permissions; member sees the authorised information.
- [ ] Produce and retain the quarterly progress report described in the strategic plan; agree its fields and who can view it.
- [ ] Define completion, cancellation and reassignment of mentorship and preserve history.
- [ ] Verify the admin-to-mentor-to-member flow with both eligible and ineligible members.

### 6. Shared messaging and audio/video calls

**Roles:** Member, mentor and administrator, including conversations between people with the same role.

**Current baseline:** Member-side text and WebRTC signalling code exists, but the messaging controller requires the Member role. The full cross-role experience and production call reliability are not established. Current signalling uses in-memory state and the client specifies a STUN server; this does not establish reliable calling across all networks or server instances.

- [ ] Agree who can discover/contact whom, whether a recipient can block or accept a request, and conversation/message retention.
- [ ] Allow permitted users of any of the three roles to create or open a conversation and exchange text at any time, including member-to-member and mentor-to-mentor.
- [ ] Restrict every conversation, message and call to its authorised participants; test non-participant access.
- [ ] Support call initiation, incoming notification, accept, decline, end, microphone/camera permissions and understandable failure/retry states for audio and video.
- [ ] Select and configure signalling and any relay infrastructure needed for deployment; test separate devices, networks, disconnections and server restarts.
- [ ] Test member↔mentor, member↔member, mentor↔mentor and admin↔each role. The user must be told if a call fails; never show an unconnected call as successful.

### 7. Events

**Roles:** Administrator, member and public visitor where the event is public.

**Current baseline:** Admins can create, publish and cancel events and manage registrations and attendance. Published events appear in public and member listings. Guests can register publicly; members can register or cancel from their own account with consent, creating an account-linked registration. Registration checks share a transaction lock for capacity and duplicate checks. The pitch competition uses the normal event workflow.

- [x] Admin creates and publishes an event; drafts stay private and published events show the correct public/member information.
- [x] Support the Black History Month event and pitch competition as events; public visitors can participate where the event is open to all.
- [x] Implement the member registration path so the member's own registration is associated with their account and visible in their portal; guest registrations are not automatically linked.
- [x] Enforce registration deadline, capacity, duplicates and cancellation; admin sees the resulting attendee list.
- [x] Admin can record attendance and see accurate registration and attendance states separately.
- [ ] Test publication, registration, visibility, cancellation and any payment requirement across all applicable roles.

### 8. Member business directory

**Roles:** Member owns listing, administrator reviews, public visitor browses approved listings.

**Current baseline:** Member business submission and editing, admin review and public approved/active business reads exist. The full connected lifecycle still needs an end-to-end test.

- [ ] Member can create and edit only their own business and submit it for review.
- [ ] Admin can find the submission, approve it or reject it with an appropriate reason; review decisions are attributed.
- [ ] Only active and approved listings are publicly visible. Pending, rejected or suspended listings remain non-public.
- [ ] Member sees status and review outcome and can correct/resubmit where allowed.
- [ ] Editing an approved listing follows the agreed re-review policy and does not expose unreviewed changes publicly.
- [ ] Test the full member submission → admin decision → public listing → member update/review cycle.

### 9. Cross-cutting experience and operational checks

- [ ] Complete French and English translations for all essential admin, member and mentor screens, validation messages and empty/error states.
- [ ] Language selection is available in the mobile header and at bottom right on desktop; verify on actual screen sizes.
- [ ] Admin, member and mentor menus provide access to their essential pages on mobile and desktop.
- [ ] Organisation Administrator can edit the supported organisation settings; implement additional settings only when their actual behaviour and service exist. Do not make inactive controls appear operational.
- [ ] Audit log is accessible to authorised administrators, shows relevant changes and does not expose credentials, tokens or private payloads.
- [ ] Reports use defined, persisted data; do not confuse simulated payments with actual revenue.
- [ ] Resolve existing project-wide frontend lint failures and verify the production build, including font/dependency availability.

## Page review: initial recommendations

These are starting recommendations based on the current route inventory, not a decision to delete functionality. Evaluate each page against the workflow when its task is implemented.

| Area / current pages | Recommendation | Reason and follow-up |
| --- | --- | --- |
| Public application, login, activation and account recovery | **Keep and correct** | Essential onboarding; verify email delivery, errors and role routing. |
| Admin members, applications, new member, member details/edit/programmes | **Keep and review for combination** | Needed for membership decisions and progress. Determine whether member programme history belongs within member details instead of a separate destination. |
| Admin programmes, programme details/forms, cohort details and participant progress | **Keep and review for combination** | Needed for configuration, enrollment and completion. Avoid duplicating progress across pages; enforce prerequisites in the backend. |
| Member dashboard, profile, programmes and mentorship | **Keep and correct** | Essential member journey; show real eligibility, assigned cohort, mentor and authorised progress. |
| Admin mentorship overview, assignment, assignment details and mentor details | **Keep and correct** | Needed for eligibility, assignment and oversight; add report/status workflow and avoid duplicating mentor-facing work. |
| Mentor pages | **Implement from principal designs** | No full dedicated mentor portal currently exists. Add supporting views only when a required action needs them. |
| Admin events, event form/details, registrations and attendance; member/public events | **Keep and review for combination** | Needed for events; consider registrations and attendance as views within event details if this reduces duplication. Pitch competition remains an event. |
| Member businesses, admin businesses/details, public directory | **Keep and correct** | Required client addition; verify ownership, review and public visibility end to end. |
| Member messages and call interface | **Keep and extend** | Existing implementation is member-scoped. Move toward shared authorised messaging/calls for all three roles and same-role conversations. |
| Admin users/roles, audit and essential settings | **Keep and simplify** | Needed for accounts, permissions and accountability. Keep unsupported settings visibly unavailable until implemented; do not create fake controls. |
| Admin dashboard and reports | **Keep essential views; defer unsupported metrics** | Report real programme, mentorship, event, business and payment outcomes. No sample values or simulated transactions as real revenue. |
| Website content and resources | **Keep essential publishing/resource actions** | Retain what supports public information and programme materials; review advanced categories against real operational needs. |
| Admin and member help/support | **Postpone expansion** | Existing support surfaces include unavailable content/handlers. Decide actual support process before building a larger system. |
| Advanced analytics, third-party integrations, automatic backups and other non-core settings | **Postpone unless explicitly prioritised** | They do not block the agreed initial member journey; implement real services before enabling controls. |

## Ordered work and acceptance gates

1. **Checklist review and agreement:** confirm page recommendations and remaining decisions below.
2. **Accounts and invitations:** all three role onboarding paths work and errors correctly report persisted outcomes.
3. **Programme rules and admin-configured completion:** Foundation and second-stage restrictions are enforced server-side without exception.
4. **Simulated and manual payments:** records are auditable and simulated results cannot be mistaken for real payments.
5. **Connected member/admin flows:** programmes, events, resources and business review produce the expected public/member results.
6. **Mentor module:** implement the principal designs supplied by the project owner and complete assignment, sessions, progress and quarterly reporting.
7. **Shared messaging and calls:** support all required role combinations with participant-scoped access.
8. **Language, audit, settings and reporting:** finish essential supporting features and remove misleading/unavailable controls only when replaced by working behaviour.
9. **Final integrated verification and user handoff:** execute the test scenarios below and record results and unresolved issues.

Each gate is complete only after relevant frontend, backend, database and cross-module tests pass. The order of detailed tickets can be adjusted when a dependency requires it; mandatory progression rules cannot be relaxed.

## Later test-account handoff

**Timing:** After the mentor module and the essential connected flows are ready for user acceptance testing, create dedicated **admin, member and mentor test accounts** and give the project owner their sign-in details through an appropriate secure channel. Do not create or send credentials now.

- [ ] Confirm the test environment and use test-only accounts and clearly labelled test records; do not use real customer data or real card details.
- [ ] Create one account for each role with the appropriate permissions and test prerequisites. Provide sign-in addresses, temporary credentials or activation instructions, and the environment URL securely; do not commit secrets to the repository.
- [ ] Explain any expiry, reset or cleanup instructions and who can access the test environment.
- [ ] Give the owner a role-by-role test guide with steps, expected outcomes and a way to report an issue.
- [ ] Include the full scenario: application/activation → Foundation → second-stage completion → eligible mentor assignment → messaging and audio/video calls → business submission/review/public listing → event registration.
- [ ] Include rejection scenarios: unfinished Foundation, unfinished second-stage programme, unauthorised access, failed invitation, failed/simulated payment and rejected business.
- [ ] Confirm the owner can actually sign in and perform the scenarios before calling the handoff complete.

## Decisions still needed

- What exact criteria and thresholds can admins configure for completion, and do they apply per programme or cohort?
- Which provider, supported countries/currencies, fee amounts, refund and reconciliation policies will be used for real payments? These do not block a clearly isolated simulation.
- Can users contact any other user immediately, or must the recipient accept or block contact requests?
- Which mentorship notes and quarterly report fields are visible to the member, mentor and administrator?
- How should existing participants whose histories do not yet demonstrate the new mandatory prerequisites be reviewed and corrected?
- How are public event registrations linked to an authenticated member, and which events require fees?
