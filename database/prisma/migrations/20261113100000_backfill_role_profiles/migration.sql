INSERT INTO "members" ("id", "user_id", "membership_status", "joined_at", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", 'active', u."created_at", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u JOIN "roles" r ON r."id" = u."role_id"
WHERE r."name" = 'Member' AND u."deleted_at" IS NULL
  AND u."status" IN ('ACTIVE', 'PENDING_ACTIVATION')
  AND NOT EXISTS (SELECT 1 FROM "members" m WHERE m."user_id" = u."id")
ON CONFLICT ("user_id") DO NOTHING;

INSERT INTO "mentors" ("id", "user_id", "status", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u JOIN "roles" r ON r."id" = u."role_id"
WHERE r."name" = 'Mentor' AND u."deleted_at" IS NULL
  AND u."status" IN ('ACTIVE', 'PENDING_ACTIVATION')
  AND NOT EXISTS (SELECT 1 FROM "mentors" m WHERE m."user_id" = u."id")
ON CONFLICT ("user_id") DO NOTHING;
