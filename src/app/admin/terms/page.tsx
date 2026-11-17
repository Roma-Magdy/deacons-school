import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../_components/admin-header";
import TermsBoard, { type TermItem } from "./terms-board";

export const metadata = { title: text.admin.terms.title };

export default function TermsPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <TermsContent />
    </Suspense>
  );
}

async function TermsContent() {
  await requireAdmin();

  // Dates come back as plain "YYYY-MM-DD" text, so a time zone can never shift them by a day.
  const { rows } = await db.query(
    `select t.id, t.name, to_char(t.start_date, 'YYYY-MM-DD') as start_date, to_char(t.end_date, 'YYYY-MM-DD') as end_date,
            t.is_active, (select count(*)::int from star_awards sa where sa.term_id = t.id and sa.voided_at is null) as awards
       from terms t
      order by t.start_date desc, t.id desc`,
  );

  const terms: TermItem[] = rows.map((r) => ({
    id: Number(r.id),
    name: r.name as string,
    start: r.start_date as string,
    end: r.end_date as string,
    active: r.is_active as boolean,
    awards: r.awards as number,
  }));

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={text.admin.backHome} />
      <h1 className="page-title-single">{text.admin.terms.title}</h1>
      <TermsBoard terms={terms} />
    </main>
  );
}
