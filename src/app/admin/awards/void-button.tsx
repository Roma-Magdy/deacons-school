"use client";

import { useState, useTransition } from "react";
import { awardsText as t } from "@/lib/awards-text";
import { voidAward } from "./actions";

export default function VoidButton({ id, kid, amount }: { id: number; kid: string; amount: number }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const r = await voidAward(id);
      if (!r.ok) {
        setError(r.error);
        setAsking(false);
      }
    });
  }

  if (!asking) {
    return (
      <>
        <button type="button" className="button danger-outline award-btn" onClick={() => setAsking(true)}>
          {t.void}
        </button>
        {error && (
          <span className="error" role="alert">
            {error}
          </span>
        )}
      </>
    );
  }
  return (
    <div className="award-confirm">
      <span className="error" role="alert">
        {t.voidAsk(kid, amount)}
      </span>
      <button type="button" className="button danger award-btn" disabled={busy} onClick={confirm}>
        {busy ? t.voiding : t.voidYes}
      </button>
      <button type="button" className="button secondary award-btn" disabled={busy} onClick={() => setAsking(false)}>
        {t.voidNo}
      </button>
    </div>
  );
}
