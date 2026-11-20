import test from "node:test";
import assert from "node:assert/strict";
import { defaults, websiteSettingsSchema } from "./website-settings.repository.js";

test("website settings retain previously saved content and fill new page sections", () => {
  const oldSettings = { aboutTitle: "Our story", aboutContent: "Existing story", contactTitle: "Contact", contactContent: "Existing introduction", address: "", email: "", phone: "", hours: "", facebook: "", linkedin: "", instagram: "", youtube: "", newsletterEmail: "" };
  const parsed = websiteSettingsSchema.parse(oldSettings);
  assert.equal(parsed.aboutTitle, "Our story");
  assert.equal(parsed.aboutContent, "Existing story");
  assert.equal(parsed.aboutMission, "");
  assert.equal(parsed.contactPartnerTitle, "");
  assert.deepEqual(websiteSettingsSchema.parse({ ...defaults, aboutMission: "Our mission", contactSubheading: "Get in touch" }).aboutMission, "Our mission");
});
