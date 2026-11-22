INSERT INTO "resource_categories" ("id", "name", "description")
VALUES
  (gen_random_uuid(), 'Guides', 'Guides and toolkits'),
  (gen_random_uuid(), 'Templates', 'Reusable templates and forms'),
  (gen_random_uuid(), 'Training Materials', 'Learning and training documents'),
  (gen_random_uuid(), 'Videos', 'Video learning resources'),
  (gen_random_uuid(), 'Webinars', 'Webinar recordings and materials'),
  (gen_random_uuid(), 'Articles', 'Articles and reference material')
ON CONFLICT ("name") DO NOTHING;
