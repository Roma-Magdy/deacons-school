import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardsText as t } from "@/lib/awards-text";
import { matchesQuery, matchingPeopleIds } from "@/lib/search.mjs";
import { arabicNumber, gradeLabel } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../_components/admin-header";
import VoidButton from "./void-button";

export const metadata = { title: t.title };

const PAGE_SIZE = 50;

type Params = { term?: string; reason?: string; grade?: string; q?: string; by?: string; voided?: string; page?: string };

const dayFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

export default function AwardsPage({ searchParams }: { searchParams: Promise<Params> }) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AwardsContent searchParams={searchParams} />
    </Suspense>
  );
}

function pageHref(sp: Params, page: number): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, page: String(page) })) if (v) q.set(k, v);
  return `/admin/awards?${q.toString()}`;
}

async function AwardsContent({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const sp = await searchParams;

  const [{ rows: terms }, { rows: reasons }, { rows: staff }] = await Promise.all([
    db.query("select id, name, is_active from terms order by start_date desc, id desc"),
    db.query("select id, name_ar from reasons order by sort_order, id"),
    // Everyone who can give stars, including servants who were switched off later: their old awards are still in the log.
    db.query("select id, full_name, phone from users where role in ('servant', 'admin') order by full_name"),
  ]);

  // The current term unless the admin picks another one (or "all terms").
  const activeTerm = terms.find((x) => x.is_active);
  const termFilter = sp.term === "all" ? null : (terms.find((x) => String(x.id) === sp.term) ?? activeTerm ?? null);
  const termValue = sp.term === "all" ? "all" : termFilter ? String(termFilter.id) : "all";
  const reasonFilter = reasons.find((r) => String(r.id) === sp.reason);
  const grade = [3, 4, 5, 6].includes(Number(sp.grade)) ? Number(sp.grade) : null;
  const showVoided = sp.voided === "1";
  const query = (sp.q ?? "").trim();
  // A repeated ?by=... in the address would arrive as a list, so anything that is not plain text is ignored.
  const by = typeof sp.by === "string" ? sp.by.trim().slice(0, 60) : "";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  // Name search ignores Arabic spelling differences, so it is done on the (small) kid list here, then passed to the query.
  let kidIds: number[] | null = null;
  if (query) {
    const { rows: kids } = await db.query("select id, full_name, phone from users where role = 'kid'");
    kidIds = kids.filter((k) => matchesQuery({ name: k.full_name as string, phone: k.phone as string }, query)).map((k) => Number(k.id));
  }

  // Same idea for the servant who gave the stars: matched here (spelling-forgiving), then handed to the query.
  const staffIds = by
    ? matchingPeopleIds(staff.map((x) => ({ id: Number(x.id), name: x.full_name as string, phone: x.phone as string })), by)
    : null;

  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  };
  if (termFilter) add("sa.term_id = ?", Number(termFilter.id));
  if (reasonFilter) add("sa.reason_id = ?", Number(reasonFilter.id));
  if (grade) add("k.grade = ?", grade);
  if (kidIds) add("sa.kid_id = any(?::bigint[])", kidIds);
  if (staffIds) add("sa.awarded_by = any(?::bigint[])", staffIds);
  if (!showVoided) where.push("sa.voided_at is null");

  params.push(PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const { rows } = await db.query(
    `select sa.id, sa.amount, sa.note, sa.created_at, sa.voided_at,
            k.full_name as kid, k.grade, r.name_ar as reason, b.name_ar as branch,
            a.full_name as awarder, v.full_name as voider, count(*) over ()::int as n
       from star_awards sa
       join users k on k.id = sa.kid_id
       join reasons r on r.id = sa.reason_id
       left join branches b on b.id = sa.branch_id
       join users a on a.id = sa.awarded_by
       left join users v on v.id = sa.voided_by
      ${where.length ? "where " + where.join(" and ") : ""}
      order by sa.created_at desc, sa.id desc
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  const total: number = rows[0]?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel="← الرئيسية" />
      <h1 className="page-title-single">{t.title}</h1>
      <p className="muted">{t.intro}</p>

      <form method="get" className="staff-card form awards-filter">
        <label className="field">
          <span>{t.term}</span>
          <select name="term" defaultValue={termValue}>
            <option value="all">{t.allTerms}</option>
            {terms.map((x) => (
              <option key={String(x.id)} value={String(x.id)}>
                {x.name as string}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.reason}</span>
          <select name="reason" defaultValue={reasonFilter ? String(reasonFilter.id) : ""}>
            <option value="">{t.allReasons}</option>
            {reasons.map((r) => (
              <option key={String(r.id)} value={String(r.id)}>
                {r.name_ar as string}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.grade}</span>
          <select name="grade" defaultValue={grade ? String(grade) : ""}>
            <option value="">{t.allGrades}</option>
            {[3, 4, 5, 6].map((g) => (
              <option key={g} value={String(g)}>
                {gradeLabel(g)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.search}</span>
          <input type="search" name="q" defaultValue={query} />
        </label>
        <label className="field">
          <span>{t.servant}</span>
          <input type="search" name="by" defaultValue={by} list="awards-staff" placeholder={t.servantHint} autoComplete="off" />
          <datalist id="awards-staff">
            {staff.map((x) => (
              <option key={String(x.id)} value={x.full_name as string} />
            ))}
          </datalist>
        </label>
        <label className="awards-check">
          <input type="checkbox" name="voided" value="1" defaultChecked={showVoided} /> {t.showVoided}
        </label>
        <button type="submit" className="button">
          {t.filter}
        </button>
      </form>

      <p className="muted">{t.count(total)}</p>

      {rows.length === 0 ? (
        <p className="staff-card">{t.empty}</p>
      ) : (
        <ul className="user-list">
          {rows.map((r) => (
            <li key={String(r.id)} className={r.voided_at ? "user-row award-row is-voided" : "user-row award-row"}>
              <span className="user-main">
                <strong>
                  {r.kid as string} <span className="muted">({gradeLabel(r.grade as number)})</span>
                </strong>
                <span>
                  {r.reason as string}
                  {r.branch ? ` · ${r.branch as string}` : ""}
                </span>
                <span className="muted">
                  {dayFormat.format(r.created_at as Date)} · {t.by(r.awarder as string)}
                </span>
                {r.note && <span className="muted">{t.note(r.note as string)}</span>}
                {r.voided_at && (
                  <span className="badge off">
                    {t.voided}
                    {r.voider ? ` · ${t.voidedBy(r.voider as string)}` : ""}
                  </span>
                )}
              </span>
              <span className="award-side">
                <span className="history-amount">{arabicNumber(r.amount as number)}</span>
                {!r.voided_at && <VoidButton id={Number(r.id)} kid={r.kid as string} amount={r.amount as number} />}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="awards-pages" aria-label={t.page(page, pages)}>
          {page > 1 && (
            <Link className="button secondary" href={pageHref(sp, page - 1)}>
              {t.prev}
            </Link>
          )}
          <span className="muted">{t.page(page, pages)}</span>
          {page < pages && (
            <Link className="button secondary" href={pageHref(sp, page + 1)}>
              {t.next}
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
