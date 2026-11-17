"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPng, validateShape } from "@/lib/shape-input.mjs";
import { text } from "@/lib/strings";

const e = text.admin.shapes.errors;

// Every action starts with requireAdmin(): anyone can call a server action directly, not just through the page.

export type ShapeResult = { ok: true; id?: number } | { ok: false; error: string };

function refresh() {
  revalidatePath("/admin/shapes");
  revalidatePath("/shapes");
  revalidatePath("/home");
  revalidatePath("/stars");
}

function asId(v: unknown): number | null {
  const id = Number(v);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** There must always be at least one visible free shape, so a kid who hasn't picked yet always has something to wear. */
async function isLastFreeShape(id: number): Promise<boolean> {
  const { rows } = await db.query("select count(*)::int as n from shapes where stars_required = 0 and not is_hidden and id <> $1", [id]);
  return rows[0].n === 0;
}

export async function createShape(input: { name: string; emoji: string; stars: string | number }): Promise<ShapeResult> {
  await requireAdmin();
  const v = validateShape(input);
  if (!v.ok) return { ok: false, error: e[v.error] };
  if (!v.value.emoji) return { ok: false, error: e.needsPicture };

  const slug = `custom-${crypto.randomUUID().slice(0, 8)}`;
  const { rows } = await db.query(
    `insert into shapes (slug, name_ar, emoji, stars_required, sort_order)
     values ($1, $2, $3, $4, coalesce((select max(sort_order) from shapes), 0) + 1) returning id`,
    [slug, v.value.name, v.value.emoji, v.value.stars],
  );
  refresh();
  return { ok: true, id: Number(rows[0].id) };
}

export async function updateShape(idInput: number, input: { name: string; emoji: string; stars: string | number }): Promise<ShapeResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };
  const v = validateShape(input);
  if (!v.ok) return { ok: false, error: e[v.error] };

  const client = await db.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query("select stars_required, is_hidden, image_url from shapes where id = $1 for update", [id]);
    const old = rows[0];
    if (!old) {
      await client.query("rollback");
      return { ok: false, error: e.notFound };
    }
    if (!v.value.emoji && !old.image_url) {
      await client.query("rollback");
      return { ok: false, error: e.needsPicture };
    }
    if (old.stars_required === 0 && v.value.stars > 0 && !old.is_hidden && (await isLastFreeShape(id))) {
      await client.query("rollback");
      return { ok: false, error: e.lastFree };
    }
    // A free shape that becomes paid: kids already wearing it keep it, because nobody gets a shape taken away.
    if (old.stars_required === 0 && v.value.stars > 0) {
      await client.query(
        "insert into kid_shapes (kid_id, shape_id) select id, $1 from users where shape_id = $1 and role = 'kid' on conflict do nothing",
        [id],
      );
    }
    await client.query("update shapes set name_ar = $2, emoji = $3, stars_required = $4 where id = $1", [
      id,
      v.value.name,
      v.value.emoji,
      v.value.stars,
    ]);
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

/** Hides or shows a shape in the picker. Kids already wearing a hidden shape keep it until they pick something else. */
export async function setShapeHidden(idInput: number, hidden: boolean): Promise<ShapeResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  if (hidden) {
    const { rows } = await db.query("select stars_required from shapes where id = $1", [id]);
    if (!rows[0]) return { ok: false, error: e.notFound };
    if (rows[0].stars_required === 0 && (await isLastFreeShape(id))) return { ok: false, error: e.lastFree };
  }
  const { rowCount } = await db.query("update shapes set is_hidden = $2 where id = $1", [id, hidden === true]);
  if (!rowCount) return { ok: false, error: e.notFound };
  refresh();
  return { ok: true };
}

/** Deletes a shape nobody is wearing and nobody has unlocked. Otherwise the admin hides it instead. */
export async function deleteShape(idInput: number): Promise<ShapeResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  const { rows } = await db.query("select stars_required, is_hidden from shapes where id = $1", [id]);
  if (!rows[0]) return { ok: false, error: e.notFound };
  if (rows[0].stars_required === 0 && !rows[0].is_hidden && (await isLastFreeShape(id))) return { ok: false, error: e.lastFree };

  try {
    const { rowCount } = await db.query(
      `delete from shapes where id = $1
         and not exists (select 1 from users where shape_id = $1)
         and not exists (select 1 from kid_shapes where shape_id = $1)`,
      [id],
    );
    if (!rowCount) return { ok: false, error: e.inUse };
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23503") return { ok: false, error: e.inUse };
    throw err;
  }
  refresh();
  return { ok: true };
}

/** Saves the picture for a shape. The browser shrinks it to a small PNG first; the server checks it again. */
export async function uploadShapeImage(idInput: number, formData: FormData): Promise<ShapeResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  const file = formData.get("image");
  if (!(file instanceof File)) return { ok: false, error: e.imageType };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkPng(bytes);
  if (check === "type") return { ok: false, error: e.imageType };
  if (check === "size") return { ok: false, error: e.imageSize };

  // ?v= changes on every upload so browsers fetch the new picture instead of an old cached one.
  const { rowCount } = await db.query(
    "update shapes set image_data = $2, image_type = 'image/png', image_url = '/shape-image/' || id || '?v=' || floor(extract(epoch from now()))::bigint where id = $1",
    [id, Buffer.from(bytes)],
  );
  if (!rowCount) return { ok: false, error: e.notFound };
  refresh();
  return { ok: true };
}

/** Goes back to the emoji. Only possible when the shape has one. */
export async function removeShapeImage(idInput: number): Promise<ShapeResult> {
  await requireAdmin();
  const id = asId(idInput);
  if (id === null) return { ok: false, error: e.notFound };

  const { rows } = await db.query("select emoji from shapes where id = $1", [id]);
  if (!rows[0]) return { ok: false, error: e.notFound };
  if (!rows[0].emoji) return { ok: false, error: e.needsPicture };

  await db.query("update shapes set image_data = null, image_type = null, image_url = null where id = $1", [id]);
  refresh();
  return { ok: true };
}
