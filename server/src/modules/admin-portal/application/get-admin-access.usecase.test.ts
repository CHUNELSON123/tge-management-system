import test from "node:test";
import assert from "node:assert/strict";
import { GetAdminAccessUseCase } from "./get-admin-access.usecase.js";

test("admin access includes granted payment permissions without inventing grants", async () => {
  const useCase = new GetAdminAccessUseCase({ getPermissions: async () => ["reports.view", "payments.manage", "unknown.permission"] });
  assert.deepEqual(await useCase.execute("role"), ["reports.view", "payments.manage"]);
  const limited = new GetAdminAccessUseCase({ getPermissions: async () => ["reports.view"] });
  assert.deepEqual(await limited.execute("role"), ["reports.view"]);
});
