# TGE-ADM-12 — Business Directory Review Implementation

## Module and data source

The feature follows the existing admin portal module layers: presentation router and Zod DTOs, application use case, domain repository contract, and Prisma repository. The admin browser uses the matching admin-portal type, service, hook, and page pattern. Member listing changes stay in the member portal and resolve the owner from the authenticated account; the client never supplies an owner identity for member writes.

All business rows, category names, owner data, counts, and review history come from `Business`, `BusinessCategory`, `BusinessCategoryAssignment`, `BusinessReview`, and their related records. Empty database tables render zero counts and empty states. The UI does not fabricate views, trends, ratings, product lists, or activity records because the current schema has no source for them.

## Publication lifecycle

`Business.status` is operational status. `Business.publicationStatus` controls review and public visibility. The review command updates only publication status.

| Current publication status | Admin decision | Result | Reason |
| --- | --- | --- | --- |
| `pending_review` | `approved` | `approved` | Optional |
| `pending_review` | `rejected` | `rejected` | Required |
| `approved` | `suspended` | `suspended` | Required |
| `suspended` | `approved` | `approved` | Optional |

Rejected and draft records are not directly approvable. A member edit sets the publication status to `pending_review` and preserves existing `BusinessReview` records. Every admin decision appends a `BusinessReview` row with reviewer, decision, timestamp, and reason, and writes an audit entry. Updates use a status-guarded write to avoid overwriting a concurrent review.

The public business endpoints continue to return only records where operational status is `active` and publication status is `approved`. They select safe public fields and do not return `logoStorageKey`, `BusinessMedia.storageKey`, reviewer data, review comments, or audit data. Admin detail returns media captions and types only; storage keys are not included.

## Permissions and ownership

Admin list, detail, create, category/owner lookup, and review commands require the database-backed `businesses.manage` permission. The role seed grants it to System Administrator and Organisation Administrator. Run the existing role seed after updating the project to install this grant in an existing database.

Member business reads and writes require the Member role and use the authenticated user's `Member` relation. Updates verify the business belongs to that member. Members cannot change publication or operational status directly. Admin-created businesses are assigned to an active member and start in `pending_review`. Admin edits also return a listing to `pending_review`, preserve earlier review rows, and leave operational status unchanged.

## UI behavior

The desktop admin list uses a table and persisted summary cards; the mobile layout uses stacked business rows. Detail decisions display a reason form and operation-specific success/failure feedback. The member list supports owner-scoped add/edit forms and displays review state separately from operational state. Category selection uses database categories; an empty category table does not block saving a business, and the page does not invent category values.

