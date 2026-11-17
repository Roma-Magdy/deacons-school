"use client";

import { useActionState, useState } from "react";
import type { Branch } from "@/lib/branches";
import { text, type Gender, type Role } from "@/lib/strings";
import {
  deleteKid,
  resetPassword,
  setActive,
  updateUser,
  type ActiveState,
  type DeleteState,
  type EditState,
  type ResetState,
} from "../actions";
import UserFields from "../user-fields";

const f = text.admin.form;
const ed = text.admin.edit;
const STAFF_ROLES: Role[] = ["servant", "admin"];

type UserData = {
  id: number;
  name: string;
  phone: string; // local format, e.g. 01012345678
  role: Role;
  gender: Gender | null;
  grade: number | null;
  branch: number | null;
  isActive: boolean;
};

export function EditDetailsForm({ user, isSelf, branches }: { user: UserData; isSelf: boolean; branches: Branch[] }) {
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
        branches={branches}
        defaults={state.values ?? { name: user.name, phone: user.phone, gender: user.gender, grade: user.grade, branch: user.branch }}
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

export function ActiveForm({
  id,
  isActive,
  isSelf,
  graduatedYear,
}: {
  id: number;
  isActive: boolean;
  isSelf: boolean;
  graduatedYear: number | null;
}) {
  const [state, action, pending] = useActionState<ActiveState, FormData>(setActive, {});

  return (
    <form action={action} className="form staff-card">
      <h2>{ed.statusTitle}</h2>
      <p className={isActive ? "muted" : "error"}>{graduatedYear !== null ? ed.graduatedNow(graduatedYear) : isActive ? ed.activeNow : ed.inactiveNow}</p>
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

export function DeleteKidForm({ id, name, starsTotal }: { id: number; name: string; starsTotal: number }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteKid, {});
  // Two taps on purpose: the first only asks "are you sure?", so a stray tap can't delete anyone.
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className="form staff-card danger-zone">
      <h2>{ed.deleteTitle}</h2>
      <p className="muted">{ed.deleteHint}</p>
      <input type="hidden" name="id" value={id} />

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}

      {confirming ? (
        <>
          <p className="error" role="alert">
            {ed.deleteConfirm(name, starsTotal)}
          </p>
          <div className="actions">
            <button type="submit" className="button danger" disabled={pending}>
              {pending ? ed.deleting : ed.deleteYes}
            </button>
            <button type="button" className="button secondary" onClick={() => setConfirming(false)} disabled={pending}>
              {ed.deleteNo}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="button danger-outline" onClick={() => setConfirming(true)}>
          {ed.delete}
        </button>
      )}
    </form>
  );
}
