import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionAccount } from "./account-lifecycle.js";

test("only active and suspended accounts can switch between those states", () => {
  assert.equal(canTransitionAccount("ACTIVE", "SUSPENDED"), true);
  assert.equal(canTransitionAccount("SUSPENDED", "ACTIVE"), true);
  assert.equal(canTransitionAccount("PENDING_ACTIVATION", "ACTIVE"), false);
  assert.equal(canTransitionAccount("DEACTIVATED", "ACTIVE"), false);
  assert.equal(canTransitionAccount("ACTIVE", "ACTIVE"), false);
});
