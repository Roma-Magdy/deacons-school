// Parsing and validation for adding people, used by the single "add" form and the spreadsheet import.
// Plain .mjs (no TypeScript) so it can be unit-tested with `npm test` on any Node version.
import { normalizePhone } from "./phone.mjs";

/** How many accounts the browser sends per request when importing, so no single request runs for long. */
export const IMPORT_CHUNK_SIZE = 25;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** @param {unknown} s */
export function toWesternDigits(s) {
  return String(s ?? "")
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXTENDED_ARABIC_INDIC.indexOf(d)));
}

/** Lower-cases and smooths over Arabic spelling variants so "أنثى" and "انثي" compare equal. @param {unknown} v */
function norm(v) {
  return String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/[ً-ٰٟـ]/g, "") // diacritics and tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

/** @param {unknown} s */
export function cleanName(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

const MALE = new Set(["ولد", "ذكر", "شماس", "خادم", "male", "m", "boy", "man"].map(norm));
const FEMALE = new Set(["بنت", "انثي", "تاسوني", "خادمه", "female", "f", "girl", "woman"].map(norm));

/**
 * @param {unknown} v
 * @returns {"male" | "female" | null}
 */
export function parseGender(v) {
  const s = norm(v);
  if (MALE.has(s)) return "male";
  if (FEMALE.has(s)) return "female";
  return null;
}

/**
 * Accepts 3-6, Arabic-Indic digits, or words like "تالتة ابتدائي" / "الرابعة".
 * @param {unknown} v
 * @returns {3 | 4 | 5 | 6 | null}
 */
export function parseGrade(v) {
  const s = toWesternDigits(norm(v));
  const digit = s.match(/(?:^|\D)([3-6])(?:\D|$)/);
  if (digit) return /** @type {3|4|5|6} */ (Number(digit[1]));
  if (s.includes("تالت") || s.includes("ثالث")) return 3;
  if (s.includes("رابع")) return 4;
  if (s.includes("خامس")) return 5;
  if (s.includes("سادس")) return 6;
  return null;
}

/**
 * Splits pasted spreadsheet text (tab, comma or semicolon separated, quotes allowed) into rows of cells.
 * Blank rows are skipped. `line` is the 1-based line where the row starts, for error messages.
 *
 * @param {string} input
 * @returns {{ line: number, cells: string[] }[]}
 */
export function parseDelimited(input) {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

  /** @type {{ line: number, cells: string[] }[]} */
  const rows = [];
  /** @type {string[]} */
  let cells = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let rowStart = 1;

  const endRow = () => {
    cells.push(field);
    field = "";
    if (cells.some((c) => c.trim() !== "")) rows.push({ line: rowStart, cells: cells.map((c) => c.trim()) });
    cells = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      line++;
      rowStart = line;
    } else {
      field += ch;
    }
  }
  endRow();
  return rows;
}

/**
 * Validates one person's details. `role` decides what is required: kids need a grade and a two-part name.
 *
 * @param {{ name: unknown, phone: unknown, gender: unknown, grade?: unknown, role: string }} input
 * @returns {{ ok: true, value: { name: string, phone: string, gender: "male" | "female", grade: number | null, role: string } } | { ok: false, errors: string[] }}
 */
export function validateUserFields({ name, phone, gender, grade, role }) {
  /** @type {string[]} */
  const errors = [];

  const cleaned = cleanName(name);
  if (cleaned.length < 2) errors.push("اكتب الاسم");
  else if (cleaned.length > 80) errors.push("الاسم طويل قوي");
  else if (role === "kid" && cleaned.split(" ").length < 2) errors.push("اكتب الاسم الأول والتاني");

  const normalizedPhone = normalizePhone(typeof phone === "string" ? phone : String(phone ?? ""));
  if (!normalizedPhone) errors.push("رقم الموبايل مش مظبوط");

  const g = parseGender(gender);
  if (!g) errors.push(role === "kid" ? "حدد ولد ولا بنت" : "حدد النوع");

  /** @type {number | null} */
  let parsedGrade = null;
  if (role === "kid") {
    parsedGrade = parseGrade(grade);
    if (!parsedGrade) errors.push("الصف لازم يكون من تالتة لسادسة");
  }

  if (errors.length > 0 || !normalizedPhone || !g) return { ok: false, errors };
  return { ok: true, value: { name: cleaned, phone: normalizedPhone, gender: g, grade: parsedGrade, role } };
}

const HEADER_WORDS = {
  name: ["الاسم", "اسم", "الاسم بالكامل", "name", "full name"],
  phone: ["الموبايل", "موبايل", "رقم الموبايل", "التليفون", "تليفون", "رقم التليفون", "الهاتف", "رقم الهاتف", "phone", "mobile"],
  grade: ["الصف", "صف", "السنه", "السنة", "grade", "class"],
  gender: ["النوع", "الجنس", "gender", "sex"],
};

/**
 * Turns pasted spreadsheet text into validated rows.
 * With a header row, columns are found by name (in any order). Without one, the order is
 * name, phone, grade, gender for kids and name, phone, gender for servants.
 *
 * @param {string} text
 * @param {{ role: "kid" | "servant" }} options
 */
export function parseUserRows(text, { role }) {
  const table = parseDelimited(text);
  /** @type {{ line: number, name: string, phone: string, gender: "male" | "female", grade: number | null }[]} */
  const rows = [];
  /** @type {{ line: number, name: string, message: string }[]} */
  const errors = [];

  if (table.length === 0) return { rows, errors, headerDetected: false, total: 0 };

  /** @type {Record<string, number>} */
  let cols = role === "kid" ? { name: 0, phone: 1, grade: 2, gender: 3 } : { name: 0, phone: 1, gender: 2 };
  let start = 0;
  let headerDetected = false;

  /** @type {Record<string, number>} */
  const mapped = {};
  table[0].cells.forEach((cell, index) => {
    const c = norm(cell);
    for (const [key, words] of Object.entries(HEADER_WORDS)) {
      if (words.map(norm).includes(c)) mapped[key] = index;
    }
  });
  if (Object.keys(mapped).length >= 2) {
    headerDetected = true;
    start = 1;
    cols = mapped;
    if (cols.name === undefined || cols.phone === undefined) {
      errors.push({ line: table[0].line, name: "", message: "السطر الأول لازم يكون فيه عمود «الاسم» وعمود «الموبايل»" });
      return { rows, errors, headerDetected, total: table.length - 1 };
    }
  }

  /** @type {Map<string, number>} */
  const seen = new Map();
  for (const { line, cells } of table.slice(start)) {
    const get = (/** @type {string} */ key) => (cols[key] === undefined ? "" : (cells[cols[key]] ?? ""));
    const result = validateUserFields({ name: get("name"), phone: get("phone"), gender: get("gender"), grade: get("grade"), role });

    if (!result.ok) {
      errors.push({ line, name: cleanName(get("name")), message: result.errors.join("، ") });
      continue;
    }
    const earlier = seen.get(result.value.phone);
    if (earlier !== undefined) {
      errors.push({ line, name: result.value.name, message: `الرقم ده مكرر في السطر ${earlier}` });
      continue;
    }
    seen.set(result.value.phone, line);
    rows.push({ line, name: result.value.name, phone: result.value.phone, gender: result.value.gender, grade: result.value.grade });
  }

  return { rows, errors, headerDetected, total: table.length - start };
}
