import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toLocalPhone } from "@/lib/phone.mjs";
import { text, type Gender } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../../_components/admin-header";
import ArchiveBoard, { type Graduate } from "./archive-board";

export const metadata = { title: text.admin.archive.title };

export default function ArchivePage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <ArchiveContent />
    </Suspense>
  );
}

async function ArchiveContent() {
  await requireAdmin();

  const { rows } = await db.query(
    `select u.id, u.full_name, u.phone, u.gender, u.grade, u.graduated_year, coalesce(t.total, 0)::int as total
       from users u
       left join (select kid_id, sum(amount) as total from star_awards where voided_at is null group by kid_id) t on t.kid_id = u.id
      where u.role = 'kid' and u.graduated_year is not null`,
  );

  const graduates: Graduate[] = rows
    .map((r) => ({
      id: Number(r.id),
      name: r.full_name as string,
      phone: toLocalPhone(r.phone as string),
      gender: r.gender as Gender | null,
      grade: Number(r.grade),
      year: Number(r.graduated_year),
      total: r.total as number,
    }))
    .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, "ar"));

  return (
    <main className="page">
      <AdminHeader backHref="/admin/users" backLabel={text.admin.backToUsers} />
      <h1 className="page-title-single">{text.admin.archive.title}</h1>
      <ArchiveBoard graduates={graduates} />
    </main>
  );
}
