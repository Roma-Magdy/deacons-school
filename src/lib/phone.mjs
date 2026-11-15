// Phone number normalization. Plain .mjs so both the app and the seed script can use it.

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Normalizes a phone number to international format, e.g. "+201012345678".
 * Accepts Egyptian numbers written as 01012345678, 201012345678, +201012345678,
 * 00201012345678, with spaces/dashes, and with Arabic-Indic digits.
 * Other countries are accepted only with a leading + (or 00), 8-15 digits.
 * Returns null if the input is not a plausible phone number.
 *
 * @param {unknown} input
 * @returns {string | null}
 */
export function normalizePhone(input) {
  if (typeof input !== "string") return null;

  let s = input.trim();
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  s = s.replace(/[۰-۹]/g, (d) => String(EXTENDED_ARABIC_INDIC.indexOf(d)));
  s = s.replace(/[\s\-().]/g, "");

  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!/^\+?\d+$/.test(s)) return null;

  // Egyptian mobile: 01[0125] + 8 digits
  if (/^01[0125]\d{8}$/.test(s)) return "+20" + s.slice(1);
  if (/^201[0125]\d{8}$/.test(s)) return "+" + s;
  if (/^\+201[0125]\d{8}$/.test(s)) return s;

  // Any other country: must be explicit international format
  if (s.startsWith("+") && /^\+[1-9]\d{7,14}$/.test(s)) return s;

  return null;
}
