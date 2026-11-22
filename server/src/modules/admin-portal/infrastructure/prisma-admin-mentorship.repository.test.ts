import test from "node:test";
import assert from "node:assert/strict";
import { PrismaAdminMentorshipRepository } from "./prisma-admin-mentorship.repository.js";

test("mentorship list and assignment options are read from the persisted schema",async()=>{
  const repository=new PrismaAdminMentorshipRepository();
  const [page,options]=await Promise.all([repository.list({page:1,pageSize:10}),repository.options()]);
  assert.equal(typeof page.total,"number");
  assert.ok(Array.isArray(page.rows));
  assert.ok(Object.values(page.summary).every(value=>Number.isInteger(value)&&value>=0));
  assert.ok(Array.isArray(options.mentors));
  assert.ok(Array.isArray(options.members));
  assert.ok(Array.isArray(options.programmes));
  if(page.rows[0]){
    const detail=await repository.get(page.rows[0].id);
    assert.equal(detail?.id,page.rows[0].id);
    assert.ok(Array.isArray(detail?.sessions));
    assert.ok(Array.isArray(detail?.objectives));
  }
});
