// Validation for the admin "reasons" screen. Plain .mjs so it can be unit-tested with `npm test`.

export const MAX_REASON_NAME = 30;

/** @param {unknown} name @returns {string | null} the cleaned name, or null if it is too short or too long */
export function cleanReasonName(name) {
  const s = String(name ?? "").replace(/\s+/g, " ").trim();
  return s.length >= 2 && s.length <= MAX_REASON_NAME ? s : null;
}

/** Moves the item with `id` one place up or down. Returns the new order of ids (unchanged if it can't move). */
export function moveId(ids, id, direction) {
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
