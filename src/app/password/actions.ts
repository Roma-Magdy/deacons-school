"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { accountText } from "@/lib/account-text";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { checkNewPassword } from "@/lib/password-input.mjs";

export type PasswordState = { error?: string; done?: boolean };

/** A user changes their own password. The current password must be right, even though they are already logged in. */
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const current = formData.get("current");
  const next = formData.get("next");
  const confirm = formData.get("confirm");

  const problem = checkNewPassword({ current, next, confirm });
  if (problem) return { error: accountText.errors[problem] };

  const { rows } = await db.query("select password_hash from users where id = $1", [user.id]);
  if (!rows[0] || !(await bcrypt.compare(current as string, rows[0].password_hash as string))) {
    return { error: accountText.errors.wrongCurrent };
  }

  await db.query("update users set password_hash = $2, password_prompt = false, failed_attempts = 0, locked_until = null where id = $1", [
    user.id,
    await hashPassword(next as string),
  ]);
  return { done: true };
}

/** "Later" on the first-login screen: it is not shown again, and the password can still be changed from the header link. */
export async function skipPasswordPrompt(): Promise<void> {
  const user = await requireUser();
  await db.query("update users set password_prompt = false where id = $1", [user.id]);
  redirect("/home");
}
