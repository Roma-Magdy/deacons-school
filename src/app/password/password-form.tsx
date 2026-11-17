"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountText as t } from "@/lib/account-text";
import { changePassword, skipPasswordPrompt, type PasswordState } from "./actions";

export default function PasswordForm({ first }: { first: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});

  if (state.done) {
    return (
      <div className="stack">
        <p className="success" role="status">
          {t.done}
        </p>
        <Link href="/home" className="button">
          {t.continue}
        </Link>
      </div>
    );
  }

  return (
    <>
      <form action={action} className="form">
        <label className="field">
          <span>{t.current}</span>
          <input name="current" type="password" autoComplete="current-password" dir="ltr" required />
        </label>
        <label className="field">
          <span>{t.next}</span>
          <input name="next" type="password" autoComplete="new-password" dir="ltr" minLength={6} maxLength={64} required />
          <small>{t.nextHint}</small>
        </label>
        <label className="field">
          <span>{t.confirm}</span>
          <input name="confirm" type="password" autoComplete="new-password" dir="ltr" minLength={6} maxLength={64} required />
        </label>
        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" className="button" disabled={pending}>
          {pending ? t.submitting : t.submit}
        </button>
      </form>
      {first && (
        <form action={skipPasswordPrompt} className="form">
          <button type="submit" className="button secondary">
            {t.skip}
          </button>
        </form>
      )}
    </>
  );
}
