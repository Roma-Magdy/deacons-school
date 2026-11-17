import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listBranches } from "@/lib/branches";
import { db } from "@/lib/db";
import { toLocalPhone } from "@/lib/phone.mjs";
import { text, type Gender, type Role } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../../_components/admin-header";
import { ActiveForm, DeleteKidForm, EditDetailsForm, ResetPasswordForm } from "./edit-forms";

export const metadata = { title: text.admin.edit.title };

type Params = Promise<{ id: string }>;

export default function EditUserPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <EditUserContent params={params} />
    </Suspense>
  );
}

async function EditUserContent({ params }: { params: Params }) {
  const admin = await requireAdmin();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const { rows } = await db.query(
    "select id, full_name, phone, role, grade, gender, branch_id, is_active, graduated_year from users where id = $1",
    [id],
  );
  const row = rows[0];
  if (!row) notFound();

  const user = {
    id: Number(row.id),
    name: row.full_name as string,
    phone: toLocalPhone(row.phone as string),
    role: row.role as Role,
    gender: row.gender as Gender | null,
    grade: row.grade as number | null,
    branch: row.branch_id === null ? null : Number(row.branch_id),
    isActive: row.is_active as boolean,
    graduatedYear: row.graduated_year === null ? null : Number(row.graduated_year),
  };
  const isSelf = user.id === admin.id;
  const branches = await listBranches();

  // Only kids can be deleted; the screen tells the admin how many stars would go with them.
  let starsTotal = 0;
  if (user.role === "kid") {
    const { rows: stars } = await db.query(
      "select coalesce(sum(amount), 0)::int as total from star_awards where kid_id = $1 and voided_at is null",
      [user.id],
    );
    starsTotal = stars[0].total;
  }

  return (
    <main className="page">
      <AdminHeader backHref="/admin/users" backLabel={text.admin.backToUsers} />
      <h1 className="page-title-single">{text.admin.edit.title}</h1>
      <div className="stack">
        <EditDetailsForm user={user} isSelf={isSelf} branches={branches} />
        <ResetPasswordForm id={user.id} />
        <ActiveForm id={user.id} isActive={user.isActive} isSelf={isSelf} graduatedYear={user.graduatedYear} />
        {user.role === "kid" && <DeleteKidForm id={user.id} name={user.name} starsTotal={starsTotal} />}
      </div>
    </main>
  );
}
