"use server";

import { revalidatePath } from "next/cache";
import type { QueryResult } from "pg";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordUnlocks } from "@/lib/shapes";
import { MAX_AMOUNT, MAX_KIDS_PER_AWARD, MAX_NOTE_LENGTH } from "@/lib/star-limits";
import { text } from "@/lib/strings";
import { loadRecent } from "./recent";
import type { RecentGroup } from "./types";

const e = text.stars.errors;

// Every action starts with requireStaff(): the page is staff-only, but anyone can call a server action directly,
// so all input is checked again here and nothing the browser sends is trusted.

export type AwardInput = {
  kidIds: number[];
  reasonId: number;
  amount: number;
  branchId: number | null;
  note: string;
};

export type AwardResult = { ok: true; ids: number[] } | { ok: false; error: string };

/** Gives the same stars, for the same reason, to one or more kids. Any servant can give any amount to any kid. */
export async function awardStars(input: AwardInput): Promise<AwardResult> {
  const user = await requireStaff();

  const kidIds = Array.isArray(input?.kidIds) ? [...new Set(input.kidIds.map(Number))] : [];
  if (kidIds.length === 0 || kidIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) return { ok: false, error: e.noKids };
  if (kidIds.length > MAX_KIDS_PER_AWARD) return { ok: false, error: e.tooMany };

  const amount = Number(input.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) return { ok: false, error: e.badAmount(MAX_AMOUNT) };

  const note = String(input.note ?? "").trim();
  if (note.length > MAX_NOTE_LENGTH) return { ok: false, error: e.noteTooLong };

  const reasonId = Number(input.reasonId);
  const { rows: reasons } = await db.query("select id, is_competition from reasons where id = $1 and is_active", [reasonId]);
  if (!reasons[0]) return { ok: false, error: e.badReason };

  // The branch is optional, and only competitions can name one.
  let branchId: number | null = null;
  if (reasons[0].is_competition && input.branchId !== null && input.branchId !== undefined) {
    branchId = Number(input.branchId);
    const { rowCount } = await db.query("select 1 from branches where id = $1 and is_active", [branchId]);
    if (!rowCount) return { ok: false, error: e.badBranch };
  }

  const { rows: terms } = await db.query("select id from terms where is_active");
  if (!terms[0]) return { ok: false, error: text.stars.noTerm };

  const { rows: found } = await db.query(
    "select count(*)::int as n from users where id = any($1::bigint[]) and role = 'kid' and is_active",
    [kidIds],
  );
  if (found[0].n !== kidIds.length) return { ok: false, error: e.badKids };

  // One statement, so a whole class is saved together or not at all.
  let inserted: QueryResult;
  try {
    inserted = await db.query(
      `insert into star_awards (kid_id, amount, reason_id, branch_id, term_id, awarded_by, note)
       select k, $2, $3, $4, $5, $6, $7 from unnest($1::bigint[]) as k
       returning id`,
      [kidIds, amount, reasonId, branchId, terms[0].id, user.id, note || null],
    );
  } catch (err) {
    // A kid was deleted by an admin between the check above and this insert.
    if ((err as { code?: string })?.code === "23503") return { ok: false, error: e.badKids };
    throw err;
  }

  // Remember any shapes these kids just earned, so a later undo can't take a shape back. The stars are already saved,
  // and the shape picker records unlocks again on every visit, so a failure here must not fail the award.
  try {
    await recordUnlocks(kidIds);
  } catch (err) {
    console.error("Could not record shape unlocks:", err);
  }

  revalidatePath("/stars");
  return { ok: true, ids: inserted.rows.map((r) => Number(r.id)) };
}

export type VoidResult = { ok: true; count: number } | { ok: false; error: string };

/**
 * Undo: marks awards as cancelled (they stay in the history). An admin can cancel any award. A servant can cancel their own,
 * any time during the current term.
 */
export async function voidAwards(ids: number[]): Promise<VoidResult> {
  const user = await requireStaff();

  const clean = Array.isArray(ids) ? [...new Set(ids.map(Number))].filter((id) => Number.isSafeInteger(id) && id > 0) : [];
  if (clean.length === 0 || clean.length > MAX_KIDS_PER_AWARD) return { ok: false, error: e.generic };

  const result = await db.query(
    `update star_awards set voided_at = now(), voided_by = $2
      where id = any($1::bigint[]) and voided_at is null
        and ($3::boolean or (awarded_by = $2 and term_id in (select id from terms where is_active)))`,
    [clean, user.id, user.role === "admin"],
  );
  // Nothing changed: already cancelled (maybe in another tab), from an old term, or not this servant's.
  if (!result.rowCount) return { ok: false, error: e.cantUndo };

  revalidatePath("/stars");
  return { ok: true, count: result.rowCount };
}

export type RecentResult = { ok: true; groups: RecentGroup[]; hasMore: boolean } | { ok: false; error: string };

/** One page of what this servant gave this term, optionally searched by kid name or reason. Always the caller's own. */
export async function listRecent(input: { query: string; offset: number }): Promise<RecentResult> {
  const user = await requireStaff();

  const query = typeof input?.query === "string" ? input.query : "";
  const offset = Number.isSafeInteger(input?.offset) && input.offset > 0 ? Math.min(input.offset, 10000) : 0;

  return { ok: true, ...(await loadRecent(user.id, query, offset)) };
}
