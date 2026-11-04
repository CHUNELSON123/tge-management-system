import test from "node:test";
import assert from "node:assert/strict";
import { authService } from "./auth.service.js";

test("auth service posts login credentials to the agreed API and reads the token",async()=>{
  const original=globalThis.fetch;let requestUrl="";let requestBody="";
  globalThis.fetch=async(input,init)=>{requestUrl=String(input);requestBody=String(init?.body);return new Response(JSON.stringify({message:"Login successful.",data:{accessToken:"token"}}),{status:200,headers:{"Content-Type":"application/json"}});};
  try{const result=await authService.login({email:"person@example.org",password:"secret"});assert.match(requestUrl,/\/api\/auth\/login$/);assert.deepEqual(JSON.parse(requestBody),{email:"person@example.org",password:"secret"});assert.equal(result.data.accessToken,"token");}finally{globalThis.fetch=original;}
});

test("auth service surfaces API login rejection",async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({message:"Invalid email or password."}),{status:401,headers:{"Content-Type":"application/json"}});
  try{await assert.rejects(authService.login({email:"person@example.org",password:"wrong"}),/Invalid email or password/);}finally{globalThis.fetch=original;}
});
