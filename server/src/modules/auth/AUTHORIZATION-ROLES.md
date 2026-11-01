# Authentication and role permission matrix

Protected API requests require a valid Bearer JWT and an active, non-deleted account. The server loads the role from the database and evaluates permission grants from `role_permissions`; frontend state does not grant authority.

| Role | Seeded permission set |
| --- | --- |
| System Administrator | User and role management, system management, audit viewing, member, programme, event, resource, mentorship, reporting, and website management |
| Organisation Administrator | User, member, programme, event, resource, mentorship, report, and website management |
| Member | Own profile management; read resources, events, and mentorship information |
| Mentor | Read assigned members; manage assigned mentorship and resources; read events |
| Trainer / Facilitator | Read assigned members; deliver programmes; manage resources; read events |

Role and permission seed data is maintained in `server/scripts/seed-roles.ts`. The account-creation and invitation endpoints additionally enforce permission `users.manage`. Public membership application and account activation routes remain public by design; the authenticated account-management routes and session APIs require a valid access token.

The initial role grants are the sprint's baseline and should be reviewed by TGE administrators before adding more protected feature APIs. Newly protected endpoints must select a permission code and enforce it on the server.
