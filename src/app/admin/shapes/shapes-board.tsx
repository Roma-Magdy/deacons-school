"use client";

import { useState, useTransition } from "react";
import { text } from "@/lib/strings";
import { toSmallPng } from "./resize-image";
import { createShape, deleteShape, removeShapeImage, setShapeHidden, updateShape, uploadShapeImage, type ShapeResult } from "./actions";

const t = text.admin.shapes;

export type ShapeItem = {
  id: number;
  name: string;
  emoji: string | null;
  imageUrl: string | null;
  stars: number;
  hidden: boolean;
  wearing: number;
  unlocked: number;
};

type Notice = { kind: "ok" | "error"; text: string };
type Fields = { name: string; emoji: string; stars: string };

function Glyph({ emoji, imageUrl }: { emoji: string | null; imageUrl: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" width={48} height={48} />;
  }
  return <>{emoji ?? "⭐"}</>;
}

/** Turns a picked file into a small PNG and uploads it. Returns an error message, or null when it worked. */
async function sendImage(shapeId: number, file: File): Promise<string | null> {
  const png = await toSmallPng(file);
  if (!png) return t.errors.imageType;
  const form = new FormData();
  form.append("image", new File([png], "shape.png", { type: "image/png" }));
  const r = await uploadShapeImage(shapeId, form);
  return r.ok ? null : r.error;
}

function ShapeFields({ value, onChange }: { value: Fields; onChange: (v: Fields) => void }) {
  return (
    <>
      <label className="field">
        <span>{t.name}</span>
        <input value={value.name} maxLength={30} placeholder={t.namePlaceholder} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </label>
      <label className="field">
        <span>{t.emoji}</span>
        <input value={value.emoji} maxLength={16} placeholder="🏆" onChange={(e) => onChange({ ...value, emoji: e.target.value })} />
        <small>{t.emojiHint}</small>
      </label>
      <label className="field">
        <span>{t.stars}</span>
        <input type="number" inputMode="numeric" min={0} dir="ltr" value={value.stars} onChange={(e) => onChange({ ...value, stars: e.target.value })} />
        <small>{t.starsHint}</small>
      </label>
    </>
  );
}

function ShapeCard({ shape, report }: { shape: ShapeItem; report: (n: Notice) => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [fields, setFields] = useState<Fields>({ name: shape.name, emoji: shape.emoji ?? "", stars: String(shape.stars) });
  const [busy, startTransition] = useTransition();

  function run(action: () => Promise<ShapeResult>, success: string, after?: () => void) {
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        report({ kind: "ok", text: success });
        after?.();
      } else {
        report({ kind: "error", text: r.error });
      }
    });
  }

  function pickImage(file: File | undefined) {
    if (!file) return;
    startTransition(async () => {
      const err = await sendImage(shape.id, file);
      report(err ? { kind: "error", text: err } : { kind: "ok", text: t.saved });
    });
  }

  const inUse = shape.wearing > 0 || shape.unlocked > 0;

  return (
    <li className={shape.hidden ? "staff-card shape-admin-card is-hidden" : "staff-card shape-admin-card"}>
      <div className="shape-admin-head">
        <span className="shape-admin-glyph" aria-hidden="true">
          <Glyph emoji={shape.emoji} imageUrl={shape.imageUrl} />
        </span>
        <div>
          <strong>{shape.name}</strong>
          {shape.hidden && <span className="badge off">{t.hiddenBadge}</span>}
          <p className="muted">
            {shape.stars === 0 ? t.free : t.needs(shape.stars)}، {t.wearing(shape.wearing)}
          </p>
        </div>
      </div>

      {mode === "edit" && (
        <div className="form">
          <ShapeFields value={fields} onChange={setFields} />
          <div className="actions">
            <button type="button" className="button" disabled={busy} onClick={() => run(() => updateShape(shape.id, fields), t.saved, () => setMode("view"))}>
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
            {t.deleteAsk(shape.name)}
          </p>
          <div className="actions">
            <button type="button" className="button danger" disabled={busy} onClick={() => run(() => deleteShape(shape.id), t.saved, () => setMode("view"))}>
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
          <button type="button" className="button secondary" onClick={() => setMode("edit")}>
            {t.edit}
          </button>
          <label className="button secondary file-button">
            {busy ? t.saving : shape.imageUrl ? t.changeImage : t.addImage}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(ev) => {
                pickImage(ev.target.files?.[0]);
                ev.target.value = "";
              }}
            />
          </label>
          {shape.imageUrl && shape.emoji && (
            <button type="button" className="button secondary" disabled={busy} onClick={() => run(() => removeShapeImage(shape.id), t.saved)}>
              {t.removeImage}
            </button>
          )}
          <button type="button" className="button secondary" disabled={busy} onClick={() => run(() => setShapeHidden(shape.id, !shape.hidden), t.saved)}>
            {shape.hidden ? t.show : t.hide}
          </button>
          {!inUse && (
            <button type="button" className="button danger-outline" onClick={() => setMode("delete")}>
              {t.delete}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function ShapesBoard({ shapes }: { shapes: ShapeItem[] }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fields, setFields] = useState<Fields>({ name: "", emoji: "", stars: "0" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, startTransition] = useTransition();

  function add() {
    setNotice(null);
    startTransition(async () => {
      const r = await createShape(fields);
      if (!r.ok) {
        setNotice({ kind: "error", text: r.error });
        return;
      }
      // The shape exists now; a picture is optional and added on top.
      const err = file && r.id ? await sendImage(r.id, file) : null;
      setFields({ name: "", emoji: "", stars: "0" });
      setFile(null);
      setNotice(err ? { kind: "error", text: `${t.saved}. ${err}` } : { kind: "ok", text: t.saved });
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
        {shapes.map((s) => (
          <ShapeCard key={s.id} shape={s} report={setNotice} />
        ))}
      </ul>

      <section className="staff-card form">
        <h2>{t.addTitle}</h2>
        <ShapeFields value={fields} onChange={setFields} />
        <label className="field">
          <span>{t.imageOptional}</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(ev) => setFile(ev.target.files?.[0] ?? null)} />
          <small>{t.imageHint}</small>
        </label>
        <button type="button" className="button" disabled={busy} onClick={add}>
          {busy ? t.adding : t.add}
        </button>
      </section>
    </div>
  );
}
