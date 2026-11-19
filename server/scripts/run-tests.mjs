import { randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const serverDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let databaseUrl;
try {
  databaseUrl = new URL(process.env.TEST_DATABASE_URL ?? "");
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname) ||
    !/^\/tge_qa_[a-z0-9_]+$/.test(databaseUrl.pathname) ||
    !["", "?schema=public"].includes(databaseUrl.search) ||
    databaseUrl.hash !== ""
  ) {
    throw new Error("Unsafe test database target");
  }
} catch {
  console.error("Set TEST_DATABASE_URL to a disposable local PostgreSQL database named tge_qa_<suffix>. No tests were started.");
  process.exit(1);
}

const testFiles = [];
for (const directory of ["src", "../client/src"]) {
  const root = resolve(serverDirectory, directory);
  for (const file of await readdir(root, { recursive: true })) {
    if (file.endsWith(".test.ts")) testFiles.push(resolve(root, file));
  }
}
testFiles.sort();
if (testFiles.length === 0) throw new Error("No test files found.");

const result = spawnSync(process.execPath, [
  fileURLToPath(import.meta.resolve("tsx/cli")), "--test", ...testFiles,
], {
  cwd: serverDirectory,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl.href,
    JWT_SECRET: randomBytes(48).toString("hex"),
    CLIENT_URL: "http://localhost:3000",
  },
});
if (result.error) console.error("Unable to start the test runner.");
process.exit(result.status ?? 1);
