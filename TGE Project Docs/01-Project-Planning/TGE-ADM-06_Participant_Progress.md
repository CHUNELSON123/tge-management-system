# TGE-ADM-06 — Participant Progress

## Implementation contract

### Supported progress data

The current schema does not store lesson/module completion, assessments, certificates, attendance-based progress, or risk signals. The participant progress page therefore reports persisted cohort enrollment state only. It does not display a completion percentage, learning milestone, module tab, assessment tab, certificate tab, “not started” state, or “at risk” state.

| Display | Definition and source |
| --- | --- |
| Total Participants | Enrollment records associated with the selected cohort, including completed, withdrawn, and unrecognized legacy statuses. |
| Enrolled | Selected cohort enrollments whose persisted status is `enrolled`. |
| Completed | Selected cohort enrollments whose persisted status is `completed`; completion date comes from `Enrollment.completedAt`. |
| Withdrawn | Selected cohort enrollments whose persisted status is `withdrawn`. |
| Unrecognized Status | Existing enrollment records with a status outside the currently enforced vocabulary. They remain in the roster and total, cannot be transitioned through this screen, and are not silently counted in another category. |

Enrollment and completion dates come from `Enrollment.enrolledAt` and `Enrollment.completedAt`. No “last activity” date is inferred. A participant’s current status is not treated as a percentage of course work completed.

> **Policy status:** TGE-ADM-01 lists D6 (authoritative progress definitions and sources) and D4 (canonical enrollment statuses) as open decisions. This implementation limits the page to enrollment data and does not record either decision as formally approved.

### Roster query and actions

- The roster is selected by a persisted cohort ID and reads its `Enrollment` records. Search matches participant name or email; status filters accept only `enrolled`, `completed`, and `withdrawn`.
- The API limits each response to a validated page size and returns roster identity only on the protected admin participant endpoint.
- An authorized administrator can transition `enrolled → completed` or `enrolled → withdrawn`. Completed and withdrawn states are terminal in the current application lifecycle.
- The server rechecks the expected prior status during the write and records actor, previous status, next status, and time in `AuditLog`.
- All admin roster reads and enrollment writes require the server-side `programmes.manage` permission. The UI only hides actions for usability; it is not the authorization boundary.
- Export uses the same protected, cohort-scoped, filtered roster query. It contains participant name, email, enrollment status, and persisted enrollment/completion dates.

TGE-ADM-01 leaves member PII and export policy open (D7/G15). Until that policy is approved, the implementation limits export to the same `programmes.manage` permission as the roster and does not add phone numbers or other profile fields.

### Member and mentor access

This admin task adds no member or mentor cohort-roster endpoint. A member’s personal enrollment state continues to come only from records linked to that authenticated user’s `Member` record; the separately available published programme catalogue remains unchanged. The member mentorship query continues to scope records through that member’s mentorship assignments. Admin cohort roster responses are not reused by member-facing queries.

