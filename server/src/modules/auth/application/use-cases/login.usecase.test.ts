import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { LoginUseCase } from "./login.usecase.js";

test("login verifies password hash and only issues access for active accounts", async () => {
  const passwordHash = await bcrypt.hash("correct-password", 4);
  const user = { id:"u1",passwordHash,status:"ACTIVE" as string,deletedAt:null };
  let issuedFor = "";
  const repo = { findByEmail: async () => user } as never;
  const jwt = { signAccessToken: (id:string) => { issuedFor=id; return "token"; } } as never;
  const useCase = new LoginUseCase(repo,jwt);
  assert.deepEqual(await useCase.execute({email:"Person@example.org",password:"correct-password"}),{accessToken:"token"});
  assert.equal(issuedFor,"u1");
  await assert.rejects(useCase.execute({email:"person@example.org",password:"wrong"}),/INVALID_CREDENTIALS/);
  for (const status of ["PENDING_ACTIVATION","SUSPENDED","DEACTIVATED"]) {
    const inactiveRepo={findByEmail:async()=>({...user,status})} as never;
    await assert.rejects(new LoginUseCase(inactiveRepo,jwt).execute({email:"person@example.org",password:"correct-password"}),/INVALID_CREDENTIALS/);
  }
});
