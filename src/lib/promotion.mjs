// The yearly promotion plan. Plain .mjs so the same code runs on the server (to apply it) and in the browser (to preview it).

export const GRADES = [3, 4, 5, 6];
export const LAST_GRADE = 6;

/**
 * Works out where every kid goes. Everyone moves up exactly one grade, in one pass, so nobody can be moved twice.
 * 6th graders graduate (`to` is null). Kids in `stayIds` are left exactly where they are.
 *
 * @param {{ id: number, grade: number }[]} kids  kids that are not graduated yet
 * @param {Iterable<number>} [stayIds]            kids who repeat the year
 * @returns {{ moves: { id: number, from: number, to: number | null }[], counts: Record<number, number>, stays: number }}
 */
export function planPromotion(kids, stayIds = []) {
  const stay = new Set(stayIds);
  /** @type {{ id: number, from: number, to: number | null }[]} */
  const moves = [];
  /** @type {Record<number, number>} */
  const counts = { 3: 0, 4: 0, 5: 0, 6: 0 };
  let stays = 0;

  for (const kid of kids) {
    if (stay.has(kid.id)) {
      stays++;
      continue;
    }
    if (!GRADES.includes(kid.grade)) continue;
    moves.push({ id: kid.id, from: kid.grade, to: kid.grade === LAST_GRADE ? null : kid.grade + 1 });
    counts[kid.grade]++;
  }
  return { moves, counts, stays };
}

/** The calendar year (Cairo time) a promotion run today would label its graduates with. */
export function defaultGraduationYear(now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", year: "numeric" }).format(now));
}

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

/** @param {unknown} v @returns {number | null} */
export function parseYear(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= MIN_YEAR && n <= MAX_YEAR ? n : null;
}
