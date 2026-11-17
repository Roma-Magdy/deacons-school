import assert from "node:assert/strict";
import { test } from "node:test";
import { checkPng, validateShape } from "../src/lib/shape-input.mjs";

function png(width, height, extra = 0) {
  const b = new Uint8Array(33 + extra);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const v = new DataView(b.buffer);
  v.setUint32(16, width);
  v.setUint32(20, height);
  return b;
}

test("shape input is cleaned and checked", () => {
  const ok = validateShape({ name: "  كأس   كبير ", emoji: " 🏆 ", stars: "80" });
  assert.deepEqual(ok, { ok: true, value: { name: "كأس كبير", emoji: "🏆", stars: 80 } });
  assert.deepEqual(validateShape({ name: "كأس", emoji: "", stars: 0 }), { ok: true, value: { name: "كأس", emoji: null, stars: 0 } });
  assert.deepEqual(validateShape({ name: "ك", emoji: "🏆", stars: 1 }), { ok: false, error: "name" });
  assert.deepEqual(validateShape({ name: "كأس", emoji: "abc", stars: 1 }), { ok: false, error: "emoji" });
  assert.deepEqual(validateShape({ name: "كأس", emoji: "🏆", stars: "" }), { ok: false, error: "stars" });
  assert.deepEqual(validateShape({ name: "كأس", emoji: "🏆", stars: -1 }), { ok: false, error: "stars" });
  assert.deepEqual(validateShape({ name: "كأس", emoji: "🏆", stars: 2.5 }), { ok: false, error: "stars" });
});

test("only small real PNG files are accepted", () => {
  assert.equal(checkPng(png(256, 256)), "ok");
  assert.equal(checkPng(png(2000, 2000)), "size");
  assert.equal(checkPng(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), "type");
  assert.equal(checkPng(new Uint8Array(400 * 1024)), "size");
});
