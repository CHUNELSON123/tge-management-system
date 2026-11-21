import test from "node:test";
import assert from "node:assert/strict";
import { ManageAdminMentorshipUseCase } from "./manage-admin-mentorship.usecase.js";

test("mentor self-service is scoped to the authenticated mentor profile",async()=>{
  let lookedUp="";
  const repository={mentorIdForUser:async(userId:string)=>{lookedUp=userId;return "mentor-profile-id";}};
  const useCase=new ManageAdminMentorshipUseCase(repository as never);
  assert.equal(await useCase.scopeForMentor("user-id","Mentor"),"mentor-profile-id");
  assert.equal(lookedUp,"user-id");
});

test("administrator mentorship scope is not narrowed to a mentor profile",async()=>{
  let lookedUp=false;
  const repository={mentorIdForUser:async()=>{lookedUp=true;return null;}};
  const useCase=new ManageAdminMentorshipUseCase(repository as never);
  assert.equal(await useCase.scopeForMentor("admin-id","System Administrator"),null);
  assert.equal(lookedUp,false);
});
