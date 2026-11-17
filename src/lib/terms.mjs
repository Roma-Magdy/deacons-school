// Validation for terms (الترم). Plain .mjs so it can be unit-tested with `npm test`.

export const MAX_TERM_NAME = 40;

/** @param {unknown} v @returns {string | null} a real calendar date as "YYYY-MM-DD", or null */
export function parseDateOnly(v) {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 2000 || y > 2100) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return real ? s : null;
}

/**
 * @param {{ name: unknown, start: unknown, end: unknown }} input
 * @returns {{ ok: true, value: { name: string, start: string, end: string } } | { ok: false, error: "name" | "dates" | "order" }}
 */
export function validateTerm({ name, start, end }) {
  const cleaned = String(name ?? "").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2 || cleaned.length > MAX_TERM_NAME) return { ok: false, error: "name" };
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);
  if (!s || !e) return { ok: false, error: "dates" };
  if (e < s) return { ok: false, error: "order" };
  return { ok: true, value: { name: cleaned, start: s, end: e } };
}
