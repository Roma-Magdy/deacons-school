import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toLocalPhone } from "@/lib/phone.mjs";
import { text, type Gender, type Role } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../_components/admin-header";
import UsersList, { type UserRow } from "./users-list";

export const metadata = { title: text.admin.users.title };

const t = text.admin.users;
// A school with a few hundred accounts loads in one go and is searched in the browser, so typing filters instantly.
const LIMIT = 2000;

export default function UsersPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <UsersContent />
    </Suspense>
  );
}

async function UsersContent() {
  await requireAdmin();

  const [{ rows }, archived] = await Promise.all([
    db.query(
      `select id, full_name, phone, role, grade, gender, is_active,
              (locked_until is not null and locked_until > now()) as locked
         from users
        where graduated_year is null
        limit ${LIMIT}`,
    ),
    db.query("select count(*)::int as n from users where graduated_year is not null"),
  ]);

  const users: UserRow[] = rows
    .map((r) => ({
      id: Number(r.id),
      name: r.full_name as string,
      phone: toLocalPhone(r.phone as string),
      role: r.role as Role,
      gender: r.gender as Gender | null,
      grade: r.grade === null ? null : Number(r.grade),
      active: r.is_active as boolean,
      locked: r.locked as boolean,
    }))
    // Servants and admins first, then kids by grade and name.
    .sort(
      (a, b) =>
        Number(a.role === "kid") - Number(b.role === "kid") || (a.grade ?? 0) - (b.grade ?? 0) || a.name.localeCompare(b.name, "ar"),
    );

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
          <Link href="/admin/users/promote" className="button secondary">
            {t.promote}
          </Link>
          <Link href="/admin/users/archive" className="button secondary">
            {t.archive(archived.rows[0].n)}
          </Link>
        </div>
      </div>

      <UsersList users={users} />
    </main>
  );
}
