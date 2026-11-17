"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { pruneGroups } from "@/lib/recent-groups.mjs";
import { matchesName } from "@/lib/search.mjs";
import { DEFAULT_AMOUNT, MAX_AMOUNT, MAX_NOTE_LENGTH } from "@/lib/star-limits";
import { arabicNumber, firstName, gradeLabel, kidsCount, starsCount, text } from "@/lib/strings";
import { awardStars, listRecent, voidAwards } from "./actions";
import type { BranchItem, KidItem, ReasonItem, RecentGroup } from "./types";

const t = text.stars;
const GRADES = [3, 4, 5, 6];

function Glyph({ emoji, imageUrl }: { emoji: string | null; imageUrl: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" width={28} height={28} />;
  }
  return <>{emoji ?? "⭐"}</>;
}

/** "أحمد، مينا" or "أحمد، مينا و٣ كمان". */
function whoLabel(names: string[]): string {
  const firsts = names.map(firstName);
  if (firsts.length <= 3) return firsts.join("، ");
  return `${firsts.slice(0, 2).join("، ")} ${t.andMore(firsts.length - 2)}`;
}

type Message = { kind: "ok" | "error"; text: string; undoIds?: number[] };
type Listing = { query: string; groups: RecentGroup[]; hasMore: boolean; error?: string };

