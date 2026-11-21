# TGE-ADM-14 and TGE-ADM-15 — User Access and Audit Implementation

## Users and roles

- Account rows exclude soft-deleted users and return only safe profile/account fields. Password hashes, password reset/activation token records, raw tokens, and credentials are never selected.
- Users with `users.manage` can filter against all role names and retrieve a listed user's stored photo through a protected endpoint. Invite role choices remain restricted separately by the actor's role. Search supports multi-word names, emails and roles.
- Invites and invite resends reuse the existing account invitation flow. The caller chooses only a role permitted by the current seed policy; the account owner sets their password through activation.
- `users.manage` protects user list/detail reads, invitation selection, invite resend, and `ACTIVE <-> SUSPENDED` status changes. Unsupported lifecycle transitions are rejected. A caller cannot change their own status.
- User role assignment and permission-grant changes require both `roles.manage` and the `System Administrator` role. Self-role changes are rejected. The `System Administrator` role cannot lose `roles.manage`.
- Role/status mutations record actor, action, entity, and limited before/after metadata in AuditLog. Email uniqueness remains enforced by the existing database unique constraint.

## Audit logs

- Only `audit.view` actors can query the read-only audit endpoints. The Organisation Administrator role is granted this permission alongside the System Administrator role. Date queries default to the last 30 days and any explicit start/end range is limited to 90 days. Page size is at most 50 and page number is bounded.
- Filters cover actor, action, entity type, date, and a bounded text search over action/entity identifiers. Actor lists are capped.
- The API returns actor display name (or `Former user` after actor deletion), action, entity type/ID, time, and only an allowlist of status/decision/count details. It omits IP address, secrets, credentials, tokens, free-form payloads, and full private details.
- AuditLog remains append-only through this UI; there are no update or delete endpoints. Existing `actor` relation uses `onDelete: SetNull`, preserving retained events.

## UI behavior

- User list, profile, invitation, status actions, role permissions, and audit search use persisted API data at desktop and mobile breakpoints.
- Role management entry points are shown only to callers whose access response includes `roles.manage`; server checks remain authoritative.
- Empty, loading, validation, conflict, and API error states are explicit. Audit export is limited to the visible bounded page and contains only the safe DTO fields.
