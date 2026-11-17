"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanReasonName, moveId } from "@/lib/reason-input.mjs";
import { reasonsText } from "@/lib/reasons-text";

const e = reasonsText.errors;

// Every action starts with requireAdmin(): anyone can call a server action directly, not just through the page.

export type ReasonResult = { ok: true } | { ok: false; error: string };

function refresh() {
  for (const p of ["/admin/reasons", "/stars", "/home", "/leaderboard", "/history", "/admin/awards"]) revalidatePath(p);
}

function asId(v: unknown): number | null {
  const id = Number(v);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function nameTaken(name: string, exceptId: number | null): Promise<boolean> {
  const { rowCount } = await db.query("select 1 from reasons where lower(name_ar) = lower($1) and ($2::bigint is null or id <> $2)", [name, exceptId]);
  return (rowCount ?? 0) > 0;
}

export async function createReason(input: { name: string }): Promise<ReasonResult> {
  await requireAdmin();
  const name = cleanReasonName(input?.name);
  if (!name) return { ok: false, error: e.name };
  if (await nameTaken(name, null)) return { ok: false, error: e.duplicate };

  await db.query(
    `insert into reasons (slug, name_ar, is_competition, sort_order)
     values ($1, $2, false, coalesce((select max(sort_order) from reasons), 0) + 1)`,
    [`custom-${crypto.randomUUID().slice(0, 8)}`, name],
  );
  refresh();
  return { ok: true };
}

/** Renaming changes the name everywhere, old stars included: they point at the reason, not at its name. */
export async function renameReason(idInput: number, input: { name: string }): Promise<ReasonResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };
  const name = cleanReasonName(input?.name);
  if (!name) return { ok: false, error: e.name };
  if (await nameTaken(name, id)) return { ok: false, error: e.duplicate };

  const { rowCount } = await db.query("update reasons set name_ar = $2 where id = $1", [id, name]);
  if (!rowCount) return { ok: false, error: e.notFound };
  refresh();
  return { ok: true };
}

/** Hides or shows a reason on the add-stars screen. Old stars keep it. */
export async function setReasonActive(idInput: number, active: boolean): Promise<ReasonResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  if (!active) {
    const { rows } = await db.query("select is_competition from reasons where id = $1", [id]);
    if (!rows[0]) return { ok: false, error: e.notFound };
    if (rows[0].is_competition) return { ok: false, error: e.competition };
    const { rows: others } = await db.query("select count(*)::int as n from reasons where is_active and id <> $1", [id]);
    if (others[0].n === 0) return { ok: false, error: e.lastOne };
  }
  const { rowCount } = await db.query("update reasons set is_active = $2 where id = $1", [id, active === true]);
  if (!rowCount) return { ok: false, error: e.notFound };
  refresh();
  return { ok: true };
}

/** Moves a reason one place up or down, then renumbers everything so the order is always clean. */
export async function moveReason(idInput: number, direction: "up" | "down"): Promise<ReasonResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null || (direction !== "up" && direction !== "down")) return { ok: false, error: e.notFound };

  const client = await db.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query("select id from reasons order by sort_order, id for update");
    const ids = rows.map((r) => Number(r.id));
    if (!ids.includes(id)) {
      await client.query("rollback");
      return { ok: false, error: e.notFound };
    }
    const next = moveId(ids, id, direction);
    for (let i = 0; i < next.length; i++) await client.query("update reasons set sort_order = $2 where id = $1", [next[i], i + 1]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  refresh();
  return { ok: true };
}

/** Deletes a reason nobody has received stars for. Otherwise the admin hides it. */
export async function deleteReason(idInput: number): Promise<ReasonResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  const { rows } = await db.query("select is_competition, is_active from reasons where id = $1", [id]);
  if (!rows[0]) return { ok: false, error: e.notFound };
  if (rows[0].is_competition) return { ok: false, error: e.competition };
  if (rows[0].is_active) {
    const { rows: others } = await db.query("select count(*)::int as n from reasons where is_active and id <> $1", [id]);
    if (others[0].n === 0) return { ok: false, error: e.lastOne };
  }

  try {
    const { rowCount } = await db.query("delete from reasons where id = $1 and not exists (select 1 from star_awards where reason_id = $1)", [id]);
    if (!rowCount) return { ok: false, error: e.inUse };
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23503") return { ok: false, error: e.inUse };
    throw err;
  }
  refresh();
  return { ok: true };
}
