"use client";

import { useState, useTransition } from "react";
import { text } from "@/lib/strings";
import { activateTerm, createTerm, deleteTerm, updateTerm, type TermResult } from "./actions";

const t = text.admin.terms;

export type TermItem = { id: number; name: string; start: string; end: string; active: boolean; awards: number };

type Notice = { kind: "ok" | "error"; text: string };

const dateFormat = new Intl.DateTimeFormat("ar-EG", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });

/** "2026-09-01" → "١ سبتمبر ٢٠٢٦". Read as UTC so the day never shifts. */
function showDate(s: string): string {
  return dateFormat.format(new Date(`${s}T00:00:00Z`));
}

type Fields = { name: string; start: string; end: string };

function TermFields({ value, onChange }: { value: Fields; onChange: (v: Fields) => void }) {
  return (
    <>
      <label className="field">
        <span>{t.name}</span>
        <input value={value.name} maxLength={40} placeholder={t.namePlaceholder} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </label>
      <div className="term-dates">
        <label className="field">
          <span>{t.start}</span>
          <input type="date" dir="ltr" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} />
        </label>
        <label className="field">
          <span>{t.end}</span>
          <input type="date" dir="ltr" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} />
        </label>
      </div>
    </>
  );
}

function TermCard({ term, current, report }: { term: TermItem; current: TermItem | undefined; report: (n: Notice) => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "activate" | "delete">("view");
  const [fields, setFields] = useState<Fields>({ name: term.name, start: term.start, end: term.end });
  const [busy, startTransition] = useTransition();

  function run(action: () => Promise<TermResult>, success: string) {
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        report({ kind: "ok", text: success });
        setMode("view");
      } else {
        report({ kind: "error", text: r.error });
      }
    });
  }

  return (
    <li className={term.active ? "staff-card term-card active-term" : "staff-card term-card"}>
      <div className="term-head">
        <strong>{term.name}</strong>
        {term.active && <span className="badge warn">{t.current}</span>}
      </div>
      <p className="muted">
        {showDate(term.start)} ← {showDate(term.end)} · {t.awards(term.awards)}
      </p>

      {mode === "edit" && (
        <div className="form">
          <TermFields value={fields} onChange={setFields} />
          <div className="actions">
            <button type="button" className="button" disabled={busy} onClick={() => run(() => updateTerm(term.id, fields), t.saved)}>
              {busy ? t.saving : t.save}
            </button>
            <button type="button" className="button secondary" disabled={busy} onClick={() => setMode("view")}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {mode === "activate" && (
        <div className="form">
          <p className="error" role="alert">
            {t.activateAsk(term.name, current?.name ?? null)}
          </p>
          <div className="actions">
            <button type="button" className="button" disabled={busy} onClick={() => run(() => activateTerm(term.id), t.saved)}>
              {busy ? t.activating : t.yes}
            </button>
            <button type="button" className="button secondary" disabled={busy} onClick={() => setMode("view")}>
              {t.no}
            </button>
          </div>
        </div>
      )}

      {mode === "delete" && (
        <div className="form">
          <p className="error" role="alert">
            {t.deleteAsk(term.name)}
          </p>
          <div className="actions">
            <button type="button" className="button danger" disabled={busy} onClick={() => run(() => deleteTerm(term.id), t.saved)}>
              {busy ? t.deleting : t.deleteYes}
            </button>
            <button type="button" className="button secondary" disabled={busy} onClick={() => setMode("view")}>
              {t.deleteNo}
            </button>
          </div>
        </div>
      )}

      {mode === "view" && (
        <div className="actions">
          {!term.active && (
            <button type="button" className="button" onClick={() => setMode("activate")}>
              {t.activate}
            </button>
          )}
          <button type="button" className="button secondary" onClick={() => setMode("edit")}>
            {t.edit}
          </button>
          {term.awards === 0 && !term.active && (
            <button type="button" className="button danger-outline" onClick={() => setMode("delete")}>
              {t.delete}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function TermsBoard({ terms }: { terms: TermItem[] }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fields, setFields] = useState<Fields>({ name: "", start: "", end: "" });
  const [busy, startTransition] = useTransition();
  const current = terms.find((x) => x.active);

  function add() {
    setNotice(null);
    startTransition(async () => {
      const r = await createTerm(fields);
      if (r.ok) {
        setFields({ name: "", start: "", end: "" });
        setNotice({ kind: "ok", text: t.saved });
      } else {
        setNotice({ kind: "error", text: r.error });
      }
    });
  }

  return (
    <div className="stack">
      <p className="muted">{t.intro}</p>
      {!current && <p className="error">{t.noActive}</p>}
      {notice && (
        <p className={notice.kind === "ok" ? "success" : "error"} role="status">
          {notice.text}
        </p>
      )}

      {terms.length === 0 ? (
        <p className="staff-card">{t.empty}</p>
      ) : (
        <ul className="user-list">
          {terms.map((term) => (
            <TermCard key={term.id} term={term} current={current} report={setNotice} />
          ))}
        </ul>
      )}

      <section className="staff-card form">
        <h2>{t.addTitle}</h2>
        <TermFields value={fields} onChange={setFields} />
        <button type="button" className="button" disabled={busy} onClick={add}>
          {busy ? t.adding : t.add}
        </button>
      </section>
    </div>
  );
}
