import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { arabicNumber, gradeLabel, greeting, roleLabel, text } from "@/lib/strings";
import { logout } from "../actions";

export const metadata = { title: text.home.pageTitle };

type ShapeRow = { name_ar: string; emoji: string | null; image_url: string | null };

/** A shape as a picture if it has a designed image, otherwise as its placeholder emoji. */
function ShapeGlyph({ shape, size }: { shape: ShapeRow | undefined; size: number }) {
  if (shape?.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={shape.image_url} alt="" width={size} height={size} />;
  }
  return <>{shape?.emoji ?? "⭐"}</>;
}

async function KidHome({ user }: { user: CurrentUser }) {
  const [{ rows: totals }, { rows: shapes }] = await Promise.all([
    db.query(
      "select coalesce(sum(amount), 0)::int as total from star_awards where kid_id = $1 and voided_at is null",
      [user.id],
    ),
    db.query(
      // The kid's chosen shape, or the first free one if they haven't picked yet.
      `select name_ar, emoji, image_url from shapes
        where id = coalesce($1::bigint, (select id from shapes where stars_required = 0 order by sort_order limit 1))`,
      [user.shapeId],
    ),
  ]);
  const total: number = totals[0].total;
  const shape: ShapeRow | undefined = shapes[0];

  // The next shape the kid can unlock with more stars.
  const { rows: next } = await db.query(
    `select name_ar, emoji, image_url, stars_required from shapes
      where stars_required > $1 order by stars_required limit 1`,
    [total],
  );
  const nextShape: (ShapeRow & { stars_required: number }) | undefined = next[0];

  return (
    <section className="kid-hero">
      <h1 className="kid-greeting">{greeting(user)}</h1>
      {user.grade && <span className="kid-grade">{gradeLabel(user.grade)}</span>}

      <div className="shape-bubble" aria-hidden="true">
        <ShapeGlyph shape={shape} size={100} />
      </div>

      <p className="kid-stars">
        {text.starsPrefix} <span className="count">{arabicNumber(total)}</span>{" "}
        <span className="kid-stars-shape" aria-hidden="true">
          <ShapeGlyph shape={shape} size={36} />
        </span>
      </p>

      {nextShape && (
        <p className="kid-next">
          {text.home.nextShape(nextShape.stars_required - total, nextShape.name_ar)}{" "}
          <span aria-hidden="true">
            <ShapeGlyph shape={nextShape} size={24} />
          </span>
        </p>
      )}

      <p className="kid-soon">{text.home.kidSoon}</p>
    </section>
  );
}

function StaffHome({ user }: { user: CurrentUser }) {
  return (
    <section>
      <h1 className="staff-greeting">{greeting(user)}</h1>
      <p className="muted">{roleLabel(user.role, user.gender)}</p>
      {user.role === "admin" && (
        <Link href="/admin/users" className="staff-card admin-link">
          <strong>{text.admin.homeLink}</strong>
          <span className="muted">{text.admin.homeHint}</span>
        </Link>
      )}
      <div className="staff-card">
        <p>{text.home.staffSoon}</p>
      </div>
    </section>
  );
}

export default function HomePage() {
  // Reading the login cookie is request-time data, so it streams inside a Suspense boundary.
  return (
    <Suspense
      fallback={
        <main className="page">
          <p className="muted">{text.home.loading}</p>
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
      <header className="header">
        <div className="brand">
          <Image src="/logo.png" alt="" width={44} height={50} priority />
          <span>{text.appShortName}</span>
        </div>
        <form action={logout}>
          <button type="submit" className="button secondary">
            {text.home.logout}
          </button>
        </form>
      </header>

      {user.role === "kid" ? <KidHome user={user} /> : <StaffHome user={user} />}
    </main>
  );
}
