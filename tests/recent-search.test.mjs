import assert from "node:assert/strict";
import { test } from "node:test";
import { pruneGroups } from "../src/lib/recent-groups.mjs";
import { matchesName, matchingPeopleIds } from "../src/lib/search.mjs";

test("name search matches any word, in any order, ignoring spelling differences", () => {
  assert.ok(matchesName("أحمد ماهر جرجس", "ماهر احمد"));
  assert.ok(matchesName("إيمان سامي", "ايمان"));
  assert.ok(matchesName("فاطمة", "فاطمه"));
  assert.ok(matchesName("مصطفى", "مصطفي"));
  assert.ok(!matchesName("أحمد ماهر", "احمد مينا"));
  assert.ok(matchesName("أحمد ماهر", ""));
  assert.ok(matchesName("أحمد ماهر", "   "));
});

const groups = () => [
  { gid: "a", ids: [1, 2, 3], kids: ["أحمد", "مينا", "كيرلس"] },
  { gid: "b", ids: [4], kids: ["مريم"] },
];

test("cancelling one kid removes only that kid and keeps ids and names in step", () => {
  const out = pruneGroups(groups(), new Set([2]));
  assert.deepEqual(out[0].ids, [1, 3]);
  assert.deepEqual(out[0].kids, ["أحمد", "كيرلس"]);
  assert.equal(out[0].gid, "a", "the entry keeps its identity");
  assert.deepEqual(out[1], groups()[1]);
});

test("an entry disappears when every kid in it is cancelled", () => {
  const out = pruneGroups(groups(), new Set([1, 2, 3]));
  assert.deepEqual(out.map((g) => g.gid), ["b"]);
});

test("nothing cancelled returns the same array, and the input is never changed", () => {
  const g = groups();
  assert.equal(pruneGroups(g, new Set()), g);
  pruneGroups(g, new Set([1, 4]));
  assert.deepEqual(g, groups());
});

test("servant search finds people by name (any word order) or by phone", () => {
  const staff = [
    { id: 1, name: "مينا سامي", phone: "+201012345678" },
    { id: 2, name: "إيمان جرجس", phone: "+201199999999" },
    { id: 3, name: "مينا ماهر", phone: "+201555555555" },
  ];
  assert.deepEqual(matchingPeopleIds(staff, "مينا"), [1, 3]);
  assert.deepEqual(matchingPeopleIds(staff, "سامي مينا"), [1]);
  assert.deepEqual(matchingPeopleIds(staff, "ايمان"), [2]);
  assert.deepEqual(matchingPeopleIds(staff, "01012"), [1]);
  assert.deepEqual(matchingPeopleIds(staff, "01"), [], "fewer than 3 digits never matches a phone");
  assert.deepEqual(matchingPeopleIds(staff, "زززز"), []);
  assert.deepEqual(matchingPeopleIds(staff, ""), [1, 2, 3]);
});
