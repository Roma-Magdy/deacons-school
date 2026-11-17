"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardsText } from "@/lib/awards-text";

export type VoidAwardResult = { ok: true } | { ok: false; error: string };

/** An admin cancels one award. It stays in the history, marked as cancelled, and stops counting everywhere. */
export async function voidAward(idInput: number): Promise<VoidAwardResult> {
  const user = await requireAdmin();
  const id = Number(idInput);
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: awardsText.errors.generic };

  const { rowCount } = await db.query("update star_awards set voided_at = now(), voided_by = $2 where id = $1 and voided_at is null", [id, user.id]);
  if (!rowCount) return { ok: false, error: awardsText.errors.notFound };

  for (const p of ["/admin/awards", "/stars", "/home", "/history", "/leaderboard"]) revalidatePath(p);
  return { ok: true };
}
