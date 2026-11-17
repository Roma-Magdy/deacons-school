import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { arabicNumber, starsCount, text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../admin/_components/admin-header";

export const metadata = { title: text.history.title };

const t = text.history;
const LIMIT = 200;

const dayFormat = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function HistoryPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <HistoryContent />
    </Suspense>
  );
}

async function HistoryContent() {
  const user = await requireUser();
  if (user.role !== "kid") redirect("/home");

  // Only stars that count (cancelled ones are left out). The servant's private note and name are never shown to the kid.
  const { rows } = await db.query(
    `select sa.id, sa.amount, sa.created_at, r.name_ar as reason, b.name_ar as branch,
            sum(sa.amount) over ()::int as total, count(*) over ()::int as n
       from star_awards sa
       join reasons r on r.id = sa.reason_id
       left join branches b on b.id = sa.branch_id
      where sa.kid_id = $1 and sa.voided_at is null
      order by sa.created_at desc, sa.id desc
      limit ${LIMIT}`,
    [user.id],
  );

  const total: number = rows[0]?.total ?? 0;
  const count: number = rows[0]?.n ?? 0;

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={t.back} />
      <h1 className="page-title-single">{t.title}</h1>

      {rows.length === 0 ? (
        <p className="staff-card">{t.empty}</p>
      ) : (
        <>
          <p className="muted">{t.summary(total, count > LIMIT ? LIMIT : count)}</p>
          <ul className="user-list">
            {rows.map((r) => (
              <li key={r.id} className="user-row history-row">
                <span className="user-main">
                  <strong>
                    {r.reason}
                    {r.branch ? ` · ${r.branch}` : ""}
                  </strong>
                  <span className="muted">{dayFormat.format(r.created_at as Date)}</span>
                </span>
                <span className="history-amount">+{arabicNumber(r.amount as number)}</span>
                <span className="sr-only">{starsCount(r.amount as number)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
