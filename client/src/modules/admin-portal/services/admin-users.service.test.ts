import assert from "node:assert/strict";
import test from "node:test";
import { adminUsersService } from "./admin-users.service";

test("user list omits empty optional filters and sends selected pagination", async () => {
  const original = globalThis.fetch;
  let called = "";
  globalThis.fetch = async (input) => {
    called = String(input);
    return new Response(JSON.stringify({ data: { rows: [], total: 0, page: 1, pageSize: 10, summary: {} } }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    await adminUsersService.list("token", { search: "", roleId: "", status: "", page: 1, pageSize: 10 });
    const url = new URL(called);
    assert.equal(url.searchParams.has("roleId"), false);
    assert.equal(url.searchParams.has("status"), false);
    assert.equal(url.searchParams.get("pageSize"), "10");
  } finally { globalThis.fetch = original; }
});

