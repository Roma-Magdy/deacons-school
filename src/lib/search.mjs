// Search helpers for the accounts list and the archive. Plain .mjs so they can be unit-tested with `npm test`.
import { toWesternDigits } from "./import-parse.mjs";

/** Makes Arabic search forgiving: ignores diacritics and treats أ/إ/آ, ى/ي and ة/ه as the same letter. @param {unknown} s */
export function normalizeArabic(s) {
  return String(s ?? "")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Digits of a phone number without the country code or leading zero, so 010..., 10... and +2010... all compare equal. @param {unknown} s */
export function phoneDigits(s) {
  return toWesternDigits(s).replace(/\D/g, "").replace(/^(20|0)/, "");
}

/**
 * True when the typed text is part of the person's name, or (3+ digits) part of their phone number.
 * An empty search matches everyone.
 *
 * @param {{ name: string, phone: string }} person
 * @param {string} query
 */
export function matchesQuery(person, query) {
  const q = normalizeArabic(query);
  if (q === "") return true;
  if (normalizeArabic(person.name).includes(q)) return true;
  const digits = phoneDigits(query);
  return digits.length >= 3 && phoneDigits(person.phone).includes(digits);
}

/**
 * True when every word typed is found in the name, in any order ("ماهر احمد" finds "أحمد ماهر"), ignoring spelling
 * differences. An empty search matches everything.
 *
 * @param {string} name
 * @param {string} query
 */
export function matchesName(name, query) {
  const q = normalizeArabic(query);
  if (q === "") return true;
  const n = normalizeArabic(name);
  return q.split(" ").every((word) => n.includes(word));
}

/**
 * Ids of the people a search finds: their name matches (every word typed, in any order), or 3+ typed digits are part of
 * their phone number. An empty search finds everyone.
 *
 * @template {{ id: number, name: string, phone: string }} P
 * @param {P[]} people
 * @param {string} query
 * @returns {number[]}
 */
export function matchingPeopleIds(people, query) {
  return people.filter((p) => matchesName(p.name, query) || matchesQuery(p, query)).map((p) => p.id);
}
