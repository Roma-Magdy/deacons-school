import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesQuery, normalizeArabic, phoneDigits } from "../src/lib/search.mjs";
import { parseYear, planPromotion } from "../src/lib/promotion.mjs";

test("search ignores Arabic spelling differences", () => {
  assert.equal(normalizeArabic("أحمد"), normalizeArabic("احمد"));
  assert.equal(normalizeArabic("فاطمة"), normalizeArabic("فاطمه"));
  assert.equal(normalizeArabic("منى"), normalizeArabic("مني"));
  assert.ok(matchesQuery({ name: "أحمد سامي", phone: "01012345678" }, "احمد"));
  assert.ok(matchesQuery({ name: "أحمد سامي", phone: "01012345678" }, "  سامي "));
  assert.ok(!matchesQuery({ name: "أحمد سامي", phone: "01012345678" }, "مينا"));
  assert.ok(matchesQuery({ name: "x y", phone: "01012345678" }, ""));
});

test("search finds phones however they are typed", () => {
  const p = { name: "مينا جورج", phone: "01012345678" };
  assert.ok(matchesQuery(p, "0101234"));
  assert.ok(matchesQuery(p, "١٠١٢٣٤"));
  assert.ok(matchesQuery(p, "+2010123"));
  assert.ok(!matchesQuery(p, "0109999"));
  // fewer than 3 digits never matches a phone
  assert.ok(!matchesQuery(p, "01"));
  assert.equal(phoneDigits("+201012345678"), "1012345678");
});

test("promotion moves every kid up exactly once", () => {
  const kids = [
    { id: 1, grade: 3 },
    { id: 2, grade: 3 },
    { id: 3, grade: 4 },
    { id: 4, grade: 5 },
    { id: 5, grade: 6 },
    { id: 6, grade: 6 },
  ];
  const { moves, counts, stays } = planPromotion(kids);
  assert.deepEqual(moves.map((m) => [m.id, m.from, m.to]), [
    [1, 3, 4],
    [2, 3, 4],
    [3, 4, 5],
    [4, 5, 6],
    [5, 6, null],
    [6, 6, null],
  ]);
  assert.deepEqual(counts, { 3: 2, 4: 1, 5: 1, 6: 2 });
  assert.equal(stays, 0);
});

test("kids who stay are left alone, in every grade", () => {
  const kids = [
    { id: 1, grade: 3 },
    { id: 2, grade: 6 },
    { id: 3, grade: 6 },
  ];
  const { moves, counts, stays } = planPromotion(kids, [1, 3]);
  assert.deepEqual(moves, [{ id: 2, from: 6, to: null }]);
  assert.deepEqual(counts, { 3: 0, 4: 0, 5: 0, 6: 1 });
  assert.equal(stays, 2);
});

test("graduation year must be a sensible number", () => {
  assert.equal(parseYear("2027"), 2027);
  assert.equal(parseYear(2027), 2027);
  assert.equal(parseYear("abc"), null);
  assert.equal(parseYear(1850), null);
  assert.equal(parseYear(2027.5), null);
});

import { parseDateOnly, validateTerm } from "../src/lib/terms.mjs";

test("term dates must be real calendar dates", () => {
  assert.equal(parseDateOnly("2026-09-01"), "2026-09-01");
  assert.equal(parseDateOnly("2026-02-30"), null);
  assert.equal(parseDateOnly("01/09/2026"), null);
  assert.equal(parseDateOnly(""), null);
});

test("term validation", () => {
  assert.deepEqual(validateTerm({ name: "  الترم   الأول ", start: "2026-09-01", end: "2027-01-31" }), {
    ok: true,
    value: { name: "الترم الأول", start: "2026-09-01", end: "2027-01-31" },
  });
  assert.deepEqual(validateTerm({ name: "", start: "2026-09-01", end: "2027-01-31" }), { ok: false, error: "name" });
  assert.deepEqual(validateTerm({ name: "ترم", start: "x", end: "2027-01-31" }), { ok: false, error: "dates" });
  assert.deepEqual(validateTerm({ name: "ترم", start: "2027-02-01", end: "2027-01-31" }), { ok: false, error: "order" });
  assert.equal(validateTerm({ name: "ترم", start: "2026-09-01", end: "2026-09-01" }).ok, true);
});
