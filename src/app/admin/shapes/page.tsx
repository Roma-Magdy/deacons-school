import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../_components/admin-header";
import ShapesBoard, { type ShapeItem } from "./shapes-board";

export const metadata = { title: text.admin.shapes.title };

export default function AdminShapesPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminShapesContent />
    </Suspense>
  );
}

async function AdminShapesContent() {
  await requireAdmin();

  const { rows } = await db.query(
    `select s.id, s.name_ar, s.emoji, s.image_url, s.stars_required, s.is_hidden,
            (select count(*)::int from users u where u.shape_id = s.id) as wearing,
            (select count(*)::int from kid_shapes ks where ks.shape_id = s.id) as unlocked
       from shapes s
      order by s.stars_required, s.sort_order, s.id`,
  );

  const shapes: ShapeItem[] = rows.map((r) => ({
    id: Number(r.id),
    name: r.name_ar as string,
    emoji: (r.emoji as string | null) ?? null,
    imageUrl: (r.image_url as string | null) ?? null,
    stars: r.stars_required as number,
    hidden: r.is_hidden as boolean,
    wearing: r.wearing as number,
    unlocked: r.unlocked as number,
  }));

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={text.admin.backHome} />
      <h1 className="page-title-single">{text.admin.shapes.title}</h1>
      <ShapesBoard shapes={shapes} />
    </main>
  );
}
