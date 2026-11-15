"use client";

import { useActionState, useState } from "react";
import type { Branch } from "@/lib/branches";
import { text, type Role } from "@/lib/strings";
import Credentials from "../../_components/credentials";
import { createUser, type CreateState } from "../actions";
import UserFields from "../user-fields";

const f = text.admin.form;
const ROLES: Role[] = ["kid", "servant", "admin"];

export default function CreateUserForm({ branches }: { branches: Branch[] }) {
  // Changing the key throws the form away, which is how "add another" starts from a clean form.
  const [round, setRound] = useState(0);
  return <Inner key={round} branches={branches} onAnother={() => setRound((n) => n + 1)} />;
}

function Inner({ branches, onAnother }: { branches: Branch[]; onAnother: () => void }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createUser, {});
  const [role, setRole] = useState<Role>("kid");

  if (state.created) {
    return (
      <section className="staff-card">
        <h2>{text.admin.created.title}</h2>
        <p className="muted">{text.admin.created.note}</p>
        <Credentials items={[state.created]} />
        <button type="button" className="button" onClick={onAnother}>
          {text.admin.created.another}
        </button>
      </section>
    );
  }

  return (
    <form action={action} className="form staff-card">
      <label className="field">
        <span>{f.accountType}</span>
        <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {text.admin.roles[r]}
            </option>
          ))}
        </select>
      </label>

      {/* Remounts when the account type changes so the grade and gender fields reset cleanly. */}
      <UserFields key={role} role={role} branches={branches} defaults={state.values?.role === role ? state.values : undefined} />

      <label className="field">
        <span>{f.password}</span>
        <input name="password" dir="ltr" autoComplete="off" placeholder={f.passwordHint} defaultValue={state.values?.password} />
      </label>

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="button" disabled={pending}>
        {pending ? f.creating : f.create}
      </button>
    </form>
  );
}
