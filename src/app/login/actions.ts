"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone.mjs";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string };

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Compared against when the phone number is unknown, so response time doesn't reveal which numbers have accounts.
let dummyHash: string | undefined;
function getDummyHash() {
  dummyHash ??= bcrypt.hashSync("not-a-real-password", 12);
  return dummyHash;
}

const GENERIC_ERROR = "رقم الهاتف أو كلمة المرور غير صحيحة";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = normalizePhone(formData.get("phone"));
  const password = formData.get("password");

  if (!phone) return { error: "من فضلك اكتب رقم هاتف صحيح" };
  if (typeof password !== "string" || password.length === 0) {
    return { error: "من فضلك اكتب كلمة المرور" };
  }

  const { rows } = await db.query(
    `select id, password_hash, is_active, locked_until
       from users
      where phone = $1`,
    [phone],
  );
  const user = rows[0];

  if (user?.locked_until && new Date(user.locked_until) > new Date()) {
    return { error: "تم إيقاف المحاولات مؤقتًا بسبب كثرة الأخطاء. حاول بعد قليل أو كلّم أحد الخدّام." };
  }

  const ok = await bcrypt.compare(password, user?.password_hash ?? getDummyHash());

  if (!user || !user.is_active || !ok) {
    if (user) {
      await db.query(
        `update users
            set failed_attempts = case when failed_attempts + 1 >= $2 then 0 else failed_attempts + 1 end,
                locked_until    = case when failed_attempts + 1 >= $2
                                       then now() + make_interval(mins => $3)
                                       else locked_until end
          where id = $1`,
        [user.id, MAX_FAILED_ATTEMPTS, LOCK_MINUTES],
      );
    }
    return { error: GENERIC_ERROR };
  }

  await db.query("update users set failed_attempts = 0, locked_until = null where id = $1", [user.id]);
  await createSession(Number(user.id));
  redirect("/home");
}
