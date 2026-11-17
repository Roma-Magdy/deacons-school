import { db } from "@/lib/db";
import { matchesName } from "@/lib/search.mjs";
import type { RecentGroup } from "./types";

/** How many "give stars" taps are loaded at a time. */
export const RECENT_PAGE = 10;

const whenFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * What one servant gave in the current term, newest first, one entry per "give stars" tap (a batch to several kids is one
 * entry). With a search, only the entries that include a matching kid or reason come back, but each one still lists
 * EVERY kid in it, so a cancel always sees the whole batch. Loaded a page at a time, so a long term stays fast.
 */
export async function loadRecent(userId: number, query: string, offset: number): Promise<{ groups: RecentGroup[]; hasMore: boolean }> {
  const q = query.trim().slice(0, 60);

  let kidIds: number[] = [];
  let reasonIds: number[] = [];
  if (q) {
    // Spelling-forgiving Arabic matching is done in code on the small list of kids this servant gave to, then handed to SQL.
    const [{ rows: kids }, { rows: reasons }] = await Promise.all([
      db.query(
        `select distinct u.id, u.full_name
           from star_awards sa
           join users u on u.id = sa.kid_id
          where sa.awarded_by = $1 and sa.voided_at is null and sa.term_id in (select id from terms where is_active)`,
        [userId],
      ),
      db.query("select id, name_ar from reasons"),
    ]);
    kidIds = kids.filter((k) => matchesName(k.full_name as string, q)).map((k) => Number(k.id));
    reasonIds = reasons.filter((r) => matchesName(r.name_ar as string, q)).map((r) => Number(r.id));
    if (kidIds.length === 0 && reasonIds.length === 0) return { groups: [], hasMore: false };
  }

  // Step 1 picks one page of taps (one tap = one statement = one shared timestamp); step 2 loads every kid in those taps.
  // One extra tap is asked for, only to know whether "show more" is needed.
  const { rows } = await db.query(
    `with grp as (
       select created_at, reason_id, amount, branch_id
         from star_awards
        where awarded_by = $1 and voided_at is null
          and term_id in (select id from terms where is_active)
          and (not $2::boolean or kid_id = any($3::bigint[]) or reason_id = any($4::bigint[]))
        group by created_at, reason_id, amount, branch_id
        order by created_at desc, reason_id, amount, branch_id
        limit $5 offset $6
     )
     select sa.id, sa.reason_id, sa.branch_id, u.full_name, sa.amount, r.name_ar as reason, b.name_ar as branch, sa.created_at
       from grp
       join star_awards sa on sa.awarded_by = $1 and sa.voided_at is null
        and sa.created_at = grp.created_at and sa.reason_id = grp.reason_id
        and sa.amount = grp.amount and sa.branch_id is not distinct from grp.branch_id
       join users u on u.id = sa.kid_id
       join reasons r on r.id = sa.reason_id
       left join branches b on b.id = sa.branch_id
      order by sa.created_at desc, sa.reason_id, sa.amount, sa.branch_id, sa.id`,
    [userId, q !== "", kidIds, reasonIds, RECENT_PAGE + 1, offset],
  );

  const groups = new Map<string, RecentGroup>();
  for (const r of rows) {
    const created = r.created_at as Date;
    const gid = `${created.getTime()}-${r.reason_id}-${r.amount}-${r.branch_id ?? 0}`;
    const group = groups.get(gid) ?? {
      gid,
      ids: [],
      kids: [],
      reason: r.reason as string,
      branch: (r.branch as string | null) ?? null,
      amount: r.amount as number,
      when: whenFormat.format(created),
    };
    group.ids.push(Number(r.id));
    group.kids.push(r.full_name as string);
    groups.set(gid, group);
  }

  const all = [...groups.values()];
  return { groups: all.slice(0, RECENT_PAGE), hasMore: all.length > RECENT_PAGE };
}
