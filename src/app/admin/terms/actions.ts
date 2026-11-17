"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateTerm } from "@/lib/terms.mjs";
import { text } from "@/lib/strings";

const e = text.admin.terms.errors;

// Every action starts with requireAdmin(): anyone can call a server action directly, not just through the page.

export type TermResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/admin/terms");
  revalidatePath("/stars");
  revalidatePath("/home");
}

function readTerm(input: { name: unknown; start: unknown; end: unknown }) {
  const v = validateTerm(input);
  return v.ok ? { ok: true as const, value: v.value } : { ok: false as const, error: e[v.error] };
}

function asId(v: unknown): number | null {
  const id = Number(v);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Adds a term. It starts inactive; activating it is a separate, deliberate step. */
export async function createTerm(input: { name: string; start: string; end: string }): Promise<TermResult> {
  await requireAdmin();
  const v = readTerm(input);
  if (!v.ok) return v;

  await db.query("insert into terms (name, start_date, end_date, is_active) values ($1, $2, $3, false)", [
    v.value.name,
    v.value.start,
    v.value.end,
  ]);
  refresh();
  return { ok: true };
}

export async function updateTerm(idInput: number, input: { name: string; start: string; end: string }): Promise<TermResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };
  const v = readTerm(input);
  if (!v.ok) return v;

  const { rowCount } = await db.query("update terms set name = $2, start_date = $3, end_date = $4 where id = $1", [
    id,
    v.value.name,
    v.value.start,
    v.value.end,
  ]);
  if (!rowCount) return { ok: false, error: e.notFound };
  refresh();
  return { ok: true };
}

/** Makes one term the active one. Only one can be active, so the old one is switched off in the same transaction. */
export async function activateTerm(idInput: number): Promise<TermResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  const client = await db.connect();
  try {
    await client.query("begin");
    const { rowCount } = await client.query("select 1 from terms where id = $1 for update", [id]);
    if (!rowCount) {
      await client.query("rollback");
      return { ok: false, error: e.notFound };
    }
    await client.query("update terms set is_active = false where is_active and id <> $1", [id]);
    await client.query("update terms set is_active = true where id = $1", [id]);
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

/** Deletes a term that has no stars on it. A term with stars is history and stays. */
export async function deleteTerm(idInput: number): Promise<TermResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  try {
    const { rowCount } = await db.query(
      "delete from terms where id = $1 and not exists (select 1 from star_awards where term_id = $1)",
      [id],
    );
    if (!rowCount) {
      const { rowCount: exists } = await db.query("select 1 from terms where id = $1", [id]);
      return { ok: false, error: exists ? e.hasAwards : e.notFound };
    }
  } catch (err) {
    // A star was added at the very same moment.
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23503") return { ok: false, error: e.hasAwards };
    throw err;
  }
  refresh();
  return { ok: true };
}
