import { test } from "node:test";
import assert from "node:assert/strict";

import { parseAppearance, parseTone, resolveTheme } from "./appearance.ts";

test("unknown or missing stored values fall back to the system setting", () => {
  assert.equal(parseAppearance(null), "system");
  assert.equal(parseAppearance("sepia"), "system");
  assert.equal(parseAppearance("glass"), "glass");
  assert.equal(parseTone(undefined), "system");
  assert.equal(parseTone("dark"), "dark");
});

test("system follows the operating system", () => {
  assert.equal(resolveTheme("system", "system", true), "dark");
  assert.equal(resolveTheme("system", "system", false), "light");
});

test("an explicit light or dark choice ignores the system and the glass tone", () => {
  assert.equal(resolveTheme("light", "dark", true), "light");
  assert.equal(resolveTheme("dark", "light", false), "dark");
});

test("Liquid Glass uses its own tone, which can itself follow the system", () => {
  assert.equal(resolveTheme("glass", "dark", false), "dark");
  assert.equal(resolveTheme("glass", "light", true), "light");
  assert.equal(resolveTheme("glass", "system", true), "dark");
});