/** One "give stars" tap in the history: cancel all of it, or open the names and cancel a single kid. Always asks first. */
function RecentItem({
  group,
  query,
  busy,
  onUndo,
}: {
  group: RecentGroup;
  query: string;
  busy: boolean;
  onUndo: (ids: number[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<"all" | number | null>(null);

  const many = group.kids.length > 1;
  const matched = query ? group.kids.filter((name) => matchesName(name, query)) : [];

  async function cancel(ids: number[]) {
    await onUndo(ids);
    setConfirm(null);
  }

  const confirmButtons = (ids: number[]) => (
    <span className="recent-confirm">
      <button type="button" className="button small" disabled={busy} onClick={() => cancel(ids)}>
        {t.yesUndo}
      </button>
      <button type="button" className="button secondary small" disabled={busy} onClick={() => setConfirm(null)}>
        {t.noKeep}
      </button>
    </span>
  );

  return (
    <li className="recent-item">
      <div className="recent-main">
        <strong>{whoLabel(group.kids)}</strong>
        <div className="muted">
          {group.reason}
          {group.branch ? ` · ${group.branch}` : ""} · {starsCount(group.amount)} · {group.when}
        </div>
        {matched.length > 0 && (
          <div className="recent-match">
            {t.matched(matched.length <= 2 ? matched.join("، ") : `${matched.slice(0, 2).join("، ")} ${t.andMore(matched.length - 2)}`)}
          </div>
        )}
        {many && (
          <button type="button" className="stars-link" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? t.hideNames : t.showNames(group.kids.length)}
          </button>
        )}
        {open && (
          <ul className="recent-names">
            {group.kids.map((name, i) => (
              <li key={group.ids[i]} data-match={query !== "" && matchesName(name, query)}>
                <strong>{name}</strong>
                {confirm === group.ids[i] ? (
                  <span className="recent-confirm">
                    <span>{t.confirmUndoOne(firstName(name))}</span>
                    {confirmButtons([group.ids[i]])}
                  </span>
                ) : (
                  <button type="button" className="button secondary small" disabled={busy} onClick={() => setConfirm(group.ids[i])}>
                    {t.undoOne}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="recent-actions">
        {confirm === "all" ? (
          <>
            <span>{t.confirmUndoAll(group.kids.length)}</span>
            {confirmButtons(group.ids)}
          </>
        ) : (
          <button type="button" className="button secondary" disabled={busy} onClick={() => setConfirm("all")}>
            {many ? t.undoAll : t.undo}
          </button>
        )}
      </div>
    </li>
  );
}

export default function StarsBoard({
  kids,
  reasons,
  branches,
  recent,
  recentHasMore,
}: {
  kids: KidItem[];
  reasons: ReasonItem[];
  branches: BranchItem[];
  recent: RecentGroup[];
  recentHasMore: boolean;
}) {
  const [grade, setGrade] = useState<number>(() => GRADES.find((g) => kids.some((k) => k.grade === g)) ?? 0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reasonId, setReasonId] = useState<number | null>(reasons[0]?.id ?? null);
  const [amountText, setAmountText] = useState(String(DEFAULT_AMOUNT));
  const [branchId, setBranchId] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, startTransition] = useTransition();

  // History ("آخر اللي اديته"): the newest page comes from the server with the screen; searching and "show more" ask the server.
  const [recentQuery, setRecentQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Listing | null>(null);
  const [more, setMore] = useState<{ key: string; groups: RecentGroup[]; hasMore: boolean } | null>(null);
  const [cancelled, setCancelled] = useState<Set<number>>(new Set());
  const [undoing, setUndoing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // When the server sends a fresh first page (after giving or cancelling), pages loaded earlier are dropped with it.
  const recentKey = recent.map((g) => g.gid).join(",");
  const moreNow = more && more.key === recentKey ? more : null;
  const trimmedQuery = recentQuery.trim();
  const searching = trimmedQuery !== "" && searchResult?.query !== trimmedQuery;
  const listing: Listing =
    trimmedQuery === ""
      ? { query: "", groups: [...recent, ...(moreNow?.groups ?? [])], hasMore: moreNow ? moreNow.hasMore : recentHasMore }
      : searchResult?.query === trimmedQuery
        ? searchResult
        : { query: trimmedQuery, groups: [], hasMore: false };
  const shownRecent = pruneGroups(listing.groups, cancelled);

  useEffect(() => {
    if (trimmedQuery === "") return;
    let stale = false;
    // Waits for a short pause in typing, so every letter doesn't hit the server.
    const timer = setTimeout(async () => {
      let next: Listing;
      try {
        const r = await listRecent({ query: trimmedQuery, offset: 0 });
        next = r.ok ? { query: trimmedQuery, groups: r.groups, hasMore: r.hasMore } : { query: trimmedQuery, groups: [], hasMore: false, error: r.error };
      } catch {
        next = { query: trimmedQuery, groups: [], hasMore: false, error: t.errors.generic };
      }
      if (!stale) setSearchResult(next);
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [trimmedQuery]);

  const reason = reasons.find((r) => r.id === reasonId);

  const visible = useMemo(() => {
    return kids.filter((k) => (grade === 0 || k.grade === grade) && matchesName(k.name, query));
  }, [kids, grade, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((k) => selected.has(k.id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of visible) {
        if (allVisibleSelected) next.delete(k.id);
        else next.add(k.id);
      }
      return next;
    });
  }

  function step(by: number) {
    const current = Number(amountText);
    const base = Number.isInteger(current) ? current : DEFAULT_AMOUNT;
    setAmountText(String(Math.min(MAX_AMOUNT, Math.max(1, base + by))));
  }

  function give() {
    if (pending || reasonId === null) return;
    const amount = Number(amountText);
    if (selected.size === 0) return setMessage({ kind: "error", text: t.errors.noKids });
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
      return setMessage({ kind: "error", text: t.errors.badAmount(MAX_AMOUNT) });
    }

    const chosen = kids.filter((k) => selected.has(k.id));
    setMessage(null);
    startTransition(async () => {
      const result = await awardStars({
        kidIds: chosen.map((k) => k.id),
        reasonId,
        amount,
        branchId: reason?.isCompetition && branchId ? Number(branchId) : null,
        note,
      });
      if (result.ok) {
        setSelected(new Set());
        setNote("");
        setShowNote(false);
        setRecentQuery("");
        setSearchResult(null);
        const who = chosen.length === 1 ? firstName(chosen[0].name) : kidsCount(chosen.length);
        setMessage({ kind: "ok", text: t.done(amount, who), undoIds: result.ids });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  /** Cancels awards (the server only allows this servant's own awards of this term) and hides them right away. */
  async function undoIds(ids: number[]): Promise<boolean> {
    if (undoing) return false;
    setUndoing(true);
    try {
      const result = await voidAwards(ids);
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return false;
      }
      setCancelled((prev) => new Set([...prev, ...ids]));
      setMessage({ kind: "ok", text: t.undone });
      return true;
    } catch {
      setMessage({ kind: "error", text: t.errors.generic });
      return false;
    } finally {
      setUndoing(false);
    }
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      // The server counts only entries that still exist, and so does shownRecent.
      const r = await listRecent({ query: trimmedQuery, offset: shownRecent.length });
      if (!r.ok) {
        setMessage({ kind: "error", text: r.error });
        return;
      }
      const have = new Set(listing.groups.map((g) => g.gid));
      const fresh = r.groups.filter((g) => !have.has(g.gid));
      if (trimmedQuery === "") {
        setMore({ key: recentKey, groups: [...(moreNow?.groups ?? []), ...fresh], hasMore: r.hasMore });
      } else {
        setSearchResult((prev) => (prev && prev.query === trimmedQuery ? { ...prev, groups: [...prev.groups, ...fresh], hasMore: r.hasMore } : prev));
      }
    } catch {
      setMessage({ kind: "error", text: t.errors.generic });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <div className="stars-tabs" role="group" aria-label={gradeLabel(grade) || t.gradeAll}>
        {GRADES.map((g) => (
          <button key={g} type="button" className="chip" aria-pressed={grade === g} onClick={() => setGrade(g)}>
            {gradeLabel(g)}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={grade === 0} onClick={() => setGrade(0)}>
          {t.gradeAll}
        </button>
      </div>

      <label className="field stars-search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          autoComplete="off"
        />
      </label>

      <div className="stars-tools">
        <button type="button" className="button secondary" onClick={selectVisible} disabled={visible.length === 0}>
          {allVisibleSelected ? t.clear : t.selectAll}
        </button>
        {selected.size > 0 && !allVisibleSelected && (
          <button type="button" className="button secondary" onClick={() => setSelected(new Set())}>
            {t.clear}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="muted stars-empty">{t.noKids}</p>
      ) : (
        <ul className="kid-list">
          {visible.map((k) => {
            const on = selected.has(k.id);
            return (
              <li key={k.id}>
                <button type="button" className="kid-row" aria-pressed={on} onClick={() => toggle(k.id)}>
                  <span className="kid-glyph" aria-hidden="true">
                    <Glyph emoji={k.emoji} imageUrl={k.imageUrl} />
                  </span>
                  <span className="kid-name">
                    {k.name}
                    {grade === 0 && <span className="kid-meta"> · {gradeLabel(k.grade)}</span>}
                  </span>
                  <span className="kid-total">{arabicNumber(k.total)}</span>
                  <span className="kid-check" aria-hidden="true">
                    {on ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section className="give-bar" aria-label={t.give}>
        {message && (
          <div className={message.kind === "ok" ? "success stars-notice" : "error stars-notice"} role="status">
            <span>{message.text}</span>
            {message.undoIds && (
              <button type="button" className="button secondary" disabled={pending || undoing} onClick={() => undoIds(message.undoIds!)}>
                {t.undo}
              </button>
            )}
          </div>
        )}

        <p className="stars-selected">{selected.size === 0 ? t.nobodySelected : t.selected(selected.size)}</p>

        <div className="stars-reasons" role="group" aria-label={t.reason}>
          {reasons.map((r) => (
            <button key={r.id} type="button" className="chip" aria-pressed={reasonId === r.id} onClick={() => setReasonId(r.id)}>
              {r.name}
            </button>
          ))}
        </div>

        <div className="stars-row">
          <div className="stepper" role="group" aria-label={t.amount}>
            <button type="button" aria-label={t.minus} onClick={() => step(-1)}>
              −
            </button>
            <input
              inputMode="numeric"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
              aria-label={t.amount}
            />
            <button type="button" aria-label={t.plus} onClick={() => step(1)}>
              +
            </button>
          </div>

          {reason?.isCompetition && (
            <label className="field stars-branch">
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label={t.branch}>
                <option value="">{t.generalBranch}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {showNote ? (
          <label className="field">
            <input
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.note}
              aria-label={t.note}
              autoComplete="off"
            />
          </label>
        ) : (
          <button type="button" className="stars-link" onClick={() => setShowNote(true)}>
            {t.addNote}
          </button>
        )}

        <button type="button" className="button" onClick={give} disabled={pending || selected.size === 0 || reasonId === null}>
          {pending ? t.giving : t.give}
        </button>
      </section>

      <section className="stars-recent">
        <h2>{t.recentTitle}</h2>
        <p className="muted">{t.recentHint}</p>

        <label className="field">
          <input
            type="search"
            value={recentQuery}
            onChange={(e) => setRecentQuery(e.target.value)}
            placeholder={t.recentSearch}
            aria-label={t.recentSearch}
            autoComplete="off"
          />
        </label>

        {listing.error ? (
          <p className="error">{listing.error}</p>
        ) : shownRecent.length === 0 ? (
          <p className="muted">{searching ? t.recentSearching : trimmedQuery !== "" ? t.recentNoMatch : t.recentEmpty}</p>
        ) : (
          <ul className="recent-list">
            {shownRecent.map((g) => (
              <RecentItem key={g.gid} group={g} query={trimmedQuery} busy={pending || undoing} onUndo={undoIds} />
            ))}
          </ul>
        )}

        {listing.hasMore && !listing.error && (
          <button type="button" className="button secondary stars-more" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? t.giving : t.recentMore}
          </button>
        )}
      </section>
    </>
  );
}
