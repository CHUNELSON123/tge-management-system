import test from "node:test";
import assert from "node:assert/strict";
import { organisationSettingsSchema, defaultOrganisationSettings } from "../../system-settings/domain/organisation-settings.js";
import { CreateMembershipApplicationUseCase } from "../../auth/application/use-cases/create-membership-application.usecase.js";

test("settings reject unknown keys and invalid contact details", () => {
  assert.equal(organisationSettingsSchema.safeParse({ ...defaultOrganisationSettings, email: "invalid" }).success, false);
  assert.equal(organisationSettingsSchema.safeParse({ ...defaultOrganisationSettings, arbitrary: true }).success, false);
  assert.equal(organisationSettingsSchema.safeParse({ ...defaultOrganisationSettings, email: "hello@example.org" }).success, true);
});

test("closed public registration prevents membership application writes", async () => {
  let writes = 0;
  const repository = { create: async () => { writes++; throw new Error("unexpected write"); } };
  const useCase = new CreateMembershipApplicationUseCase(repository, async () => false);
  await assert.rejects(useCase.execute({ firstName: "Jane", lastName: "Doe", email: "jane@example.org" }), /PUBLIC_REGISTRATION_DISABLED/);
  assert.equal(writes, 0);
});

