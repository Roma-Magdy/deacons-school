// Pure helpers for the "last given stars" list, kept out of the screen so they can be unit-tested with `npm test`.

/**
 * Hides awards that were just cancelled: a cancelled kid disappears from their entry, and an entry disappears once every
 * kid in it is cancelled. Nothing is changed in place; with nothing cancelled the same array comes back.
 *
 * @template {{ ids: number[], kids: string[] }} G
 * @param {G[]} groups
 * @param {Set<number>} cancelled award ids
 * @returns {G[]}
 */
export function pruneGroups(groups, cancelled) {
  if (cancelled.size === 0) return groups;
  return groups
    .map((g) => {
      const keep = g.ids.map((_, i) => i).filter((i) => !cancelled.has(g.ids[i]));
      return keep.length === g.ids.length ? g : { ...g, ids: keep.map((i) => g.ids[i]), kids: keep.map((i) => g.kids[i]) };
    })
    .filter((g) => g.ids.length > 0);
}
