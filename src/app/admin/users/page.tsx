import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toWesternDigits } from "@/lib/import-parse.mjs";
import { toLocalPhone } from "@/lib/phone.mjs";
import { gradeLabel, roleLabel, text, type Gender, type Role } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../_components/admin-header";

export const metadata = { title: text.admin.users.title };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const t = text.admin.users;
const ROLES: Role[] = ["kid", "servant", "admin"];
const LIMIT = 500;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function UsersContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;

  const q = first(params.q).trim().slice(0, 60);
  const role = ROLES.includes(first(params.role) as Role) ? first(params.role) : "";
  const gradeNum = Number(toWesternDigits(first(params.grade)));
  const grade = [3, 4, 5, 6].includes(gradeNum) ? gradeNum : null;

  // Search matches a name fragment, or a phone fragment typed the way people write it (010..., 10..., +2010...).
  const nameLike = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : null;
  const digits = toWesternDigits(q).replace(/\D/g, "").replace(/^(20|0)/, "");
  const phoneLike = digits.length >= 3 ? `%${digits}%` : null;

  const { rows } = await db.query(
    `select id, full_name, phone, role, grade, gender, is_active,
            (locked_until is not null and locked_until > now()) as locked,
            count(*) over ()::int as total
       from users
      where ($1::text is null or full_name ilike $1 or ($2::text is not null and phone like $2))
        and ($3::text is null or role = $3)
        and ($4::int is null or grade = $4)
      order by (role = 'kid'), grade nulls last, full_name
      limit ${LIMIT}`,
    [nameLike, phoneLike, role || null, grade],
  );
  const total: number = rows[0]?.total ?? 0;

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={text.admin.backHome} />

      <div className="page-title">
        <h1>{t.title}</h1>
        <div className="actions">
          <Link href="/admin/users/new" className="button">
            {t.add}
          </Link>
          <Link href="/admin/users/import" className="button secondary">
            {t.import}
          </Link>
        </div>
      </div>

      <form method="get" className="filters">
        <input type="search" name="q" defaultValue={q} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
        <select name="role" defaultValue={role} aria-label={text.admin.form.accountType}>
          <option value="">{t.allRoles}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {text.admin.roles[r]}
            </option>
          ))}
        </select>
        <select name="grade" defaultValue={grade ? String(grade) : ""} aria-label={text.admin.form.grade}>
          <option value="">{t.allGrades}</option>
          {[3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>
              {gradeLabel(g)}
            </option>
          ))}
        </select>
        <button type="submit" className="button secondary">
          {t.search}
        </button>
      </form>

      <p className="muted count">{t.count(rows.length, total)}</p>

      {rows.length === 0 ? (
        <p className="staff-card">{t.empty}</p>
      ) : (
        <ul className="user-list">
          {rows.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/users/${u.id}`} className="user-row">
                <span className="user-main">
                  <strong>{u.full_name}</strong>
                  <span className="muted">
                    {roleLabel(u.role as Role, u.gender as Gender | null)}
                    {u.grade ? ` · ${gradeLabel(u.grade)}` : ""}
                  </span>
                </span>
                <span className="user-side">
                  <span dir="ltr" className="muted">
                    {toLocalPhone(u.phone)}
                  </span>
                  {!u.is_active && <span className="badge off">{t.inactive}</span>}
                  {u.is_active && u.locked && <span className="badge warn">{t.locked}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
