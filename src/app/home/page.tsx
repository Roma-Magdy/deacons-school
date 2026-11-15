import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { logout } from "../actions";

export const metadata = { title: "الرئيسية" };

const ROLE_LABELS: Record<CurrentUser["role"], string> = {
  kid: "شمّاس",
  servant: "خادم",
  branch_leader: "مسؤول فرع",
  admin: "مدير",
};

async function KidHome({ user }: { user: CurrentUser }) {
  const [{ rows: totals }, { rows: shapes }] = await Promise.all([
    db.query(
      "select coalesce(sum(amount), 0)::int as total from star_awards where kid_id = $1 and voided_at is null",
      [user.id],
    ),
    db.query(
      // The kid's chosen shape, or the first free one if they haven't picked yet.
      `select name_ar, emoji from shapes
        where id = coalesce($1::bigint, (select id from shapes where stars_required = 0 order by sort_order limit 1))`,
      [user.shapeId],
    ),
  ]);
  const total: number = totals[0].total;
  const shape = shapes[0];

  return (
    <section className="card stars-card">
      <div className="shape-big" aria-hidden="true">
        {shape?.emoji ?? "⭐"}
      </div>
      <p className="muted">مجموع {shape?.name_ar ?? "النجوم"}</p>
      <p className="total">{total.toLocaleString("ar-EG")}</p>
      <p className="muted">قريبًا: ترتيبك، وتغيير الشكل، وسجل النجوم</p>
    </section>
  );
}

function StaffHome() {
  return (
    <section className="card">
      <p>لوحة الخدّام (إضافة النجوم) ستظهر هنا قريبًا.</p>
    </section>
  );
}

export default function HomePage() {
  // Reading the login cookie is request-time data, so it streams inside a Suspense boundary.
  return (
    <Suspense
      fallback={
        <main className="page">
          <p className="muted">جارٍ التحميل...</p>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const user = await requireUser();

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>أهلاً {user.fullName}</h1>
          <p className="muted">
            {ROLE_LABELS[user.role]}
            {user.grade ? ` — الصف ${user.grade.toLocaleString("ar-EG")} الابتدائي` : ""}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="button secondary">
            خروج
          </button>
        </form>
      </header>

      {user.role === "kid" ? <KidHome user={user} /> : <StaffHome />}
    </main>
  );
}
