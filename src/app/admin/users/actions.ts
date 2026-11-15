"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { IMPORT_CHUNK_SIZE, parseUserRows, validateUserFields } from "@/lib/import-parse.mjs";
import { generatePassword, hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { toLocalPhone } from "@/lib/phone.mjs";
import { text } from "@/lib/strings";

const e = text.admin.errors;

// Every action here starts with requireAdmin(): the pages are admin-only, but anyone can call a server action directly.

export type Credential = { name: string; phone: string; password: string };

// ---------- add one ----------

/** What was typed in the form. Returned with errors so the form keeps the admin's input (React clears forms after an action). */
export type FormValues = { name: string; phone: string; gender: string; grade: string; role: string; password: string; branch: string };

function submittedValues(formData: FormData): FormValues {
  const get = (key: string) => String(formData.get(key) ?? "");
  return { name: get("name"), phone: get("phone"), gender: get("gender"), grade: get("grade"), role: get("role"), password: get("password"), branch: get("branch") };
}

export type CreateState = { error?: string; created?: Credential; values?: FormValues };

const STAFF_ROLES = ["servant", "admin"] as const;
const ALL_ROLES = ["kid", ...STAFF_ROLES] as const;

function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/** The home branch picked in the form. Only servants and admins have one; it is optional and never limits awarding stars. */
async function readBranch(formData: FormData, role: string): Promise<{ ok: true; id: number | null } | { ok: false }> {
  const raw = String(formData.get("branch") ?? "").trim();
  if (role === "kid" || raw === "") return { ok: true, id: null };
  const id = Number(raw);
  if (!Number.isInteger(id)) return { ok: false };
  const { rowCount } = await db.query("select 1 from branches where id = $1 and is_active", [id]);
  return rowCount ? { ok: true, id } : { ok: false };
}

async function nameOfPhoneOwner(phone: string): Promise<string> {
  const { rows } = await db.query("select full_name from users where phone = $1", [phone]);
  return rows[0]?.full_name ?? "";
}

export async function createUser(_prev: CreateState, formData: FormData): Promise<CreateState> {
  await requireAdmin();
  const values = submittedValues(formData);

  const role = String(formData.get("role") ?? "");
  if (!(ALL_ROLES as readonly string[]).includes(role)) return { error: e.badRole, values };

  const v = validateUserFields({
    name: formData.get("name"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    grade: formData.get("grade"),
    role,
  });
  if (!v.ok) return { error: v.errors.join("، "), values };

  const branch = await readBranch(formData, role);
  if (!branch.ok) return { error: e.badBranch, values };

  const custom = String(formData.get("password") ?? "").trim();
  if (custom && custom.length < MIN_PASSWORD_LENGTH) return { error: e.shortPassword, values };
  const password = custom || generatePassword(role === "kid" ? "kid" : "staff");

  try {
    await db.query(
      `insert into users (phone, password_hash, full_name, role, grade, gender, branch_id)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [v.value.phone, await hashPassword(password), v.value.name, role, v.value.grade, v.value.gender, branch.id],
    );
  } catch (err) {
    if (isUniqueViolation(err)) return { error: e.phoneTaken(await nameOfPhoneOwner(v.value.phone)), values };
    throw err;
  }

  revalidatePath("/admin/users");
  return { created: { name: v.value.name, phone: toLocalPhone(v.value.phone), password } };
}

// ---------- edit ----------

export type EditState = { error?: string; saved?: boolean; values?: FormValues };

export async function updateUser(_prev: EditState, formData: FormData): Promise<EditState> {
  const admin = await requireAdmin();
  const values = submittedValues(formData);

  const id = Number(formData.get("id"));
  const { rows } = await db.query("select id, role from users where id = $1", [id]);
  const target = rows[0];
  if (!target) return { error: text.admin.edit.notFound };

  // Kids stay kids; servants and admins can be switched between those two roles.
  let role: string = target.role;
  if (target.role !== "kid") {
    role = String(formData.get("role") ?? target.role);
    if (!(STAFF_ROLES as readonly string[]).includes(role)) return { error: e.badRole, values };
    if (Number(target.id) === admin.id && role !== target.role) return { error: e.ownRole, values };
  }

  const v = validateUserFields({
    name: formData.get("name"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    grade: formData.get("grade"),
    role,
  });
  if (!v.ok) return { error: v.errors.join("، "), values };

  const branch = await readBranch(formData, role);
  if (!branch.ok) return { error: e.badBranch, values };

  try {
    await db.query(
      `update users set full_name = $2, phone = $3, gender = $4, grade = $5, role = $6, branch_id = $7 where id = $1`,
      [id, v.value.name, v.value.phone, v.value.gender, v.value.grade, role, branch.id],
    );
  } catch (err) {
    if (isUniqueViolation(err)) return { error: e.phoneTaken(await nameOfPhoneOwner(v.value.phone)), values };
    throw err;
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { saved: true };
}

// ---------- password reset ----------

export type ResetState = { error?: string; password?: string };

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const { rows } = await db.query("select role from users where id = $1", [id]);
  if (!rows[0]) return { error: text.admin.edit.notFound };

  const custom = String(formData.get("password") ?? "").trim();
  if (custom && custom.length < MIN_PASSWORD_LENGTH) return { error: e.shortPassword };
  const password = custom || generatePassword(rows[0].role === "kid" ? "kid" : "staff");

  // Also clears any lockout from too many wrong passwords.
  await db.query("update users set password_hash = $2, failed_attempts = 0, locked_until = null where id = $1", [
    id,
    await hashPassword(password),
  ]);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { password };
}

// ---------- activate / deactivate ----------

export type ActiveState = { error?: string };

export async function setActive(_prev: ActiveState, formData: FormData): Promise<ActiveState> {
  const admin = await requireAdmin();

  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!active && id === admin.id) return { error: e.ownDeactivate };

  const result = await db.query("update users set is_active = $2 where id = $1", [id, active]);
  if (result.rowCount === 0) return { error: text.admin.edit.notFound };

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return {};
}

// ---------- import ----------

export type ImportRole = "kid" | "servant";

export type ImportPreview = {
  rows: { line: number; name: string; phone: string; gender: "male" | "female"; grade: number | null }[];
  errors: { line: number; name: string; message: string }[];
  headerDetected: boolean;
};

const MAX_IMPORT_TEXT = 300_000;

function asImportRole(value: unknown): ImportRole {
  return value === "servant" ? "servant" : "kid";
}

/** Checks pasted spreadsheet text without saving anything. */
export async function previewImport(inputText: string, roleInput: string): Promise<ImportPreview> {
  await requireAdmin();
  const role = asImportRole(roleInput);

  const parsed = parseUserRows(String(inputText).slice(0, MAX_IMPORT_TEXT), { role });
  const rows: ImportPreview["rows"] = [];
  const errors = [...parsed.errors];

  // Numbers that already have an account can't be imported again.
  const phones = parsed.rows.map((r) => r.phone);
  const existing = new Map<string, string>();
  if (phones.length > 0) {
    const { rows: found } = await db.query("select phone, full_name from users where phone = any($1::text[])", [phones]);
    for (const r of found) existing.set(r.phone, r.full_name);
  }
  for (const row of parsed.rows) {
    const owner = existing.get(row.phone);
    if (owner !== undefined) errors.push({ line: row.line, name: row.name, message: text.admin.import.existsAs(owner) });
    else rows.push(row);
  }

  errors.sort((a, b) => a.line - b.line);
  return { rows, errors, headerDetected: parsed.headerDetected };
}

export type ImportChunkResult = {
  created: Credential[];
  skipped: { name: string; phone: string; reason: string }[];
};

/** Saves one small batch of checked rows. The browser calls this repeatedly so no single request runs for long. */
export async function importChunk(
  roleInput: string,
  rows: { name: string; phone: string; gender: string; grade: number | null }[],
): Promise<ImportChunkResult> {
  await requireAdmin();
  const role = asImportRole(roleInput);

  const result: ImportChunkResult = { created: [], skipped: [] };

  for (const row of rows.slice(0, IMPORT_CHUNK_SIZE)) {
    // Checked again here: the browser's copy of the data is never trusted.
    const v = validateUserFields({ name: row.name, phone: row.phone, gender: row.gender, grade: row.grade, role });
    if (!v.ok) {
      result.skipped.push({ name: String(row.name), phone: String(row.phone), reason: v.errors.join("، ") });
      continue;
    }

    const password = generatePassword(role === "kid" ? "kid" : "staff");
    const inserted = await db.query(
      `insert into users (phone, password_hash, full_name, role, grade, gender)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (phone) do nothing
       returning id`,
      [v.value.phone, await hashPassword(password), v.value.name, role, v.value.grade, v.value.gender],
    );

    if (inserted.rowCount === 0) {
      result.skipped.push({ name: v.value.name, phone: toLocalPhone(v.value.phone), reason: text.admin.import.raceSkipped });
    } else {
      result.created.push({ name: v.value.name, phone: toLocalPhone(v.value.phone), password });
    }
  }

  revalidatePath("/admin/users");
  return result;
}
