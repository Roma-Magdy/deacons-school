"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseYear, planPromotion } from "@/lib/promotion.mjs";
import { text } from "@/lib/strings";

// Bulk changes, the yearly promotion and the graduates archive.
// Every action starts with requireAdmin(): the pages are admin-only, but anyone can call a server action directly.

const MAX_IDS = 1000;

/** A clean list of distinct positive ids, or null if the browser sent something that isn't one. */
function cleanIds(input: unknown): number[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_IDS) return null;
  const ids = input.map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) return null;
  return [...new Set(ids)];
}

function refresh() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/users/archive");
  revalidatePath("/admin/users/promote");
  revalidatePath("/stars");
}

// ---------- accounts list: bulk actions ----------

export type BulkResult = { ok: true; count: number; skippedSelf?: boolean } | { ok: false; error: string };

/** Moves the selected kids to one grade. Servants, admins and graduates in the selection are ignored. */
export async function bulkMoveGrade(idsInput: number[], gradeInput: number): Promise<BulkResult> {
  await requireAdmin();
  const ids = cleanIds(idsInput);
  const grade = Number(gradeInput);
  if (!ids || ![3, 4, 5, 6].includes(grade)) return { ok: false, error: text.admin.errors.generic };

  const { rowCount } = await db.query(
    "update users set grade = $2 where id = any($1::bigint[]) and role = 'kid' and graduated_year is null",
    [ids, grade],
  );
  refresh();
  return { ok: true, count: rowCount ?? 0 };
}

/** Activates or deactivates the selected accounts. The admin's own account is never deactivated. */
export async function bulkSetActive(idsInput: number[], activeInput: boolean): Promise<BulkResult> {
  const admin = await requireAdmin();
  const ids = cleanIds(idsInput);
  if (!ids) return { ok: false, error: text.admin.errors.generic };
  const active = activeInput === true;

  const targets = active ? ids : ids.filter((id) => id !== admin.id);
  const skippedSelf = !active && targets.length !== ids.length;
  if (targets.length === 0) return { ok: false, error: text.admin.errors.ownDeactivate };

  const { rowCount } = await db.query(
    "update users set is_active = $2 where id = any($1::bigint[]) and graduated_year is null",
    [targets, active],
  );
  refresh();
  return { ok: true, count: rowCount ?? 0, skippedSelf };
}

// ---------- yearly promotion ----------

const p = text.admin.promote;

export type PromoteResult =
  | { ok: true; promotionId: number; promoted: number; graduated: number }
  | { ok: false; error: string };

type LoggedMove = { id: number; from: number; to: number; graduated: boolean; wasActive: boolean };

/**
 * The yearly promotion. Everything happens in one transaction and one UPDATE, so nobody can be moved twice:
 * 3→4, 4→5, 5→6, and 6th graders become graduates of `yearInput` (deactivated, kept in the archive).
 * `stayIds` are kids who repeat the year and are left exactly where they are.
 * What changed is saved in `promotions` so the whole thing can be undone.
 */
