import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordUnlocks } from "@/lib/shapes";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../admin/_components/admin-header";
import ShapePicker, { type ShapeOption } from "./shape-picker";

export const metadata = { title: text.shapes.title };

export default function ShapesPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <ShapesContent />
    </Suspense>
  );
}

async function ShapesContent() {
  const user = await requireUser();
  if (user.role !== "kid") redirect("/home");

  // Saves anything earned since the last visit before showing what is unlocked.
  await recordUnlocks([user.id]);

  const [{ rows: shapeRows }, { rows: totalRows }] = await Promise.all([
    db.query(
      // Hidden shapes are not offered, except the one the kid is already wearing.
      `select s.id, s.name_ar, s.emoji, s.image_url, s.stars_required, s.is_hidden,
              (s.stars_required = 0 or ks.kid_id is not null or s.id = $2::bigint) as unlocked
         from shapes s
         left join kid_shapes ks on ks.shape_id = s.id and ks.kid_id = $1
        where not s.is_hidden or s.id = $2::bigint
        order by s.stars_required, s.sort_order, s.id`,
      [user.id, user.shapeId],
    ),
    db.query("select coalesce(sum(amount), 0)::int as total from star_awards where kid_id = $1 and voided_at is null", [user.id]),
  ]);

  const total: number = totalRows[0].total;
  // With no pick yet, the kid is shown wearing the first free shape (same rule as the home page).
  const firstFree = shapeRows.find((r) => r.stars_required === 0 && !r.is_hidden);
  const currentId = user.shapeId ?? (firstFree ? Number(firstFree.id) : null);

  const shapes: ShapeOption[] = shapeRows.map((r) => ({
    id: Number(r.id),
    name: r.name_ar as string,
    emoji: (r.emoji as string | null) ?? null,
    imageUrl: (r.image_url as string | null) ?? null,
    unlocked: r.unlocked as boolean,
    // Only locked shapes show a countdown, based on the kid's current lifetime stars.
    starsToGo: r.unlocked ? 0 : Math.max(0, (r.stars_required as number) - total),
  }));

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={text.shapes.back} />
      <h1 className="page-title-single">{text.shapes.title}</h1>
      <ShapePicker shapes={shapes} currentId={currentId} />
    </main>
  );
}
