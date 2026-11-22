# TGE-ADM-03 — Admin Dashboard Metric Definitions

## Data and date rules

- All dashboard metrics come from persisted database records. Design sample counts, percentage changes, names, avatars, chart points and activity entries are illustrative and are not seed values.
- The dashboard date filter is inclusive by calendar date, interpreted in UTC, and accepts ranges of up to 366 days. The API converts the end date to an exclusive next-day boundary.
- The date filter applies to published event counts, member-growth buckets, and recent record-creation activity. All-time operational totals, current account status, programme enrollment totals and the upcoming-events list are not constrained by the selected period; their labels make this distinction explicit.
- Every member-related query excludes users with `deletedAt` set. Aggregate responses contain no member names, email addresses, profile photos, or guest contact details.

## Metric and panel contracts

| Dashboard element | Definition / data source | Status or date rule |
|---|---|---|
| Total Members | Count of `Member` profiles linked to users without `deletedAt`. This is a profile count, not an active-account, active-membership or approved-application count. | All time. |
| Published Programmes | Count of `Programme` records with status `published`, matching the current public programme visibility rule. | Current snapshot; not filtered by dashboard date range. |
| Mentors / Trainers | Distinct active user IDs unioned from active `Mentor` profiles with active, non-deleted accounts and active, non-deleted users with the `Trainer / Facilitator` role. A person with both roles is counted once. | Current snapshot; `Mentor.status = active`, `User.status = ACTIVE`. |
| Events | Count of published events whose `startAt` falls within the selected inclusive UTC date range. | `Event.status = published`; range applies. |
| Member Businesses | Count of public-eligible listings, matching the public directory query: `Business.status = active` and `publicationStatus = approved`. | Current snapshot; not filtered by dashboard date range. |
| Member Growth | Count of member profiles by `Member.joinedAt` calendar month, excluding deleted accounts and null join dates. It measures newly joined profiles in each bucket, not cumulative account status or application submissions. | Selected UTC date range; chart includes zero-value months. |
| Programme Participation | Count of `Enrollment` rows in status `enrolled`, grouped under published programmes through their cohorts. It measures current enrollment, not lesson completion, cohort progress, or target attainment. | Current snapshot; does not inherit the date filter. |
| Member accounts by status | Counts of member-linked `User.status` enum values: `ACTIVE`, `PENDING_ACTIVATION`, `SUSPENDED`, `DEACTIVATED`. The display explicitly labels these as account statuses. | Current snapshot. Not membership or membership-application status. |
| Recent Activity | Most recent record creations in the selected period from member profiles, membership applications, programmes, events, resources, businesses and enrollments. The feed uses generic action labels and excludes person/guest identity. It does not claim to be a complete audit history or include updates. | Selected UTC date range, descending creation time, maximum eight items. |
| Upcoming Events | First three events at or after request time, sorted by start time and ID. | `Event.status = published`; independent of selected range. |

## Unresolved participant target

The strategic plan contains two different 2026 values:

- Axis 1 targeted result: “Reaching 30 active participants for the first full year.”
- KPI 11.1: “Active participants (all programs combined)” — 45 for 2026.

The plan does not establish whether these describe different populations or whether one value supersedes the other. TGE must confirm the single 2026 target and its population/measurement period before a target, target percentage, variance, or participant progress-to-target visualization is displayed. TGE-ADM-03 will show actual enrollment counts only; it will not show either target.

## UI state contract

- **Loading:** show a loading label/skeleton and do not retain values from a previous date range as if current.
- **Zero:** numeric cards and account-state counts show `0` when the query succeeds and the persisted count is zero.
- **Empty:** growth, programme participation, upcoming events and recent activity show a panel-specific “no records” message when the query succeeds with an empty list.
- **Unavailable:** target attainment and programme completion/progress percentages are not tracked by the current approved data/target contract; show a reason and no percentage.
- **Error:** show a dashboard-level retry message if the request fails; never substitute design examples or cached mock values.
