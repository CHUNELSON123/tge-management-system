# TGE-ADM-16 and TGE-ADM-17 — Reports, Settings, and Support

## Report range

Report dates are inclusive UTC calendar dates. The server converts the end date to the next UTC midnight and accepts at most 366 calendar dates. Data is freshly aggregated from operational tables; no derived totals are persisted. CSV export contains aggregate counts only, requires the reports.view permission, and records an audit event with actor and date range.

| Metric | Source and definition | Status rule | Date rule |
|---|---|---|---|
| Member Profiles | Count of Member profiles whose linked User is not soft deleted | Profile count; does not claim membership approval or account activation | All time snapshot |
| Active Member Accounts | Member-linked, non-deleted User count | `User.status = ACTIVE`; account state, not membership state | Current snapshot |
| Member Accounts by Status | Member-linked, non-deleted User counts | Raw AccountStatus values: ACTIVE, PENDING_ACTIVATION, SUSPENDED, DEACTIVATED | Current snapshot |
| Member Growth | Count of Member profiles grouped by `Member.joinedAt` month | Excludes deleted users and null joinedAt | Selected UTC date range |
| User Growth | Non-deleted user accounts grouped by creation month | Account creation count, not a cumulative historical total | Selected UTC date range |
| Programme Registrations | Enrollment and completion records grouped by month | Enrollments use enrolledAt; completions use completedAt | Selected UTC date range |
| Published Programmes | Programme count grouped by persisted status; snapshot card counts `published` | Current persisted programme status | Current snapshot |
| Enrollment Activity | Enrollment rows grouped by persisted status | Raw enrollment status; no target, completion ratio, or participant attainment is inferred | Selected range by `Enrollment.enrolledAt` |
| Published Events | Event count where status is `published` | Current public visibility literal | Selected range by `Event.startAt` |
| Event Registrations | EventRegistration rows grouped by registration status | Raw status values; all lifecycle values included and no guest/member details returned | Selected range by `registeredAt` |
| Active Mentorship Assignments | MentorAssignment count where status is `active` | Current assignment status | Current snapshot |
| Mentoring Sessions | MentoringSession rows grouped by status | Raw session statuses; no hours, scores, or completion rates inferred | Selected range by `scheduledStart` |
| Mentoring Objectives | MentoringObjective rows grouped by status | Raw objective statuses | Current snapshot |
| Active & Approved Businesses | Business count where operational status is `active` and publication status is `approved` | Both dimensions must match | Current snapshot |
| Businesses by Status | Business counts grouped separately by operational and publication status | Raw values remain separate | Current snapshot |
| Website Content | Page, News, blog, testimonial, FAQ and media counts grouped by type and persisted status | Draft, published, archived and any legacy values remain separate | Current snapshot |

## Explicitly excluded metrics

- The strategic plan's 2026 participant targets conflict (30 versus 45). The reports do not show a target chart, progress-to-target percentage, or variance until the population and approved target are resolved.
- No financial, business outcome, page-view/website-visit, top-content, profile-completion, unsupported attendance, rating, hours, or estimated impact metrics are displayed.
- CSV exports contain only the aggregate figures and status dimensions available on the report. They do not contain personal record rows.

## Settings and support

- Settings use the allowlisted, validated `organisation.settings.v1` record in `SystemSetting`. Organisation Administrators and users with `system.manage` can read and update it. Updates and their actor are recorded in the audit log. Organisation contact information is exposed through the public organisation endpoint and used in the footer. Public registration controls membership application creation, and defaults to enabled when no settings record exists.
- Time zone, date format, pagination, accessibility, email provider configuration, integrations, security controls, and backup/restore are unavailable until their corresponding behavior and services are implemented. No provider credentials or arbitrary settings are exposed.
- Help & Support stays inside the admin route. Knowledge base, FAQ, community, and support submission are marked unavailable because no approved content or handler exists. The page does not claim to accept a support request.
