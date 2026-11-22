import test from "node:test";
import assert from "node:assert/strict";
import { validateLoginInput } from "./validate-login.js";

test("login form validation accepts a valid email and non-empty password",()=>{
  assert.equal(validateLoginInput(" person@example.org ","password"),null);
});
test("login form validation rejects malformed email and empty or oversized password",()=>{
  assert.equal(validateLoginInput("bad","password"),"Please enter a valid email address.");
  assert.equal(validateLoginInput("person@example.org",""),"Please enter your password.");
  assert.equal(validateLoginInput("person@example.org","x".repeat(129)),"Please enter your password.");
});
