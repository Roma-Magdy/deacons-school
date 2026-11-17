import Link from "next/link";
import { Suspense } from "react";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveTermId, getBoard, type BoardRow } from "@/lib/leaderboard";
import { leaderboardText as t } from "@/lib/leaderboard-text";
import { arabicNumber, gradeLabel, starsCount } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../admin/_components/admin-header";

export const metadata = { title: t.title };

const SHOWN = 10;
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type Params = { reason?: string; branch?: string; grade?: string };

export default function LeaderboardPage({ searchParams }: { searchParams: Promise<Params> }) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <LeaderboardContent searchParams={searchParams} />
    </Suspense>
  );
}

function href(p: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/leaderboard?${s}` : "/leaderboard";
}

function Glyph({ row }: { row: BoardRow }) {
  if (row.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={row.imageUrl} alt="" width={28} height={28} />;
  }
  return <>{row.emoji ?? "⭐"}</>;
}

function Row({ row, me }: { row: BoardRow; me: boolean }) {
  return (
    <li className={me ? "user-row board-row is-me" : "user-row board-row"}>
      <span className="board-place" aria-label={`${t.yourPlace} ${arabicNumber(row.place)}`}>
        {MEDALS[row.place] ?? t.place(row.place)}
      </span>
      <span className="board-glyph" aria-hidden="true">
        <Glyph row={row} />
      </span>
      <span className="user-main">
        <strong>{row.name}</strong>
      </span>
      <span className="history-amount">{t.stars(row.total)}</span>
      <span className="sr-only">{starsCount(row.total)}</span>
    </li>
  );
}

async function LeaderboardContent({ searchParams }: { searchParams: Promise<Params> }) {
  const user: CurrentUser = await requireUser();
  const sp = await searchParams;

  // A kid always sees their own grade. Servants and admins pick one.
  const grade = user.role === "kid" ? (user.grade as number) : [3, 4, 5, 6].includes(Number(sp.grade)) ? Number(sp.grade) : 3;

  // Stars always compete within the current term.
  const termId = await getActiveTermId();

  const { rows: branches } = await db.query("select id, name_ar from branches where is_active order by sort_order, id");
  const { rows: reasons } = await db.query("select id, name_ar, is_competition from reasons where is_active order by sort_order, id");

  // Top row: all stars, then one board per reason. A competition reason also gets a row of branches under it.
  const reason = reasons.find((r) => String(r.id) === sp.reason);
  const reasonId = reason ? Number(reason.id) : undefined;
  const showBranches = reason?.is_competition === true;
  const branch = showBranches ? branches.find((b) => String(b.id) === sp.branch) : undefined;
  const branchId = branch ? Number(branch.id) : undefined;

  const rowsAll = termId === null ? [] : await getBoard(grade, { termId, reasonId, branchId });

  const top = rowsAll.slice(0, SHOWN);
  const mine = rowsAll.find((r) => r.id === user.id);
  const mineOutside = mine && !top.some((r) => r.id === mine.id);

  const keep = { grade: user.role === "kid" ? undefined : String(grade) };

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={t.back} />
      <h1 className="page-title-single">{t.title}</h1>
      <p className="muted">{gradeLabel(grade)}</p>

      {user.role !== "kid" && (
        <div className="stars-tabs" role="group" aria-label={t.gradeLabel}>
          {[3, 4, 5, 6].map((g) => (
            <Link key={g} href={href({ ...keep, grade: String(g) })} className="chip" aria-current={g === grade ? "true" : undefined}>
              {gradeLabel(g)}
            </Link>
          ))}
        </div>
      )}

      <div className="stars-tabs" role="group" aria-label={t.title}>
        <Link href={href(keep)} className="chip" aria-current={reasonId === undefined ? "true" : undefined}>
          {t.allStars}
        </Link>
        {reasons.map((r) => (
          <Link key={String(r.id)} href={href({ ...keep, reason: String(r.id) })} className="chip" aria-current={Number(r.id) === reasonId ? "true" : undefined}>
            {r.name_ar as string}
          </Link>
        ))}
      </div>

      {showBranches && (
        <div className="stars-tabs" role="group" aria-label={reason?.name_ar as string}>
          <Link href={href({ ...keep, reason: String(reasonId) })} className="chip" aria-current={branchId === undefined ? "true" : undefined}>
            {t.allBranches}
          </Link>
          {branches.map((b) => (
            <Link
              key={String(b.id)}
              href={href({ ...keep, reason: String(reasonId), branch: String(b.id) })}
              className="chip"
              aria-current={Number(b.id) === branchId ? "true" : undefined}
            >
              {b.name_ar as string}
            </Link>
          ))}
        </div>
      )}
      {termId === null && <p className="error">{t.noTerm}</p>}

      {top.length === 0 ? (
        <p className="staff-card">{t.empty}</p>
      ) : (
        <ul className="user-list board-list">
          {top.map((r) => (
            <Row key={r.id} row={r} me={r.id === user.id} />
          ))}
          {mineOutside && mine && (
            <>
              <li className="board-gap" aria-hidden="true">
                ⋮
              </li>
              <Row row={mine} me />
            </>
          )}
        </ul>
      )}
      {user.role === "kid" && !mine && top.length > 0 && <p className="muted">{t.noStarsYet}</p>}
    </main>
  );
}
