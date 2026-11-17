import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../admin/_components/admin-header";
import StarsBoard from "./stars-board";
import { loadRecent } from "./recent";
import type { BranchItem, KidItem, ReasonItem } from "./types";

export const metadata = { title: text.stars.pageTitle };

export default function StarsPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <StarsContent />
    </Suspense>
  );
}

async function StarsContent() {
  const user = await requireStaff();

  const [kidRows, reasonRows, branchRows, termRows, recent] = await Promise.all([
    db.query(
      `select u.id, u.full_name, u.grade, coalesce(t.total, 0)::int as total, s.emoji, s.image_url
         from users u
         left join (select kid_id, sum(amount) as total from star_awards where voided_at is null group by kid_id) t on t.kid_id = u.id
         left join shapes s on s.id = coalesce(u.shape_id, (select id from shapes where stars_required = 0 and not is_hidden order by sort_order limit 1))
        where u.role = 'kid' and u.is_active`,
    ),
    db.query("select id, name_ar, is_competition from reasons where is_active order by sort_order, id"),
    db.query("select id, name_ar from branches where is_active order by sort_order, id"),
    db.query("select id from terms where is_active"),
    // The newest few "give stars" taps; the screen loads more, or searches, from the server when asked.
    loadRecent(user.id, "", 0),
  ]);

  const kids: KidItem[] = kidRows.rows
    .map((r) => ({
      id: Number(r.id),
      name: r.full_name as string,
      grade: Number(r.grade),
      total: r.total as number,
      emoji: (r.emoji as string | null) ?? null,
      imageUrl: (r.image_url as string | null) ?? null,
    }))
    .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "ar"));

  const reasons: ReasonItem[] = reasonRows.rows.map((r) => ({
    id: Number(r.id),
    name: r.name_ar as string,
    isCompetition: r.is_competition as boolean,
  }));
  const branches: BranchItem[] = branchRows.rows.map((r) => ({ id: Number(r.id), name: r.name_ar as string }));

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={text.admin.backHome} />
      <h1 className="page-title-single">{text.stars.pageTitle}</h1>
      {termRows.rows.length === 0 && <p className="error">{text.stars.noTerm}</p>}
      <StarsBoard kids={kids} reasons={reasons} branches={branches} recent={recent.groups} recentHasMore={recent.hasMore} />
    </main>
  );
}
