import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { reasonsText as t } from "@/lib/reasons-text";
import AdminHeader, { AdminFallback } from "../_components/admin-header";
import ReasonsBoard, { type ReasonItem } from "./reasons-board";

export const metadata = { title: t.title };

export default function ReasonsPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <ReasonsContent />
    </Suspense>
  );
}

async function ReasonsContent() {
  await requireAdmin();

  const { rows } = await db.query(
    `select r.id, r.name_ar, r.is_competition, r.is_active,
            exists (select 1 from star_awards sa where sa.reason_id = r.id) as used
       from reasons r
      order by r.sort_order, r.id`,
  );
  const reasons: ReasonItem[] = rows.map((r) => ({
    id: Number(r.id),
    name: r.name_ar as string,
    competition: r.is_competition as boolean,
    active: r.is_active as boolean,
    used: r.used as boolean,
  }));

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel="← الرئيسية" />
      <h1 className="page-title-single">{t.title}</h1>
      <ReasonsBoard reasons={reasons} />
    </main>
  );
}
