import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhone, toLocalPhone } from "../src/lib/phone.mjs";
import { parseDelimited, parseGender, parseGrade, parseUserRows, validateUserFields } from "../src/lib/import-parse.mjs";

test("phone numbers normalize from every common way of writing them", () => {
  for (const input of ["01012345678", "+201012345678", "201012345678", "00201012345678", "0101 234 5678", "010-1234-5678", "٠١٠١٢٣٤٥٦٧٨", "1012345678"]) {
    assert.equal(normalizePhone(input), "+201012345678", input);
  }
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone("01312345678"), null); // 013 is not an Egyptian mobile prefix
  assert.equal(toLocalPhone("+201012345678"), "01012345678");
});

test("gender words in Arabic and English", () => {
  assert.equal(parseGender("ولد"), "male");
  assert.equal(parseGender("بنت"), "female");
  assert.equal(parseGender("أنثى"), "female");
  assert.equal(parseGender(" Female "), "female");
  assert.equal(parseGender("تاسوني"), "female");
  assert.equal(parseGender("؟"), null);
  assert.equal(parseGender(""), null);
});

test("grades from digits and words", () => {
  assert.equal(parseGrade("3"), 3);
  assert.equal(parseGrade("٤"), 4);
  assert.equal(parseGrade("تالتة ابتدائي"), 3);
  assert.equal(parseGrade("ثالثة"), 3);
  assert.equal(parseGrade("الرابعة"), 4);
  assert.equal(parseGrade("خامسة"), 5);
  assert.equal(parseGrade("سادسة ابتدائي"), 6);
  assert.equal(parseGrade("13"), null);
  assert.equal(parseGrade("2"), null);
  assert.equal(parseGrade(""), null);
});

test("delimited text: tabs from Excel, commas, semicolons, quotes, BOM and blank lines", () => {
  assert.deepEqual(parseDelimited("a\tb\tc\n\n1\t2\t3\n").map((r) => r.cells), [["a", "b", "c"], ["1", "2", "3"]]);
  assert.deepEqual(parseDelimited("﻿a;b\r\n1;2").map((r) => r.cells), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseDelimited('"مينا, جورج",5').map((r) => r.cells), [["مينا, جورج", "5"]]);
  assert.equal(parseDelimited("a,b\n\n\nc,d")[1].line, 4);
});

test("a kid needs a two-part name, a grade and a gender", () => {
  assert.equal(validateUserFields({ name: "مينا", phone: "01012345678", gender: "male", grade: 4, role: "kid" }).ok, false);
  assert.equal(validateUserFields({ name: "مينا جورج", phone: "01012345678", gender: "male", grade: 7, role: "kid" }).ok, false);
  const ok = validateUserFields({ name: "  مينا   جورج ", phone: "01012345678", gender: "male", grade: "4", role: "kid" });
  assert.deepEqual(ok.ok && ok.value, { name: "مينا جورج", phone: "+201012345678", gender: "male", grade: 4, role: "kid" });
});

test("a servant needs no grade and may have a one-word name", () => {
  const ok = validateUserFields({ name: "ماريا", phone: "01112345678", gender: "female", role: "servant" });
  assert.equal(ok.ok, true);
  assert.equal(ok.ok && ok.value.grade, null);
});

test("import with a header row, columns in any order", () => {
  const text = "النوع\tالاسم\tالموبايل\tالصف\nولد\tبيشوي مجدي\t01012345678\t4\nبنت\tمريم عادل\t01112345678\tخامسة";
  const { rows, errors, headerDetected } = parseUserRows(text, { role: "kid" });
  assert.equal(headerDetected, true);
  assert.deepEqual(errors, []);
  assert.deepEqual(rows.map((r) => [r.name, r.phone, r.gender, r.grade]), [
    ["بيشوي مجدي", "+201012345678", "male", 4],
    ["مريم عادل", "+201112345678", "female", 5],
  ]);
});

test("import without a header uses the default column order", () => {
  const { rows, errors, headerDetected } = parseUserRows("بيشوي مجدي,01012345678,٤,ولد", { role: "kid" });
  assert.equal(headerDetected, false);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 1);

  const servants = parseUserRows("ماريا سامي,01112345678,بنت", { role: "servant" });
  assert.deepEqual(servants.errors, []);
  assert.equal(servants.rows[0].gender, "female");
});

test("import reports every bad row with its line, and still keeps the good ones", () => {
  const text = [
    "الاسم,الموبايل,الصف,النوع",
    "بيشوي مجدي,01012345678,4,ولد",
    "مينا,01012345679,4,ولد", // one-word name
    "كيرلس نبيل,12345,3,ولد", // bad phone
    "مريم عادل,01112345678,9,بنت", // bad grade
    "يوسف سمير,01212345678,5,؟", // bad gender
    "بيتر سمير,01012345678,5,ولد", // phone repeated from line 2
  ].join("\n");
  const { rows, errors } = parseUserRows(text, { role: "kid" });
  assert.equal(rows.length, 1);
  assert.deepEqual(errors.map((e) => e.line), [3, 4, 5, 6, 7]);
  assert.match(errors[4].message, /السطر 2/);
});

test("a header row without a name or phone column is rejected clearly", () => {
  const { rows, errors } = parseUserRows("الصف,النوع\n4,ولد", { role: "kid" });
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
});

test("empty input", () => {
  assert.deepEqual(parseUserRows("  \n \n", { role: "kid" }).rows, []);
});

test("Neon sslmode is made explicit without changing anything else", async () => {
  const { explicitSsl } = await import("../src/lib/db-url.mjs");
  assert.equal(
    explicitSsl("postgresql://u:p%40ss@ep-x-pooler.eu-central-1.aws.neon.tech/db?sslmode=require&channel_binding=require"),
    "postgresql://u:p%40ss@ep-x-pooler.eu-central-1.aws.neon.tech/db?sslmode=verify-full&channel_binding=require",
  );
  assert.equal(explicitSsl("postgresql://u:p@h/db?channel_binding=require&sslmode=require"), "postgresql://u:p@h/db?channel_binding=require&sslmode=verify-full");
  assert.equal(explicitSsl("postgresql://u:p@h/db?sslmode=verify-full"), "postgresql://u:p@h/db?sslmode=verify-full");
  assert.equal(explicitSsl("postgresql://postgres@localhost:5432/db"), "postgresql://postgres@localhost:5432/db");
  assert.equal(explicitSsl(undefined), undefined);
});
