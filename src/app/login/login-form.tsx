"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="form">
      <label className="field">
        <span>رقم الهاتف</span>
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
        <span>كلمة المرور</span>
        <input name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </label>

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="button" disabled={pending}>
        {pending ? "جارٍ الدخول..." : "دخول"}
      </button>
    </form>
  );
}
