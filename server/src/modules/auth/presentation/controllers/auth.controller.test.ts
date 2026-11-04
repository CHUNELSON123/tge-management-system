import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { createAuthRouter } from "./auth.controller.js";

test("login route returns only the agreed access-token contract", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", createAuthRouter({ execute: async () => ({ accessToken: "signed-token" }) } as never, {} as never));
  const server = createServer(app);
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "person@example.org", password: "correct-password" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as Record<string, unknown>;
    assert.deepEqual(body, { message: "Login successful.", data: { accessToken: "signed-token" } });
    assert.equal(JSON.stringify(body).includes("passwordHash"), false);
  } finally { server.close(); }
});

test("login route rejects invalid input and credentials", async () => {
  const app = express(); app.use(express.json());
  app.use("/api/auth", createAuthRouter({ execute: async () => { throw new Error("INVALID_CREDENTIALS"); } } as never, {} as never));
  const server=createServer(app); server.listen(0); await once(server,"listening");
  const address=server.address(); if(!address||typeof address==="string")throw new Error("Test server did not bind.");
  try {
    const invalid=await fetch(`http://127.0.0.1:${address.port}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"bad",password:""})});
    assert.equal(invalid.status,400);
    const denied=await fetch(`http://127.0.0.1:${address.port}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"person@example.org",password:"wrong"})});
    assert.equal(denied.status,401); assert.deepEqual(await denied.json(),{message:"Invalid email or password."});
  } finally {server.close();}
});
