import test from "node:test";
import assert from "node:assert/strict";
import { GetAdminReportsUseCase } from "./get-admin-reports.usecase.js";
import type { AdminReportsData, AdminReportsRepository } from "../domain/admin-reports.repository.js";

test("export produces escaped aggregate CSV and records the actor and date range", async () => {
  const range = { from: new Date("2026-01-01T00:00:00Z"), toExclusive: new Date("2026-02-01T00:00:00Z") };
  const data = { range: { from: "2026-01-01", to: "2026-01-31", timezone: "UTC" }, snapshot: { totalUsers: 3 }, programmesByStatus: [{ status: '=HYPERLINK("bad")', count: 1 }] } as AdminReportsData;
  let audit: unknown;
  const repository: AdminReportsRepository = { load: async () => data, recordExport: async (actor, dates) => { audit = { actor, dates }; } };
  const csv = await new GetAdminReportsUseCase(repository).export(range, "actor-1");
  assert.match(csv, /"snapshot","totalUsers","3"/);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
  assert.deepEqual(audit, { actor: "actor-1", dates: range });
});

test("export fails if audit logging fails", async () => {
  const repository = { load: async () => ({ range: { from: "a", to: "b" }, snapshot: {} }), recordExport: async () => { throw new Error("audit unavailable"); } } as unknown as AdminReportsRepository;
  await assert.rejects(new GetAdminReportsUseCase(repository).export({ from: new Date(), toExclusive: new Date() }, "actor"), /audit unavailable/);
});

