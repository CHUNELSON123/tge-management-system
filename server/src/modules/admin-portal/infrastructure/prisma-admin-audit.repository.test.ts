import assert from "node:assert/strict";
import test from "node:test";
import { safeAuditDetails } from "./prisma-admin-audit.repository.js";

test("audit detail output is an allowlisted summary and drops private fields", () => {
  assert.deepEqual(safeAuditDetails({ status: "ACTIVE", previousStatus: "SUSPENDED", password: "secret", token: "raw", content: "private", ipAddress: "127.0.0.1", permissionCount: 3 }), { status: "ACTIVE", previousStatus: "SUSPENDED", permissionCount: 3 });
  assert.deepEqual(safeAuditDetails(["sensitive"]), {});
});
