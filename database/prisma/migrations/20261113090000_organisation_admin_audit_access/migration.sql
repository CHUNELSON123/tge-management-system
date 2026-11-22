INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'Organisation Administrator' AND p."code" = 'audit.view'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
