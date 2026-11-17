"use client";

import { useState, useTransition } from "react";
import { text } from "@/lib/strings";
import { chooseShape } from "./actions";

const t = text.shapes;

export type ShapeOption = { id: number; name: string; emoji: string | null; imageUrl: string | null; unlocked: boolean; starsToGo: number };

function Glyph({ shape }: { shape: ShapeOption }) {
  if (shape.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={shape.imageUrl} alt="" width={64} height={64} />;
  }
  return <>{shape.emoji ?? "⭐"}</>;
}

export default function ShapePicker({ shapes, currentId }: { shapes: ShapeOption[]; currentId: number | null }) {
  const [chosen, setChosen] = useState<number | null>(currentId);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(shape: ShapeOption) {
    if (!shape.unlocked || pending || shape.id === chosen) return;
    const before = chosen;
    setChosen(shape.id);
    setMessage(null);
    startTransition(async () => {
      const r = await chooseShape(shape.id);
      if (r.ok) {
        setMessage({ kind: "ok", text: t.done(shape.name) });
      } else {
        setChosen(before);
        setMessage({ kind: "error", text: r.error });
      }
    });
  }

  return (
    <>
      <p className="muted">{t.intro}</p>
      {message && (
        <p className={message.kind === "ok" ? "success" : "error"} role="status">
          {message.text}
        </p>
      )}
      <ul className="shape-grid">
        {shapes.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="shape-card"
              aria-pressed={chosen === s.id}
              aria-disabled={!s.unlocked}
              data-locked={!s.unlocked}
              onClick={() => pick(s)}
            >
              <span className="shape-card-glyph" aria-hidden="true">
                <Glyph shape={s} />
              </span>
              <strong>{s.name}</strong>
              <span className="muted shape-card-note">{chosen === s.id ? t.current : s.unlocked ? t.choose : t.starsToGo(s.starsToGo)}</span>
              {!s.unlocked && (
                <span className="shape-lock" aria-hidden="true">
                  🔒
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
