import assert from "node:assert/strict";
import test from "node:test";
import { RegisterAdminMemberUseCase } from "./register-admin-member.usecase.js";

test("member registration returns the created member when invitation delivery fails", async () => {
  const previous = process.env.ACTIVATION_URL;
  process.env.ACTIVATION_URL = "https://example.test/activate";
  const member = { userId: "member-1", firstName: "A", lastName: "B", email: "a@example.test" };
  const repository = { directRegister: async () => member };
  const activation = { execute: async () => ({ token: "token" }) };
  const email = { sendEmail: async () => { throw new Error("delivery failed"); } };
  try {
    const result = await new RegisterAdminMemberUseCase(repository as never, activation as never, email as never).execute({ firstName: "A", lastName: "B", email: "a@example.test" } as never, "actor");
    assert.equal(result.userId, member.userId);
    assert.equal(result.invitationSent, false);
  } finally { if (previous === undefined) delete process.env.ACTIVATION_URL; else process.env.ACTIVATION_URL = previous; }
});

