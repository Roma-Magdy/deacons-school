"use client";

import { useActionState } from "react";
import { text, type Gender, type Role } from "@/lib/strings";
import {
  resetPassword,
  setActive,
  updateUser,
  type ActiveState,
  type EditState,
  type ResetState,
} from "../actions";
import UserFields from "../user-fields";

const f = text.admin.form;
const ed = text.admin.edit;
const STAFF_ROLES: Role[] = ["servant", "branch_leader", "admin"];

type UserData = {
  id: number;
  name: string;
  phone: string; // local format, e.g. 01012345678
  role: Role;
  gender: Gender | null;
  grade: number | null;
  isActive: boolean;
};

export function EditDetailsForm({ user, isSelf }: { user: UserData; isSelf: boolean }) {
  const [state, action, pending] = useActionState<EditState, FormData>(updateUser, {});

  return (
    <form action={action} className="form staff-card">
      <input type="hidden" name="id" value={user.id} />

      {user.role !== "kid" && (
        <label className="field">
          <span>{f.accountType}</span>
          <select name="role" defaultValue={user.role} disabled={isSelf}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {text.admin.roles[r]}
              </option>
            ))}
          </select>
        </label>
      )}

      <UserFields
        role={user.role}
        defaults={state.values ?? { name: user.name, phone: user.phone, gender: user.gender, grade: user.grade }}
      />

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.saved && <p className="success">{f.saved}</p>}

      <button type="submit" className="button" disabled={pending}>
        {pending ? f.saving : f.save}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, {});

  return (
    <form action={action} className="form staff-card">
      <h2>{ed.resetTitle}</h2>
      <p className="muted">{ed.resetHint}</p>
      <input type="hidden" name="id" value={id} />

      <label className="field">
        <span>{f.password}</span>
        <input name="password" dir="ltr" autoComplete="off" placeholder={f.passwordHint} />
      </label>

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.password && (
        <div className="success">
          <p>{ed.resetDone}</p>
          <p dir="ltr" className="mono big">
            {state.password}
          </p>
        </div>
      )}

      <button type="submit" className="button secondary" disabled={pending}>
        {ed.reset}
      </button>
    </form>
  );
}

export function ActiveForm({ id, isActive, isSelf }: { id: number; isActive: boolean; isSelf: boolean }) {
  const [state, action, pending] = useActionState<ActiveState, FormData>(setActive, {});

  return (
    <form action={action} className="form staff-card">
      <h2>{ed.statusTitle}</h2>
      <p className={isActive ? "muted" : "error"}>{isActive ? ed.activeNow : ed.inactiveNow}</p>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={isActive ? "false" : "true"} />

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="button secondary" disabled={pending || (isSelf && isActive)}>
        {isActive ? ed.deactivate : ed.activate}
      </button>
    </form>
  );
}
