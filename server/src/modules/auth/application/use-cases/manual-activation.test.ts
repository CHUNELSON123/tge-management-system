import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { CreateAccountActivationTokenUseCase } from "./create-account-activation-token.usecase.js";
import type { AccountActivationTokenRepository } from "../../domain/repositories/account-activation-token.repository.js";

test("manual activation tokens are hashed and do not verify email", async () => {
  let revoked = "";
  let created: { userId: string; tokenHash: string; verifiesEmail?: boolean; expiresAt: Date } | undefined;
  const repository = {
    async revokeActiveByUserId(id: string) { revoked = id; },
    async create(input: typeof created) { created = input; return {} as never; },
    async findValidByTokenHash() { return null; },
    async activateAccount() {},
  } as AccountActivationTokenRepository;
  const result = await new CreateAccountActivationTokenUseCase(repository).execute("member-id", false);
  assert.equal(revoked, "member-id");
  assert.equal(created?.verifiesEmail, false);
  assert.equal(created?.tokenHash, createHash("sha256").update(result.token).digest("hex"));
  assert.notEqual(created?.tokenHash, result.token);
  assert.equal(created?.expiresAt, result.expiresAt);
});
