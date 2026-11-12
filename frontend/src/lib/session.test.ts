import assert from "node:assert/strict";
import { test } from "node:test";

import { createSessionValue, passwordMatches, safeEqual, verifySessionValue } from "./session.ts";

process.env.APP_PASSWORD = "correct horse battery staple";
process.env.SESSION_SECRET = "test-session-secret";

test("valid session verifies; tampered or expired ones do not", async () => {
  const value = await createSessionValue();
  assert.equal(await verifySessionValue(value), true);
  const [exp, sig] = value.split(".");
  assert.equal(await verifySessionValue(`${Number(exp) + 999999}.${sig}`), false);
  assert.equal(await verifySessionValue(`${exp}.${sig.slice(0, -1)}x`), false);
  assert.equal(await verifySessionValue(undefined), false);
  assert.equal(await verifySessionValue("garbage"), false);
  const old = await createSessionValue(Date.now() - 1000 * 60 * 60 * 24 * 31);
  assert.equal(await verifySessionValue(old), false);
});

test("sessions signed with another secret are rejected", async () => {
  const value = await createSessionValue();
  process.env.SESSION_SECRET = "rotated";
  assert.equal(await verifySessionValue(value), false);
  process.env.SESSION_SECRET = "test-session-secret";
});

test("password check", async () => {
  assert.equal(await passwordMatches("correct horse battery staple"), true);
  assert.equal(await passwordMatches("wrong"), false);
  assert.equal(await passwordMatches(""), false);
});

test("safeEqual", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});
