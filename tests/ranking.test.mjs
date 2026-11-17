import assert from "node:assert/strict";
import { test } from "node:test";
import { firstTwoNames, withPlaces } from "../src/lib/ranking.mjs";

test("equal stars share a place and the next place skips", () => {
  const rows = withPlaces([{ total: 10 }, { total: 10 }, { total: 7 }, { total: 7 }, { total: 1 }]);
  assert.deepEqual(rows.map((r) => r.place), [1, 1, 3, 3, 5]);
  assert.deepEqual(withPlaces([]), []);
});

test("only the first two names are shown", () => {
  assert.equal(firstTwoNames("  مينا  سامي  جرجس "), "مينا سامي");
  assert.equal(firstTwoNames("مينا"), "مينا");
});
