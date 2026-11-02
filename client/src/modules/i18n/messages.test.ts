import test from "node:test";
import assert from "node:assert/strict";
import { isLocale, messages, translateApiMessage } from "./messages.js";

test("English and French dictionaries provide the same translation keys", () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.fr).sort());
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("fr"), true);
  assert.equal(isLocale("es"), false);
  assert.equal(isLocale(null), false);
});

test("known API messages are translated and unknown messages remain available", () => {
  assert.equal(translateApiMessage("Invalid email or password.", "fr"), "Adresse e-mail ou mot de passe incorrect.");
  assert.equal(translateApiMessage("Password changed successfully.", "fr"), "Le mot de passe a été modifié.");
  assert.equal(translateApiMessage("A new service error.", "fr"), "A new service error.");
});