export async function promoteSchoolYear(yearInput: number, stayInput: number[]): Promise<PromoteResult> {
  const admin = await requireAdmin();

  const year = parseYear(yearInput);
  if (year === null) return { ok: false, error: p.errors.badYear };
  const stayIds = Array.isArray(stayInput) ? stayInput.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0) : [];

  const client = await db.connect();
  try {
    await client.query("begin");
    // Two admins pressing the button at once: the second one waits here and then sees the first one's promotion.
    await client.query("select pg_advisory_xact_lock(7001)");

    const recent = await client.query(
      "select 1 from promotions where undone_at is null and created_at > now() - interval '2 minutes' limit 1",
    );
    if (recent.rowCount) {
      await client.query("rollback");
      return { ok: false, error: p.errors.tooSoon };
    }

    const { rows } = await client.query(
      "select id, grade, is_active from users where role = 'kid' and graduated_year is null for update",
    );
    const active = new Map<number, boolean>(rows.map((r) => [Number(r.id), r.is_active as boolean]));
    const plan = planPromotion(
      rows.map((r) => ({ id: Number(r.id), grade: Number(r.grade) })),
      stayIds,
    );
    if (plan.moves.length === 0) {
      await client.query("rollback");
      return { ok: false, error: p.errors.nothing };
    }

    const logged: LoggedMove[] = plan.moves.map((m) => ({
      id: m.id,
      from: m.from,
      to: m.to ?? m.from,
      graduated: m.to === null,
      wasActive: active.get(m.id) ?? true,
    }));

    await client.query(
      `update users u
          set grade = m.new_grade,
              graduated_year = case when m.graduate then $4::int end,
              is_active = case when m.graduate then false else u.is_active end
         from unnest($1::bigint[], $2::int[], $3::boolean[]) as m(id, new_grade, graduate)
        where u.id = m.id`,
      [logged.map((m) => m.id), logged.map((m) => m.to), logged.map((m) => m.graduated), year],
    );

    const { rows: saved } = await client.query(
      "insert into promotions (school_year, created_by, moves) values ($1, $2, $3::jsonb) returning id",
      [year, admin.id, JSON.stringify(logged)],
    );
    await client.query("commit");

    refresh();
    const graduated = logged.filter((m) => m.graduated).length;
    return { ok: true, promotionId: Number(saved[0].id), promoted: logged.length - graduated, graduated };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export type UndoResult = { ok: true; restored: number; skipped: number } | { ok: false; error: string };

/** Undoes the latest promotion. Kids edited by hand after the promotion are left as they are. */
export async function undoPromotion(promotionIdInput: number): Promise<UndoResult> {
  await requireAdmin();
  const promotionId = Number(promotionIdInput);
  if (!Number.isSafeInteger(promotionId) || promotionId <= 0) return { ok: false, error: p.errors.cantUndo };

  const client = await db.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(7001)");

    // Only the newest promotion can be undone, and only once; an older one would put kids back in the wrong grade.
    const { rows } = await client.query(
      "select id, school_year, moves, undone_at from promotions order by id desc limit 1 for update",
    );
    const latest = rows[0];
    if (!latest || Number(latest.id) !== promotionId || latest.undone_at !== null) {
      await client.query("rollback");
      return { ok: false, error: p.errors.cantUndo };
    }

    const moves = latest.moves as LoggedMove[];
    const restoredRows = await client.query(
      `update users u
          set grade = m.from_grade, is_active = m.was_active, graduated_year = null
         from unnest($1::bigint[], $2::int[], $3::int[], $4::boolean[], $5::boolean[])
              as m(id, from_grade, to_grade, graduated, was_active)
        where u.id = m.id and u.role = 'kid' and u.grade = m.to_grade
          and (case when m.graduated then u.graduated_year = $6::int else u.graduated_year is null end)
        returning u.id`,
      [
        moves.map((m) => m.id),
        moves.map((m) => m.from),
        moves.map((m) => m.to),
        moves.map((m) => m.graduated),
        moves.map((m) => m.wasActive),
        Number(latest.school_year),
      ],
    );
    await client.query("update promotions set undone_at = now() where id = $1", [promotionId]);
    await client.query("commit");

    refresh();
    const restored = restoredRows.rowCount ?? 0;
    return { ok: true, restored, skipped: moves.length - restored };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ---------- graduates archive ----------

const a = text.admin.archive;

/** Brings graduates back as active 6th graders. */
export async function restoreGraduates(idsInput: number[]): Promise<BulkResult> {
  await requireAdmin();
  const ids = cleanIds(idsInput);
  if (!ids) return { ok: false, error: a.errors.none };

  const { rowCount } = await db.query(
    "update users set graduated_year = null, is_active = true where id = any($1::bigint[]) and role = 'kid' and graduated_year is not null",
    [ids],
  );
  refresh();
  return { ok: true, count: rowCount ?? 0 };
}

/** Permanently deletes graduates and every star they earned. Only accounts that are really in the archive can be deleted here. */
export async function deleteGraduates(idsInput: number[]): Promise<BulkResult> {
  await requireAdmin();
  const ids = cleanIds(idsInput);
  if (!ids) return { ok: false, error: a.errors.none };

  const client = await db.connect();
  try {
    await client.query("begin");
    // Locked, so nothing can be added for these kids while they are being deleted.
    const { rows } = await client.query(
      "select id from users where id = any($1::bigint[]) and role = 'kid' and graduated_year is not null for update",
      [ids],
    );
    const targets = rows.map((r) => Number(r.id));
    if (targets.length > 0) {
      await client.query("delete from star_awards where kid_id = any($1::bigint[])", [targets]);
      await client.query("delete from users where id = any($1::bigint[])", [targets]);
    }
    await client.query("commit");

    refresh();
    return { ok: true, count: targets.length };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export type HistoryRow = {
  kidId: number;
  date: string;
  reason: string;
  branch: string;
  amount: number;
  term: string;
  note: string;
};

const MAX_HISTORY_ROWS = 50_000;
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });

/** Every active (not cancelled) star the chosen graduates earned, for the export file. */
export async function graduateHistory(idsInput: number[]): Promise<{ ok: true; rows: HistoryRow[] } | { ok: false; error: string }> {
  await requireAdmin();
  const ids = cleanIds(idsInput);
  if (!ids) return { ok: false, error: a.errors.none };

  const { rows } = await db.query(
    `select sa.kid_id, sa.created_at, r.name_ar as reason, b.name_ar as branch, sa.amount, t.name as term, sa.note
       from star_awards sa
       join users u on u.id = sa.kid_id and u.role = 'kid' and u.graduated_year is not null
       join reasons r on r.id = sa.reason_id
       join terms t on t.id = sa.term_id
       left join branches b on b.id = sa.branch_id
      where sa.kid_id = any($1::bigint[]) and sa.voided_at is null
      order by sa.kid_id, sa.created_at
      limit ${MAX_HISTORY_ROWS}`,
    [ids],
  );

  return {
    ok: true,
    rows: rows.map((r) => ({
      kidId: Number(r.kid_id),
      date: dayFormat.format(r.created_at as Date),
      reason: r.reason as string,
      branch: (r.branch as string | null) ?? "",
      amount: r.amount as number,
      term: r.term as string,
      note: (r.note as string | null) ?? "",
    })),
  };
}

