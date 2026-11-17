import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanReasonName, moveId } from "../src/lib/reason-input.mjs";

test("reason names are cleaned and limited", () => {
  assert.equal(cleanReasonName("  حضور   القداس "), "حضور القداس");
  assert.equal(cleanReasonName("ا"), null);
  assert.equal(cleanReasonName("ا".repeat(31)), null);
});

test("moving a reason swaps it with its neighbour and stops at the ends", () => {
  assert.deepEqual(moveId([1, 2, 3], 2, "up"), [2, 1, 3]);
  assert.deepEqual(moveId([1, 2, 3], 2, "down"), [1, 3, 2]);
  assert.deepEqual(moveId([1, 2, 3], 1, "up"), [1, 2, 3]);
  assert.deepEqual(moveId([1, 2, 3], 3, "down"), [1, 2, 3]);
});
