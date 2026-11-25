import test from "node:test";
import assert from "node:assert/strict";
import { EmailService } from "./email.service.js";

test("disabled email delivery fails without contacting a provider", async () => {
  const previous = process.env.EMAIL_DELIVERY_DISABLED;
  process.env.EMAIL_DELIVERY_DISABLED = "true";
  try {
    const service = new EmailService();
    await assert.rejects(service.sendEmail({ to: "member@example.test", subject: "Test", html: "Test" }), /disabled/);
  } finally {
    if (previous === undefined) delete process.env.EMAIL_DELIVERY_DISABLED;
    else process.env.EMAIL_DELIVERY_DISABLED = previous;
  }
});
