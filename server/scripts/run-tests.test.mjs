import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const runner = fileURLToPath(new URL("./run-tests.mjs", import.meta.url));
for (const [name, url] of [
  ["missing target", ""],
  ["malformed URL", "invalid-private-credential"],
  ["remote host", "postgresql://user:private-password@production.example/tge_qa_test"],
  ["ordinary development database", "postgresql://user:private-password@localhost/tge_dev"],
  ["host override in query", "postgresql://user:private-password@localhost/tge_qa_test?host=production.example"],
  ["database override in query", "postgresql://user:private-password@localhost/tge_qa_test?dbname=production"],
]) {
  test(`test runner rejects ${name} before loading tests`, () => {
    const result = spawnSync(process.execPath, [runner], {
      encoding: "utf8",
      env: { ...process.env, TEST_DATABASE_URL: url },
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /No tests were started/);
    assert.equal(result.stderr.includes("private-password"), false);
    assert.equal(result.stderr.includes("invalid-private-credential"), false);
  });
}
