// Validation for changing your own password. Plain .mjs so it can be unit-tested with `npm test`.

export const MIN_NEW_PASSWORD = 6;
/** bcrypt only reads the first 72 bytes, so longer passwords would silently be cut. */
export const MAX_NEW_PASSWORD = 64;

/**
 * @param {{ current: unknown, next: unknown, confirm: unknown }} input
 * @returns {"missing" | "short" | "long" | "mismatch" | "same" | null} the first problem, or null when it is fine
 */
export function checkNewPassword({ current, next, confirm }) {
  if (typeof current !== "string" || current === "" || typeof next !== "string" || typeof confirm !== "string") return "missing";
  if (next.length < MIN_NEW_PASSWORD) return "short";
  if (next.length > MAX_NEW_PASSWORD) return "long";
  if (next !== confirm) return "mismatch";
  if (next === current) return "same";
  return null;
}
