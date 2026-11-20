# TGE-ADM-05 — Programme and Cohort Management

## Implementation contract

The admin programme module uses the existing `Programme`, `Cohort`, `Enrollment`, `ProgrammeAssignment`, and `CohortAssignment` records. Counts are computed from those related records. No dashboard-only or programme-only copies of participant data are created.

### Status transitions

The admin API accepts only the transitions below. Status writes use compare-and-set checks so a stale request cannot move a record from a newer status. Successful changes record the administrator, action, previous status, and new status in `AuditLog`.

| Record | Allowed transitions | Terminal state |
| --- | --- | --- |
| Programme | `draft → published`, `draft → archived`, `published → archived` | `archived` |
| Cohort | `planned → upcoming`, `planned → cancelled`, `planned → archived`; `upcoming → ongoing`, `upcoming → cancelled`, `upcoming → archived`; `ongoing → completed`, `ongoing → cancelled`, `ongoing → archived`; `completed → archived`; `cancelled → archived` | `archived` |
| Enrollment | `enrolled → completed`, `enrolled → withdrawn` | `completed`, `withdrawn` |

Archiving changes the record status and does not delete programmes, cohorts, enrollments, or assignment links. Archived programmes and cohorts cannot receive new cohorts, edits, or new staff assignments. Enrollment history remains available on the participant views.

Publishing a draft requires a description, programme type, target audience, at least one content item, and eligibility details. Programme and cohort dates remain optional; publishing does not require a cohort to exist.

> **Policy status:** TGE-ADM-01 records the organization-wide vocabulary and transition decision as open (D4). These are the transitions currently enforced by the application and the existing admin implementation; this note does not mark D4 as formally accepted. Confirm them with the TGE policy owner before treating them as organizational policy.

### Visibility

- Public programme lists include records whose programme status is `published`, matching the existing public-page query.
- The member catalogue includes published programmes. A member's persisted enrollment history remains visible if its programme is later archived.
- Draft and archived programmes are not offered as new member catalogue options.
- Publishing does not automatically publish cohorts; cohort lifecycle status remains separate from programme visibility.

The existing public/member code uses `published` as its visibility rule. TGE-ADM-01 D4 still calls for formal status-policy confirmation.

### Metric definitions

The four list-page summary values use all persisted programmes and cohorts, regardless of status:

| Display | Definition and source |
| --- | --- |
| Total Programmes | Count of `Programme` records. |
| Total Cohorts | Count of `Cohort` records. |
| Enrolled Members | Distinct `memberId` values on `Enrollment` records with status `enrolled`. |
| Completed Members | Distinct `memberId` values on `Enrollment` records with status `completed`. |

On each programme row, enrolled and completed totals count distinct members within that programme. Cohort rows count persisted enrollment records in their respective status; the database unique key allows one member enrollment per cohort. Withdrawn enrollments are excluded from both metrics. The two member totals may overlap if a person has separate current and completed cohort enrollments.

Dates are displayed from persisted programme/cohort date fields. An unset optional date is shown with an explicit placeholder; no date is inferred from current time or a mock cohort.

### Staff assignments

- Only active, non-deleted accounts with the `Mentor` or `Trainer / Facilitator` role can be assigned through this module.
- Programme and cohort assignment endpoints require `programmes.manage` on the server.
- Deactivation sets the assignment status to `inactive`; it does not delete the row. Reassigning the same person and role reactivates the existing unique relation and writes a new audit entry.
- Assignment changes record the actor and assignment details in `AuditLog`.

### Validation and access

- Programme and cohort payloads are validated with strict Zod DTOs; date ranges, lengths, URLs, positive capacities, and status values are checked before writes.
- Cohort dates must remain inside the programme's configured date range. Capacity cannot be reduced below the current enrolled count.
- Programme/cohort reads and writes use the server-side `programmes.manage` permission. Client-side control visibility is only a usability layer.
- Aggregate responses return counts only and omit participant identity/contact fields. Participant identity is returned only on the authorized cohort participant views.

