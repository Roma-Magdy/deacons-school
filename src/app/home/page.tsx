import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { arabicNumber, gradeLabel, greeting, roleLabel, text } from "@/lib/strings";
import { logout } from "../actions";
import { getActiveTermId, getBoard } from "@/lib/leaderboard";
import { accountText } from "@/lib/account-text";
import { awardsText } from "@/lib/awards-text";
import { leaderboardText } from "@/lib/leaderboard-text";
import { reasonsText } from "@/lib/reasons-text";
import StarChart from "./star-chart";

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
  const [{ rows: totals }, { rows: shapes }, { rows: chartRows }] = await Promise.all([
    db.query(
      "select coalesce(sum(amount), 0)::int as total from star_awards where kid_id = $1 and voided_at is null",
      [user.id],
    ),
    db.query(
      // The kid's chosen shape, or the first free one if they haven't picked yet.
      `select name_ar, emoji, image_url from shapes
        where id = coalesce($1::bigint, (select id from shapes where stars_required = 0 and not is_hidden order by sort_order limit 1))`,
      [user.shapeId],
    ),
    // Stars per reason for the chart: every active reason gets a column, even with 0 stars. A reason that was switched off
    // later still shows if this kid earned stars for it, so the chart always adds up to the total above it.
    db.query(
      `select r.id, r.name_ar, coalesce(sum(sa.amount), 0)::int as total
         from reasons r
         left join star_awards sa on sa.reason_id = r.id and sa.kid_id = $1 and sa.voided_at is null
        group by r.id, r.name_ar, r.sort_order, r.is_active
       having r.is_active or sum(sa.amount) > 0
        order by r.sort_order, r.id`,
      [user.id],
    ),
  ]);
  const columns = chartRows.map((r) => ({ id: Number(r.id), name: r.name_ar as string, total: r.total as number }));
  const total: number = totals[0].total;
  const shape: ShapeRow | undefined = shapes[0];

  // The kid's place in their grade for the current term.
  const termId = await getActiveTermId();
  const board = termId === null ? [] : await getBoard(user.grade as number, { termId });
  const myPlace = board.find((r) => r.id === user.id)?.place ?? null;

  // The next shape the kid can unlock with more stars.
  const { rows: next } = await db.query(
    `select name_ar, emoji, image_url, stars_required from shapes
      where stars_required > $1 and not is_hidden order by stars_required limit 1`,
    [total],
  );
  const nextShape: (ShapeRow & { stars_required: number }) | undefined = next[0];

  return (
    <section className="kid-hero">
      <h1 className="kid-greeting">{greeting(user)}</h1>
      {user.grade && <span className="kid-grade">{gradeLabel(user.grade)}</span>}

      {/* The big circle is the way to change the shape: a real link, so keyboards and screen readers can use it too. */}
      <Link href="/shapes" className="shape-bubble" aria-label={text.home.changeShape}>
        <ShapeGlyph shape={shape} size={100} />
        <span className="shape-bubble-badge" aria-hidden="true">
          🎨
        </span>
      </Link>
      <p className="kid-hint">{text.home.changeShapeHint}</p>

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

      <StarChart columns={columns} shape={shape ? { emoji: shape.emoji, imageUrl: shape.image_url } : null} />

      <div className="kid-links">
        <Link href="/history" className="button">
          {text.home.history}
        </Link>
      </div>

      <Link href="/leaderboard" className="kid-rank">
        {myPlace === null ? leaderboardText.homeNoRank : leaderboardText.homeRank(myPlace)}
      </Link>
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
      {user.role === "admin" && (
        <Link href="/admin/terms" className="staff-card admin-link">
          <strong>{text.admin.terms.homeLink}</strong>
          <span className="muted">{text.admin.terms.homeHint}</span>
        </Link>
      )}
      {user.role === "admin" && (
        <Link href="/admin/awards" className="staff-card admin-link">
          <strong>{awardsText.homeLink}</strong>
          <span className="muted">{awardsText.homeHint}</span>
        </Link>
      )}
      {user.role === "admin" && (
        <Link href="/admin/reasons" className="staff-card admin-link">
          <strong>{reasonsText.homeLink}</strong>
          <span className="muted">{reasonsText.homeHint}</span>
        </Link>
      )}
      {user.role === "admin" && (
        <Link href="/admin/shapes" className="staff-card admin-link">
          <strong>{text.admin.shapes.homeLink}</strong>
          <span className="muted">{text.admin.shapes.homeHint}</span>
        </Link>
      )}
      <Link href="/leaderboard" className="staff-card admin-link">
        <strong>{leaderboardText.homeLink}</strong>
        <span className="muted">{leaderboardText.homeHint}</span>
      </Link>
      <Link href="/stars" className="staff-card admin-link">
        <strong>{text.stars.homeLink}</strong>
        <span className="muted">{text.stars.homeHint}</span>
      </Link>
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
  // A new account sees the "choose your own password" screen once. It can be skipped, so nothing else is blocked.
  if (user.passwordPrompt) redirect("/password");

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <Image src="/logo.png" alt="" width={44} height={50} priority />
          <span>{text.appShortName}</span>
        </div>
        <div className="header-actions">
          <Link href="/password" className="button secondary">
            {accountText.headerLink}
          </Link>
          <form action={logout}>
            <button type="submit" className="button secondary">
              {text.home.logout}
            </button>
          </form>
        </div>
      </header>

      {user.role === "kid" ? <KidHome user={user} /> : <StaffHome user={user} />}
    </main>
  );
}
