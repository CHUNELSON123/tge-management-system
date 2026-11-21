import assert from "node:assert/strict";
import test from "node:test";
import { canReviewBusinessTransition } from "./business-review-lifecycle.js";

test("business review transitions match the publication lifecycle", () => {
  assert.equal(canReviewBusinessTransition("pending_review", "approved"), true);
  assert.equal(canReviewBusinessTransition("pending_review", "rejected"), true);
  assert.equal(canReviewBusinessTransition("approved", "suspended"), true);
  assert.equal(canReviewBusinessTransition("suspended", "approved"), true);
  assert.equal(canReviewBusinessTransition("rejected", "approved"), false);
  assert.equal(canReviewBusinessTransition("draft", "approved"), false);
  assert.equal(canReviewBusinessTransition("approved", "rejected"), false);
});
