"use client";

import { useMemo, useState, useTransition } from "react";
import { downloadCsv } from "@/lib/download-csv";
import { matchesQuery } from "@/lib/search.mjs";
import { gradeLabel, text, type Gender } from "@/lib/strings";
import { deleteGraduates, graduateHistory, restoreGraduates } from "../bulk-actions";

const t = text.admin.archive;

export type Graduate = { id: number; name: string; phone: string; gender: Gender | null; grade: number; year: number; total: number };

type Notice = { kind: "ok" | "error"; text: string };

export default function ArchiveBoard({ graduates }: { graduates: Graduate[] }) {
  // Newest class first. Each class is named by the year it graduated.
  const years = useMemo(() => [...new Set(graduates.map((g) => g.year))].sort((a, b) => b - a), [graduates]);
  const [year, setYear] = useState<number>(years[0] ?? 0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Kids whose star history was exported in this visit. Deleting is only allowed for these.
  const [exportedIds, setExportedIds] = useState<Set<number>>(new Set());
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, startTransition] = useTransition();

  // If the class on screen was just emptied, move to the newest class that still has kids.
  const activeYear = years.includes(year) ? year : (years[0] ?? 0);
  const inYear = useMemo(() => graduates.filter((g) => g.year === activeYear), [graduates, activeYear]);
  const visible = useMemo(() => inYear.filter((g) => matchesQuery(g, query)), [inYear, query]);
  const allVisibleSelected = visible.length > 0 && visible.every((g) => selected.has(g.id));

  // Only kids still in the archive can be selected, whatever was selected before a refresh.
  const chosen = graduates.filter((g) => selected.has(g.id));
  const chosenStars = chosen.reduce((sum, g) => sum + g.total, 0);
  const exportTargets = chosen.length > 0 ? chosen : inYear;
  const allExported = chosen.length > 0 && chosen.every((g) => exportedIds.has(g.id));

  if (graduates.length === 0) {
    return <p className="staff-card">{t.empty}</p>;
  }

  function changeYear(next: number) {
    setYear(next);
    setSelected(new Set());
    setAsking(false);
    setNotice(null);
  }

  function toggle(id: number) {
    setAsking(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setAsking(false);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const g of visible) {
        if (allVisibleSelected) next.delete(g.id);
        else next.add(g.id);
      }
      return next;
    });
  }

  function exportList() {
    const rows: string[][] = [[t.csv.name, t.csv.phone, t.csv.gender, t.csv.grade, t.csv.year, t.csv.totalStars]];
    for (const g of exportTargets) {
      rows.push([g.name, g.phone, g.gender === "female" ? t.csv.female : g.gender === "male" ? t.csv.male : "", gradeLabel(g.grade), String(g.year), String(g.total)]);
    }
    downloadCsv(`graduates-${chosen.length > 0 ? "selected" : activeYear}.csv`, rows);
    setNotice({ kind: "ok", text: t.exported });
  }

  function exportHistory() {
    const targets = exportTargets;
    setNotice(null);
    startTransition(async () => {
      const r = await graduateHistory(targets.map((g) => g.id));
      if (!r.ok) return setNotice({ kind: "error", text: r.error });

      const byId = new Map(targets.map((g) => [g.id, g]));
      const rows: string[][] = [[t.csv.name, t.csv.phone, t.csv.year, t.csv.totalStars, t.csv.date, t.csv.reason, t.csv.branch, t.csv.amount, t.csv.term, t.csv.note]];
      const withStars = new Set<number>();
      for (const h of r.rows) {
        const g = byId.get(h.kidId);
        if (!g) continue;
        withStars.add(g.id);
        rows.push([g.name, g.phone, String(g.year), String(g.total), h.date, h.reason, h.branch, String(h.amount), h.term, h.note]);
      }
      // Kids with no stars still get a line, so the file really lists everyone.
      for (const g of targets) if (!withStars.has(g.id)) rows.push([g.name, g.phone, String(g.year), "0", "", "", "", "", "", ""]);

      downloadCsv(`graduates-history-${chosen.length > 0 ? "selected" : activeYear}.csv`, rows);
      setExportedIds((prev) => new Set([...prev, ...targets.map((g) => g.id)]));
      setNotice({ kind: "ok", text: t.exported });
    });
  }

  function restore() {
    const ids = [...selected];
    setNotice(null);
    startTransition(async () => {
      const r = await restoreGraduates(ids);
      if (r.ok) {
        setNotice({ kind: "ok", text: t.restored(r.count) });
        setSelected(new Set());
      } else setNotice({ kind: "error", text: r.error });
    });
  }

  function remove() {
    const ids = [...selected];
    setNotice(null);
    startTransition(async () => {
      const r = await deleteGraduates(ids);
      setAsking(false);
      if (r.ok) {
        setNotice({ kind: "ok", text: t.deleted(r.count) });
        setSelected(new Set());
      } else setNotice({ kind: "error", text: r.error });
    });
  }

  return (
    <>
      <p className="muted">{t.intro}</p>

      <div className="stars-tabs" role="group" aria-label={t.title}>
        {years.map((y) => (
          <button key={y} type="button" className="chip" aria-pressed={activeYear === y} onClick={() => changeYear(y)}>
            {t.tabCount(y, graduates.filter((g) => g.year === y).length)}
          </button>
        ))}
      </div>

      <label className="field stars-search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
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
        <p className="staff-card">{t.noMatch}</p>
      ) : (
        <ul className="user-list">
          {visible.map((g) => (
            <li key={g.id} className="user-item">
              <input type="checkbox" className="row-check" checked={selected.has(g.id)} onChange={() => toggle(g.id)} aria-label={g.name} />
              <div className="user-row">
                <span className="user-main">
                  <strong>{g.name}</strong>
                  <span className="muted">
                    {t.batch(g.year)} · {t.stars(g.total)}
                  </span>
                </span>
                <span className="user-side">
                  <span dir="ltr" className="muted">
                    {g.phone}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="stack archive-actions">
        {notice && (
          <p className={notice.kind === "ok" ? "success" : "error"} role="status">
            {notice.text}
          </p>
        )}

        <section className="staff-card form">
          <h2>{t.exportTitle}</h2>
          <p className="muted">{t.exportHint}</p>
          <div className="actions">
            <button type="button" className="button secondary" onClick={exportList} disabled={busy || exportTargets.length === 0}>
              {t.exportList}
            </button>
            <button type="button" className="button secondary" onClick={exportHistory} disabled={busy || exportTargets.length === 0}>
              {busy ? t.exporting : t.exportHistory}
            </button>
          </div>
        </section>

        {selected.size > 0 && (
          <section className="staff-card form">
            <p className="stars-selected">{t.selected(selected.size)}</p>
            <button type="button" className="button secondary" onClick={restore} disabled={busy}>
              {busy ? t.restoring : t.restore}
            </button>
          </section>
        )}

        <section className="staff-card form danger-zone">
          <h2>{t.deleteTitle}</h2>
          <p className="muted">{t.deleteHint}</p>

          {chosen.length === 0 ? null : !allExported ? (
            <p className="muted">{t.deleteNeedsExport}</p>
          ) : asking ? (
            <>
              <p className="error" role="alert">
                {t.deleteAsk(chosen.length, chosenStars)}
              </p>
              <div className="actions">
                <button type="button" className="button danger" onClick={remove} disabled={busy}>
                  {busy ? t.deleting : t.deleteYes}
                </button>
                <button type="button" className="button secondary" onClick={() => setAsking(false)} disabled={busy}>
                  {t.deleteNo}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="button danger-outline" onClick={() => setAsking(true)} disabled={busy}>
              {t.delete(chosen.length)}
            </button>
          )}
        </section>
      </div>
    </>
  );
}
