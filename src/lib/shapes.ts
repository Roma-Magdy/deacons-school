import "server-only";
import { db } from "./db";

/**
 * Saves every shape these kids have earned with their lifetime stars (cancelled stars don't count).
 * Once saved, a shape stays unlocked even if a star is cancelled later. Safe to call as often as needed.
 */
export async function recordUnlocks(kidIds: number[]): Promise<void> {
  if (kidIds.length === 0) return;
  await db.query(
    `insert into kid_shapes (kid_id, shape_id)
     select t.kid_id, s.id
       from (select kid_id, sum(amount) as total from star_awards
              where kid_id = any($1::bigint[]) and voided_at is null group by kid_id) t
       join shapes s on s.stars_required > 0 and s.stars_required <= t.total
     on conflict do nothing`,
    [kidIds],
  );
}
