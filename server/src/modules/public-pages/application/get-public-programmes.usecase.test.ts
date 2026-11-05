import test from "node:test";
import assert from "node:assert/strict";
import { GetPublicProgrammesUseCase, type PublicProgrammeRepository } from "./get-public-programmes.usecase.js";

test("public programmes use case returns only published programme records from its repository", async () => {
  let queried = false;
  const repository: PublicProgrammeRepository = {
    listPublishedProgrammes: async () => {
      queried = true;
      return [{ name: "Green Skills", slug: "green-skills", description: "A public description", startDate: null, endDate: null }];
    },
  };

  const records = await new GetPublicProgrammesUseCase(repository).execute();

  assert.equal(queried, true);
  assert.deepEqual(records, [{ name: "Green Skills", slug: "green-skills", description: "A public description", startDate: null, endDate: null }]);
});
