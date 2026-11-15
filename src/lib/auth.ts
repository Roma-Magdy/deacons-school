import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSession } from "./session";

import type { Gender, Role } from "./strings";

export type { Gender, Role };

export type CurrentUser = {
  id: number;
  fullName: string;
  phone: string;
  role: Role;
  grade: number | null;
  shapeId: number | null;
  gender: Gender | null;
};

/** The logged-in user, re-read from the database on every request so deactivation and role changes apply immediately. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const id = await readSession();
  if (id === null) return null;

  const { rows } = await db.query(
    `select id, full_name, phone, role, grade, shape_id, gender
       from users
      where id = $1 and is_active`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    grade: row.grade,
    shapeId: row.shape_id === null ? null : Number(row.shape_id),
    gender: row.gender,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function isStaff(role: Role) {
  return role === "servant" || role === "branch_leader" || role === "admin";
}
