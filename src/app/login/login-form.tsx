"use client";

import { useActionState } from "react";
import { text } from "@/lib/strings";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="form">
      <label className="field">
        <span>{text.login.phoneLabel}</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="01xxxxxxxxx"
          dir="ltr"
          required
        />
      </label>

      <label className="field">
        <span>{text.login.passwordLabel}</span>
        <input name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </label>

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="button" disabled={pending}>
        {pending ? text.login.submitting : text.login.submit}
      </button>
    </form>
  );
}
