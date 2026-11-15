import { db } from "@/lib/db";

export type Branch = { id: number; name: string };

/** The active branches (الألحان، الطقس، المحفوظات، القبطي), in display order. */
export async function listBranches(): Promise<Branch[]> {
  const { rows } = await db.query("select id, name_ar from branches where is_active order by sort_order, id");
  return rows.map((r) => ({ id: Number(r.id), name: r.name_ar as string }));
}
