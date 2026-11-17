"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { matchesQuery } from "@/lib/search.mjs";
import { arabicNumber, gradeLabel, roleLabel, text, type Gender, type Role } from "@/lib/strings";
import { bulkMoveGrade, bulkSetActive } from "./bulk-actions";

const t = text.admin.users;
const b = t.bulk;
const GRADES = [3, 4, 5, 6];

export type UserRow = {
  id: number;
  name: string;
  phone: string; // local format, e.g. 01012345678
  role: Role;
  gender: Gender | null;
  grade: number | null;
  active: boolean;
  locked: boolean;
};

/** "all", "staff" (servants and admins) or a grade number. */
type Tab = "all" | "staff" | number;

type Pending = { kind: "move"; grade: number } | { kind: "active"; active: boolean };
type Notice = { kind: "ok" | "error"; text: string };

function inTab(u: UserRow, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "staff") return u.role !== "kid";
  return u.role === "kid" && u.grade === tab;
}

export default function UsersList({ users }: { users: UserRow[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [moveGrade, setMoveGrade] = useState("");
  const [confirm, setConfirm] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, startTransition] = useTransition();

  const tabs: { key: Tab; label: string; count: number }[] = useMemo(
    () => [
      { key: "all", label: t.tabAll, count: users.length },
      ...GRADES.map((g) => ({ key: g as Tab, label: gradeLabel(g).replace(" ابتدائي", ""), count: users.filter((u) => inTab(u, g)).length })),
      { key: "staff", label: t.tabStaff, count: users.filter((u) => inTab(u, "staff")).length },
    ],
    [users],
  );

  const visible = useMemo(() => users.filter((u) => inTab(u, tab) && matchesQuery(u, query)), [users, tab, query]);
  const tabTotal = tabs.find((x) => x.key === tab)?.count ?? 0;
  const allVisibleSelected = visible.length > 0 && visible.every((u) => selected.has(u.id));
  const selectedUsers = users.filter((u) => selected.has(u.id));
  const allKids = selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "kid");

  function changeTab(next: Tab) {
    setTab(next);
    // Selection never follows you to another tab, so a bulk action can't hit people you can't see.
    setSelected(new Set());
    setConfirm(null);
    setNotice(null);
  }

  function toggle(id: number) {
    setConfirm(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setConfirm(null);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const u of visible) {
        if (allVisibleSelected) next.delete(u.id);
        else next.add(u.id);
      }
      return next;
    });
  }

  function run(action: Pending) {
    const ids = [...selected];
    setConfirm(null);
    setNotice(null);
    startTransition(async () => {
      if (action.kind === "move") {
        const r = await bulkMoveGrade(ids, action.grade);
        if (r.ok) {
          setNotice({ kind: "ok", text: b.moved(r.count, gradeLabel(action.grade)) });
          setSelected(new Set());
          setMoveGrade("");
        } else setNotice({ kind: "error", text: r.error });
      } else {
        const r = await bulkSetActive(ids, action.active);
        if (r.ok) {
          const done = action.active ? b.activated(r.count) : b.deactivated(r.count);
          setNotice({ kind: "ok", text: r.skippedSelf ? `${done}. ${b.skippedSelf}` : done });
          setSelected(new Set());
        } else setNotice({ kind: "error", text: r.error });
      }
    });
  }

  const confirmText = confirm
    ? confirm.kind === "move"
      ? b.confirmMove(selected.size, gradeLabel(confirm.grade))
      : confirm.active
        ? b.confirmActivate(selected.size)
        : b.confirmDeactivate(selected.size)
    : "";

  return (
    <>
      <div className="stars-tabs" role="group" aria-label={t.title}>
        {tabs.map((x) => (
          <button key={String(x.key)} type="button" className="chip" aria-pressed={tab === x.key} onClick={() => changeTab(x.key)}>
            {x.label} ({arabicNumber(x.count)})
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

      <p className="muted count">{t.count(visible.length, tabTotal)}</p>

      {visible.length === 0 ? (
        <p className="staff-card">{t.empty}</p>
      ) : (
        <ul className="user-list">
          {visible.map((u) => (
            <li key={u.id} className="user-item">
              <input
                type="checkbox"
                className="row-check"
                checked={selected.has(u.id)}
                onChange={() => toggle(u.id)}
                aria-label={t.selectRow(u.name)}
              />
              <Link href={`/admin/users/${u.id}`} className="user-row">
                <span className="user-main">
                  <strong>{u.name}</strong>
                  <span className="muted">
                    {roleLabel(u.role, u.gender)}
                    {u.grade ? ` · ${gradeLabel(u.grade)}` : ""}
                  </span>
                </span>
                <span className="user-side">
                  <span dir="ltr" className="muted">
                    {u.phone}
                  </span>
                  {!u.active && <span className="badge off">{t.inactive}</span>}
                  {u.active && u.locked && <span className="badge warn">{t.locked}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(selected.size > 0 || notice) && (
        <section className="give-bar bulk-bar" aria-label={t.title}>
          {notice && (
            <p className={notice.kind === "ok" ? "success" : "error"} role="status">
              {notice.text}
            </p>
          )}

          {selected.size > 0 && (
            <>
              <p className="stars-selected">{t.selected(selected.size)}</p>

              {confirm ? (
                <>
                  <p className="error" role="alert">
                    {confirmText}
                  </p>
                  <div className="actions">
                    <button type="button" className="button" disabled={busy} onClick={() => run(confirm)}>
                      {busy ? b.working : b.yes}
                    </button>
                    <button type="button" className="button secondary" disabled={busy} onClick={() => setConfirm(null)}>
                      {b.no}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bulk-move">
                    <select value={moveGrade} onChange={(e) => setMoveGrade(e.target.value)} disabled={!allKids || busy} aria-label={b.moveTo}>
                      <option value="">{b.moveTo}…</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          {gradeLabel(g)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button"
                      disabled={!allKids || moveGrade === "" || busy}
                      onClick={() => setConfirm({ kind: "move", grade: Number(moveGrade) })}
                    >
                      {b.moveTo}
                    </button>
                  </div>
                  {!allKids && <p className="muted">{b.onlyKids}</p>}
                  <div className="actions">
                    <button type="button" className="button secondary" disabled={busy} onClick={() => setConfirm({ kind: "active", active: false })}>
                      {b.deactivate}
                    </button>
                    <button type="button" className="button secondary" disabled={busy} onClick={() => setConfirm({ kind: "active", active: true })}>
                      {b.activate}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
