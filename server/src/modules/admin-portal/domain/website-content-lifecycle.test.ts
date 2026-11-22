import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionWebsiteContent } from "./website-content-lifecycle.js";

test("website content lifecycle permits only documented transitions", () => {
  assert.equal(canTransitionWebsiteContent("draft", "published"), true);
  assert.equal(canTransitionWebsiteContent("draft", "archived"), true);
  assert.equal(canTransitionWebsiteContent("published", "draft"), true);
  assert.equal(canTransitionWebsiteContent("published", "archived"), true);
  assert.equal(canTransitionWebsiteContent("archived", "draft"), true);
  assert.equal(canTransitionWebsiteContent("archived", "published"), false);
  assert.equal(canTransitionWebsiteContent("published", "published"), false);
  assert.equal(canTransitionWebsiteContent("unknown", "draft"), false);
});
