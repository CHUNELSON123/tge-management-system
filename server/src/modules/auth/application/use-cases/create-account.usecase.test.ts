import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { CreateAccountUseCase } from "./create-account.usecase.js";

test("account creation stores a pending account and sends a one-time activation invitation", async () => {
  const originalActivationUrl = process.env.ACTIVATION_URL;
  process.env.ACTIVATION_URL = "https://tge.example.org/activate-account";
  let createdInput: Record<string, unknown> | undefined;
  let sentEmail: { to: string; html: string } | undefined;
  const user = { id: "user-1", email: "member@example.org", status: "PENDING_ACTIVATION", passwordHash: "stored-hash", firstName: "Member" };
  const repository = {
    findByEmail: async () => null,
    findRoleNameById: async () => "Member",
    create: async (input: Record<string, unknown>) => { createdInput = input; return user; },
  };
  const activation = { execute: async () => ({ token: "one-time-activation-token", expiresAt: new Date("2030-01-01T00:00:00Z") }) };
  const email = { sendEmail: async (message: { to: string; html: string }) => { sentEmail = message; } };
  try {
    const result = await new CreateAccountUseCase(repository as never, activation as never, email as never).execute({
      firstName: " Member ", lastName: " User ", email: " MEMBER@EXAMPLE.ORG ", phone: " ", roleId: "member-role",
    }, { roleName: "System Administrator" });

    assert.equal(result.user.status, "PENDING_ACTIVATION");
    assert.equal(createdInput?.email, "member@example.org");
    assert.equal(createdInput?.firstName, "Member");
    assert.equal(createdInput?.phone, null);
    assert.match(String(createdInput?.passwordHash), /^\$2[aby]\$12\$/);
    assert.equal(sentEmail?.to, "member@example.org");
    assert.match(sentEmail?.html ?? "", /activate-account\?token=one-time-activation-token/);
    assert.equal(JSON.stringify(result).includes("one-time-activation-token"), false);
  } finally {
    if (originalActivationUrl === undefined) delete process.env.ACTIVATION_URL;
    else process.env.ACTIVATION_URL = originalActivationUrl;
  }
});

test("account creation rejects duplicate email and forbidden role assignment", async () => {
  let createCalls = 0;
  const existing = { id: "existing-user", email: "member@example.org" };
  const duplicateRepository = {
    findByEmail: async () => existing,
    findRoleNameById: async () => "Member",
    create: async () => { createCalls += 1; return existing; },
  };
  const activation = { execute: async () => ({ token: "unused", expiresAt: new Date() }) };
  const email = { sendEmail: async () => undefined };
  const useCase = new CreateAccountUseCase(duplicateRepository as never, activation as never, email as never);
  const input = { firstName: "Member", lastName: "User", email: "member@example.org", roleId: "member-role" };

  await assert.rejects(useCase.execute(input, { roleName: "System Administrator" }), { name: "DuplicateAccountError" });
  assert.equal(createCalls, 0);

  const roleRepository = {
    findByEmail: async () => null,
    findRoleNameById: async () => "System Administrator",
    create: async () => { createCalls += 1; return existing; },
  };
  await assert.rejects(
    new CreateAccountUseCase(roleRepository as never, activation as never, email as never).execute(input, { roleName: "Organisation Administrator" }),
    /ROLE_ASSIGNMENT_FORBIDDEN/,
  );
  assert.equal(createCalls, 0);
});
