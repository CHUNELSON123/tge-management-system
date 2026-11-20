import assert from "node:assert/strict";
import test from "node:test";
import { websiteContentQuerySchema, websiteEntryWriteSchema, websiteNewsWriteSchema, websitePageWriteSchema } from "./admin-website.dto.js";

test("website content requires a unique-form slug and plain-text body", () => {
  assert.equal(websitePageWriteSchema.safeParse({ slug: "about-us", title: "About Us", content: "Welcome" }).success, true);
  assert.equal(websitePageWriteSchema.safeParse({ slug: "About Us", title: "About Us", content: "Welcome" }).success, false);
  assert.equal(websitePageWriteSchema.safeParse({ slug: "about-us", title: "About Us", content: "<script>alert(1)</script>" }).success, false);
  assert.equal(websiteNewsWriteSchema.safeParse({ slug: "update", title: "Update", summary: "Short summary", content: "Plain text" }).success, true);
  assert.equal(websiteNewsWriteSchema.safeParse({ slug: "update", title: "Update", summary: "", content: "Plain text" }).success, false);
});

test("new content types are filterable and retain plain-text validation", () => {
  for (const type of ["blog", "testimonial", "faq", "media"]) assert.equal(websiteContentQuerySchema.safeParse({ type }).success, true);
  assert.equal(websiteContentQuerySchema.safeParse({ type: "unknown" }).success, false);
  assert.equal(websiteEntryWriteSchema.safeParse({ slug: "story", title: "A story", content: "Plain text" }).success, true);
  assert.equal(websiteEntryWriteSchema.safeParse({ slug: "story", title: "A story", content: "<script>bad</script>" }).success, false);
});
