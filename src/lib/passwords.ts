import "server-only";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

// Without look-alike characters (0/O, 1/l/I) so passwords read out or typed from WhatsApp don't get mixed up.
const STAFF_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Kids get 6 digits (easy to type on a phone); servants get 8 letters and digits.
 * These are starting passwords that an admin hands out, and the lockout limits guessing.
 */
export function generatePassword(kind: "kid" | "staff"): string {
  if (kind === "kid") return String(randomInt(0, 1_000_000)).padStart(6, "0");
  let out = "";
  for (let i = 0; i < 8; i++) out += STAFF_ALPHABET[randomInt(0, STAFF_ALPHABET.length)];
  return out;
}

export const MIN_PASSWORD_LENGTH = 6;

/** Cost 10 keeps importing a few hundred accounts fast enough for a serverless function. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
