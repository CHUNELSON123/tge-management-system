# TGE-ADM-10/11 — Mentorship Implementation Contract

## Scope and data

The admin mentorship module reuses `Mentor`, `Member`, `Programme`, `MentorAssignment`, `MentoringSession`, `MentoringObjective`, and append-only `MentoringProgressRecord` rows. Overview totals and detail screens come from these records. No sample mentor, member, assignment, session, rating, capacity, match score, or progress percentage is supplied by the UI.

## Current operations

- `GET /api/admin/mentorship/overview` lists persisted assignments and reports active mentor count, distinct members with active assignments, active matches, and completed session count.
- `GET /api/admin/mentorship/options` returns active mentor/member accounts and non-archived programmes for administrator assignment forms.
- `POST /api/admin/mentorship/assignments` creates an active assignment for an active, non-deleted mentor account and member account, and an optional existing non-archived programme. Repeating the same active mentor/member/programme combination returns a conflict. Creation records an audit entry.
- `GET /api/admin/mentorship/assignments/:id` returns the selected assignment, session records, objectives, and progress history.
- Session and objective creation use the schema defaults `scheduled` and `not_started` and record audit entries.
- `POST /api/admin/mentorship/objectives/:id/progress` appends a note, optional raw numeric value, actor, and timestamp and records an audit entry. No percentage interpretation is applied to the numeric value.
- `GET /api/admin/mentorship/mentors/:id` returns persisted mentor profile fields and related assignment summaries.

## Authorization and privacy

All routes require the server-side `mentorship.manage` grant. System and Organisation Administrators can access the organization-wide lists. A Mentor account is scoped to its own `Mentor` profile for assignment, session, objective, mentor-detail, and progress reads/writes. Mentors cannot query assignment options or create assignments. Client route hiding does not replace these server checks.

The member mentorship endpoint continues to select assignments by the authenticated member's `Member` record. It does not reuse admin roster responses and omits assignment notes, session notes/outcomes, and progress records. Admin/mentor detail DTOs include notes only after the server has applied the relevant assignment scope.

## Status and progress limitations

Mentorship status fields remain free-form in the schema and organization-wide transitions remain unresolved under TGE-ADM-01 D4. This implementation creates records with the existing model defaults and displays persisted status values; it does not introduce assignment/session/objective transition controls or claim that arbitrary status values are approved policy. Progress values are displayed as raw recorded values without a chart scale. Mentor availability is shown only when stored. Unsupported ratings, completion percentages, capacity, match scores, and delivered hours are omitted.
