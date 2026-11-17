import "server-only";
import { db } from "./db";
import { firstTwoNames, withPlaces } from "./ranking.mjs";

export type BoardRow = { id: number; name: string; total: number; place: number; emoji: string | null; imageUrl: string | null };

/**
 * Everyone in one grade who has stars, best first, with shared places for ties.
 * `termId` limits it to one term; `reasonId` counts only stars given for that reason;
 * `branchId` counts only stars given for that branch (used with the competition reason).
 * Graduates and deactivated kids are left out. Only the first two names are returned, never a phone number.
 */
export async function getBoard(grade: number, opts: { termId?: number; reasonId?: number; branchId?: number } = {}): Promise<BoardRow[]> {
  const params: unknown[] = [grade];
  let extra = "";
  if (opts.termId !== undefined) {
    params.push(opts.termId);
    extra += ` and sa.term_id = $${params.length}`;
  }
  if (opts.reasonId !== undefined) {
    params.push(opts.reasonId);
    extra += ` and sa.reason_id = $${params.length}`;
  }
  if (opts.branchId !== undefined) {
    params.push(opts.branchId);
    extra += ` and sa.branch_id = $${params.length}`;
  }

  const { rows } = await db.query(
    `select u.id, u.full_name, sum(sa.amount)::int as total, s.emoji, s.image_url
       from users u
       join star_awards sa on sa.kid_id = u.id and sa.voided_at is null${extra}
       left join shapes s on s.id = coalesce(u.shape_id, (select id from shapes where stars_required = 0 and not is_hidden order by sort_order limit 1))
      where u.role = 'kid' and u.is_active and u.graduated_year is null and u.grade = $1
      group by u.id, u.full_name, s.emoji, s.image_url
      order by total desc, u.full_name, u.id`,
    params,
  );

  return withPlaces(
    rows.map((r) => ({
      id: Number(r.id),
      name: firstTwoNames(r.full_name as string),
      total: r.total as number,
      emoji: (r.emoji as string | null) ?? null,
      imageUrl: (r.image_url as string | null) ?? null,
    })),
  );
}

export async function getActiveTermId(): Promise<number | null> {
  const { rows } = await db.query("select id from terms where is_active");
  return rows[0] ? Number(rows[0].id) : null;
}
