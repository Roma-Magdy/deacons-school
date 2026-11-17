"use client";

import { useState, useTransition } from "react";
import { reasonsText as t } from "@/lib/reasons-text";
import { createReason, deleteReason, moveReason, renameReason, setReasonActive, type ReasonResult } from "./actions";

export type ReasonItem = { id: number; name: string; competition: boolean; active: boolean; used: boolean };

type Notice = { kind: "ok" | "error"; text: string };

function ReasonCard({ reason, first, last, report }: { reason: ReasonItem; first: boolean; last: boolean; report: (n: Notice) => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [name, setName] = useState(reason.name);
  const [busy, startTransition] = useTransition();

  function run(action: () => Promise<ReasonResult>, after?: () => void) {
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        report({ kind: "ok", text: t.saved });
        after?.();
      } else {
        report({ kind: "error", text: r.error });
      }
    });
  }

  return (
    <li className={reason.active ? "staff-card shape-admin-card" : "staff-card shape-admin-card is-hidden"}>
      <div className="term-head">
        <strong>{reason.name}</strong>
        {reason.competition && <span className="badge warn">{t.competitionBadge}</span>}
        {!reason.active && <span className="badge off">{t.hiddenBadge}</span>}
      </div>
      <p className="muted">{t.usage(reason.used ? 1 : 0)}</p>

      {mode === "edit" && (
        <div className="form">
          <label className="field">
            <span>{t.name}</span>
            <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="actions">
            <button type="button" className="button" disabled={busy} onClick={() => run(() => renameReason(reason.id, { name }), () => setMode("view"))}>
              {busy ? t.saving : t.save}
            </button>
            <button type="button" className="button secondary" disabled={busy} onClick={() => setMode("view")}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {mode === "delete" && (
        <div className="form">
          <p className="error" role="alert">
            {t.deleteAsk(reason.name)}
          </p>
          <div className="actions">
            <button type="button" className="button danger" disabled={busy} onClick={() => run(() => deleteReason(reason.id), () => setMode("view"))}>
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
          <button type="button" className="button secondary" disabled={busy || first} onClick={() => run(() => moveReason(reason.id, "up"))}>
            ↑ {t.up}
          </button>
          <button type="button" className="button secondary" disabled={busy || last} onClick={() => run(() => moveReason(reason.id, "down"))}>
            ↓ {t.down}
          </button>
          <button type="button" className="button secondary" onClick={() => setMode("edit")}>
            {t.edit}
          </button>
          {!reason.competition && (
            <button type="button" className="button secondary" disabled={busy} onClick={() => run(() => setReasonActive(reason.id, !reason.active))}>
              {reason.active ? t.hide : t.show}
            </button>
          )}
          {!reason.competition && !reason.used && (
            <button type="button" className="button danger-outline" onClick={() => setMode("delete")}>
              {t.delete}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function ReasonsBoard({ reasons }: { reasons: ReasonItem[] }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [name, setName] = useState("");
  const [busy, startTransition] = useTransition();

  function add() {
    setNotice(null);
    startTransition(async () => {
      const r = await createReason({ name });
      if (r.ok) {
        setName("");
        setNotice({ kind: "ok", text: t.saved });
      } else {
        setNotice({ kind: "error", text: r.error });
      }
    });
  }

  return (
    <div className="stack">
      <p className="muted">{t.intro}</p>
      {notice && (
        <p className={notice.kind === "ok" ? "success" : "error"} role="status">
          {notice.text}
        </p>
      )}

      <ul className="user-list">
        {reasons.map((r, i) => (
          <ReasonCard key={r.id} reason={r} first={i === 0} last={i === reasons.length - 1} report={setNotice} />
        ))}
      </ul>

      <section className="staff-card form">
        <h2>{t.addTitle}</h2>
        <label className="field">
          <span>{t.name}</span>
          <input value={name} maxLength={30} placeholder={t.namePlaceholder} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="button" className="button" disabled={busy} onClick={add}>
          {busy ? t.adding : t.add}
        </button>
      </section>
    </div>
  );
}
