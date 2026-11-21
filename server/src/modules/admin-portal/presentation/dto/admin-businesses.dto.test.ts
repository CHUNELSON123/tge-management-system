import assert from "node:assert/strict";
import test from "node:test";
import { adminBusinessReviewSchema } from "./admin-businesses.dto.js";

test("reject and suspend decisions require a reason", () => {
  assert.equal(adminBusinessReviewSchema.safeParse({ status: "rejected" }).success, false);
  assert.equal(adminBusinessReviewSchema.safeParse({ status: "suspended", reason: " " }).success, false);
  assert.equal(adminBusinessReviewSchema.safeParse({ status: "rejected", reason: "Missing required details" }).success, true);
});

test("approval and restoration may include an optional reviewer note", () => {
  assert.equal(adminBusinessReviewSchema.safeParse({ status: "approved" }).success, true);
  assert.equal(adminBusinessReviewSchema.safeParse({ status: "approved", reason: "Verified" }).success, true);
});
