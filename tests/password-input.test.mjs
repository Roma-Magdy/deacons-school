import assert from "node:assert/strict";
import { test } from "node:test";
import { checkNewPassword } from "../src/lib/password-input.mjs";

test("a new password must be long enough, match, and differ from the old one", () => {
  assert.equal(checkNewPassword({ current: "123456", next: "abcdef", confirm: "abcdef" }), null);
  assert.equal(checkNewPassword({ current: "", next: "abcdef", confirm: "abcdef" }), "missing");
  assert.equal(checkNewPassword({ current: "123456", next: "abc", confirm: "abc" }), "short");
  assert.equal(checkNewPassword({ current: "123456", next: "x".repeat(65), confirm: "x".repeat(65) }), "long");
  assert.equal(checkNewPassword({ current: "123456", next: "abcdef", confirm: "abcdeg" }), "mismatch");
  assert.equal(checkNewPassword({ current: "123456", next: "123456", confirm: "123456" }), "same");
});
