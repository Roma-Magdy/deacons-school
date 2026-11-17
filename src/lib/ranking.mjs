// Ranking helpers for the leaderboards. Plain .mjs so they can be unit-tested with `npm test`.

/**
 * Gives every row a place. Equal stars share a place, and the next place skips: 10, 10, 7 → 1, 1, 3.
 * @template {{ total: number }} T
 * @param {T[]} rows already sorted by total, highest first
 * @returns {(T & { place: number })[]}
 */
export function withPlaces(rows) {
  let place = 0;
  let last = null;
  return rows.map((row, i) => {
    if (row.total !== last) {
      place = i + 1;
      last = row.total;
    }
    return { ...row, place };
  });
}

/** First two words of a full name. Leaderboards never show more of a kid's name than this. */
export function firstTwoNames(fullName) {
  return String(fullName ?? "").trim().split(/\s+/).slice(0, 2).join(" ");
}
