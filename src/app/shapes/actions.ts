"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordUnlocks } from "@/lib/shapes";
import { text } from "@/lib/strings";

export type ChooseResult = { ok: true } | { ok: false; error: string };

/** A kid picks the shape that stands for their stars. Only free shapes and ones they have unlocked are allowed. */
export async function chooseShape(shapeIdInput: number): Promise<ChooseResult> {
  const user = await requireUser();
  if (user.role !== "kid") return { ok: false, error: text.shapes.errors.generic };

  const shapeId = Number(shapeIdInput);
  if (!Number.isSafeInteger(shapeId) || shapeId <= 0) return { ok: false, error: text.shapes.errors.generic };

  await recordUnlocks([user.id]);
  const { rowCount } = await db.query(
    `select 1 from shapes s
      where s.id = $1
        and (not s.is_hidden or s.id = $3::bigint)
        and (s.stars_required = 0 or exists (select 1 from kid_shapes ks where ks.kid_id = $2 and ks.shape_id = s.id))`,
    [shapeId, user.id, user.shapeId],
  );
  if (!rowCount) return { ok: false, error: text.shapes.errors.locked };

  await db.query("update users set shape_id = $2 where id = $1", [user.id, shapeId]);
  revalidatePath("/home");
  revalidatePath("/shapes");
  revalidatePath("/stars");
  return { ok: true };
}
