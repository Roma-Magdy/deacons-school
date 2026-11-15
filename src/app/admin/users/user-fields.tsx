"use client";

import { gradeLabel, text, type Role } from "@/lib/strings";

const f = text.admin.form;

type Defaults = { name?: string; phone?: string; gender?: string | null; grade?: number | string | null };

/** The fields shared by the "add" and "edit" forms. Kids get a grade; the gender labels fit who is being added. */
export default function UserFields({ role, defaults = {} }: { role: Role; defaults?: Defaults }) {
  const isKid = role === "kid";

  return (
    <>
      <label className="field">
        <span>{f.name}</span>
        <input name="name" defaultValue={defaults.name} autoComplete="off" required />
        {isKid && <small className="muted">{f.nameHintKid}</small>}
      </label>

      <label className="field">
        <span>{f.phone}</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="01xxxxxxxxx"
          defaultValue={defaults.phone}
          autoComplete="off"
          required
        />
      </label>

      <label className="field">
        <span>{f.gender}</span>
        {/* The key makes React rebuild the dropdown when its default changes: it ignores a changed defaultValue on an existing <select>,
            and without this the choice is lost when the form is cleared after an error. */}
        <select key={`gender-${defaults.gender ?? ""}`} name="gender" defaultValue={defaults.gender ?? ""} required>
          <option value="" disabled>
            {f.choose}
          </option>
          <option value="male">{isKid ? f.maleKid : f.male}</option>
          <option value="female">{isKid ? f.femaleKid : f.female}</option>
        </select>
      </label>

      {isKid && (
        <label className="field">
          <span>{f.grade}</span>
          <select key={`grade-${defaults.grade ?? ""}`} name="grade" defaultValue={defaults.grade ? String(defaults.grade) : ""} required>
            <option value="" disabled>
              {f.choose}
            </option>
            {[3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                {gradeLabel(g)}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
