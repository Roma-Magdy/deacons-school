"use client";

import { useMemo, useState, useTransition } from "react";
import { DEFAULT_AMOUNT, MAX_AMOUNT, MAX_NOTE_LENGTH } from "@/lib/star-limits";
import { arabicNumber, firstName, gradeLabel, kidsCount, starsCount, text } from "@/lib/strings";
import { awardStars, voidAwards } from "./actions";
import type { BranchItem, KidItem, ReasonItem, RecentGroup } from "./types";

const t = text.stars;
const GRADES = [3, 4, 5, 6];

/** Makes Arabic search forgiving: ignores diacritics and treats أ/إ/آ, ى/ي and ة/ه as the same letter. */
function normalize(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .trim();
}

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

export default function StarsBoard({
  kids,
  reasons,
  branches,
  recent,
}: {
  kids: KidItem[];
  reasons: ReasonItem[];
  branches: BranchItem[];
  recent: RecentGroup[];
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

  const reason = reasons.find((r) => r.id === reasonId);

  const visible = useMemo(() => {
    const q = normalize(query);
    return kids.filter((k) => (grade === 0 || k.grade === grade) && (q === "" || normalize(k.name).includes(q)));
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
        const who = chosen.length === 1 ? firstName(chosen[0].name) : kidsCount(chosen.length);
        setMessage({ kind: "ok", text: t.done(amount, who), undoIds: result.ids });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  function undo(ids: number[]) {
    if (pending) return;
    startTransition(async () => {
      const result = await voidAwards(ids);
      setMessage(result.ok ? { kind: "ok", text: t.undone } : { kind: "error", text: result.error });
    });
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
              <button type="button" className="button secondary" disabled={pending} onClick={() => undo(message.undoIds!)}>
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
        {recent.length === 0 ? (
          <p className="muted">{t.recentEmpty}</p>
        ) : (
          <ul className="recent-list">
            {recent.map((g) => (
              <li key={g.ids[0]} className="recent-item">
                <div>
                  <strong>{whoLabel(g.kids)}</strong>
                  <div className="muted">
                    {g.reason}
                    {g.branch ? ` · ${g.branch}` : ""} · {starsCount(g.amount)} · {g.when}
                  </div>
                </div>
                <button type="button" className="button secondary" disabled={pending} onClick={() => undo(g.ids)}>
                  {t.undo}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
