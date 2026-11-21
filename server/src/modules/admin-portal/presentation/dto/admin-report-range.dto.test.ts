import assert from "node:assert/strict";
import test from "node:test";
import { adminDashboardQuerySchema } from "./admin-dashboard.dto.js";

test("report date ranges accept at most 366 inclusive UTC calendar dates", () => {
  assert.equal(adminDashboardQuerySchema.safeParse({ from: "2026-01-01", to: "2027-01-01" }).success, true);
  assert.equal(adminDashboardQuerySchema.safeParse({ from: "2025-12-31", to: "2027-01-01" }).success, false);
  assert.equal(adminDashboardQuerySchema.safeParse({ from: "2026-02-30", to: "2026-03-01" }).success, false);
});
