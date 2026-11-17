"use client";

import { useMemo, useState, useTransition } from "react";
import { GRADES, parseYear, planPromotion } from "@/lib/promotion.mjs";
import { arabicNumber, gradeLabel, text } from "@/lib/strings";
import { promoteSchoolYear, undoPromotion } from "../bulk-actions";

const t = text.admin.promote;

export type PromoteKid = { id: number; name: string; grade: number };
export type LastPromotion = { id: number; year: number; when: string; count: number; undone: boolean; daysAgo: number };

/** Short grade names for the preview ("تالتة" instead of "تالتة ابتدائي"). */
const shortGrade = (g: number) => gradeLabel(g).replace(" ابتدائي", "");

type Notice = { kind: "ok" | "error"; text: string };

export default function PromoteForm({ kids, defaultYear, last }: { kids: PromoteKid[]; defaultYear: number; last: LastPromotion | null }) {
  const [yearText, setYearText] = useState(String(defaultYear));
  const [stay, setStay] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  // The latest promotion that can still be undone (the one that was just done, or the last one found in the database).
  const [undoable, setUndoable] = useState<number | null>(last && !last.undone ? last.id : null);
  const [lastInfo, setLastInfo] = useState(last);
  // After a promotion the preview on screen is out of date, so it is hidden until the page is reloaded.
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const year = parseYear(yearText);
  const plan = useMemo(() => planPromotion(kids, stay), [kids, stay]);
  const graduating = plan.counts[6];
  const recent = lastInfo && !lastInfo.undone && lastInfo.daysAgo < 60;

  function toggle(id: number) {
    setAsking(false);
    setStay((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function promote() {
    if (year === null) return;
    setNotice(null);
    startTransition(async () => {
      const r = await promoteSchoolYear(year, [...stay]);
      setAsking(false);
      if (r.ok) {
        setNotice({ kind: "ok", text: t.doneLine(r.promoted, r.graduated) });
        setUndoable(r.promotionId);
        setLastInfo({ id: r.promotionId, year, when: "", count: r.promoted + r.graduated, undone: false, daysAgo: 0 });
        setDone(true);
      } else {
        setNotice({ kind: "error", text: r.error });
      }
    });
  }

  function undo() {
    if (undoable === null) return;
    const id = undoable;
    setNotice(null);
    startTransition(async () => {
      const r = await undoPromotion(id);
      if (r.ok) {
        setNotice({ kind: "ok", text: t.undone(r.restored) + (r.skipped > 0 ? " " + t.undoSkipped(r.skipped) : "") });
        setUndoable(null);
        setLastInfo((prev) => (prev ? { ...prev, undone: true } : prev));
        // The kids on screen were loaded before the promotion; reloading shows their restored grades.
        window.location.reload();
      } else {
        setNotice({ kind: "error", text: r.error });
      }
    });
  }

  return (
    <div className="stack">
      <section className="staff-card">
        <p className="muted">{t.intro}</p>
      </section>

      {notice && (
        <p className={notice.kind === "ok" ? "success" : "error"} role="status">
          {notice.text}
        </p>
      )}

      {undoable !== null && lastInfo && (
        <section className="staff-card form">
          <h2>{t.lastTitle}</h2>
          {lastInfo.when !== "" && <p className="muted">{t.lastLine(lastInfo.when, lastInfo.count, lastInfo.year)}</p>}
          <p className="muted">{t.undoHint}</p>
          <button type="button" className="button danger-outline" onClick={undo} disabled={pending}>
            {pending ? t.undoing : t.undo}
          </button>
        </section>
      )}

      {!done && (
        <>
          <section className="staff-card form">
            <label className="field">
              <span>{t.yearLabel}</span>
              <input inputMode="numeric" dir="ltr" value={yearText} onChange={(e) => { setYearText(e.target.value.replace(/\D/g, "").slice(0, 4)); setAsking(false); }} />
            </label>
            {year === null && <p className="error">{t.errors.badYear}</p>}
          </section>

          <section className="staff-card form">
            <h2>{t.previewTitle}</h2>
            <ul className="promo-preview">
              {GRADES.map((g) => (
                <li key={g}>
                  {t.moveLine(shortGrade(g), g === 6 ? t.graduateTo(year ?? defaultYear) : shortGrade(g + 1), plan.counts[g])}
                </li>
              ))}
            </ul>
            {plan.stays > 0 && <p className="muted">{t.staysCount(plan.stays)}</p>}
          </section>

          <section className="staff-card form">
            <h2>{t.staysTitle}</h2>
            <p className="muted">{t.staysHint}</p>
            {GRADES.map((g) => {
              const inGrade = kids.filter((k) => k.grade === g);
              if (inGrade.length === 0) return null;
              const shown = open === g;
              return (
                <div key={g} className="promo-grade">
                  <button type="button" className="button secondary" onClick={() => setOpen(shown ? null : g)} aria-expanded={shown}>
                    {shortGrade(g)} ({arabicNumber(inGrade.length)}) · {shown ? t.hideKids : t.showKids}
                  </button>
                  {shown && (
                    <ul className="promo-kids">
                      {inGrade.map((k) => (
                        <li key={k.id}>
                          <label className="check-line">
                            <input type="checkbox" checked={stay.has(k.id)} onChange={() => toggle(k.id)} />
                            <span>{k.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>

          <section className="staff-card form">
            {recent && lastInfo && <p className="error">{t.recentWarning(lastInfo.when || t.doneTitle)}</p>}
            {plan.moves.length === 0 ? (
              <p className="muted">{t.nothing}</p>
            ) : asking && year !== null ? (
              <>
                <p className="error" role="alert">
                  {graduating > 0 ? t.confirmAsk(plan.moves.length, year) : t.confirmAskNoGraduates(plan.moves.length)}
                </p>
                <div className="actions">
                  <button type="button" className="button" onClick={promote} disabled={pending}>
                    {pending ? t.working : t.confirmYes}
                  </button>
                  <button type="button" className="button secondary" onClick={() => setAsking(false)} disabled={pending}>
                    {t.confirmNo}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="button" onClick={() => setAsking(true)} disabled={pending || year === null}>
                {t.confirm(plan.moves.length)}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
