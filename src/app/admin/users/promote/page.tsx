import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { defaultGraduationYear } from "@/lib/promotion.mjs";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../../_components/admin-header";
import PromoteForm, { type PromoteKid, type LastPromotion } from "./promote-form";

export const metadata = { title: text.admin.promote.title };

const whenFormat = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });

export default function PromotePage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <PromoteContent />
    </Suspense>
  );
}

async function PromoteContent() {
  await requireAdmin();

  const [kidRows, lastRows] = await Promise.all([
    db.query("select id, full_name, grade from users where role = 'kid' and graduated_year is null"),
    // Only the newest promotion can be undone, so that is the only one the screen needs.
    db.query(
      `select id, school_year, created_at, undone_at, jsonb_array_length(moves)::int as n,
              floor(extract(epoch from now() - created_at) / 86400)::int as days_ago
         from promotions
        order by id desc
        limit 1`,
    ),
  ]);

  const kids: PromoteKid[] = kidRows.rows
    .map((r) => ({ id: Number(r.id), name: r.full_name as string, grade: Number(r.grade) }))
    .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "ar"));

  const last = lastRows.rows[0];
  const lastPromotion: LastPromotion | null = last
    ? {
        id: Number(last.id),
        year: Number(last.school_year),
        when: whenFormat.format(last.created_at as Date),
        count: last.n as number,
        undone: last.undone_at !== null,
        // Used for the "you already did this recently" warning.
        daysAgo: last.days_ago as number,
      }
    : null;

  return (
    <main className="page">
      <AdminHeader backHref="/admin/users" backLabel={text.admin.backToUsers} />
      <h1 className="page-title-single">{text.admin.promote.title}</h1>
      <PromoteForm kids={kids} defaultYear={defaultGraduationYear()} last={lastPromotion} />
    </main>
  );
}
