// Seeds reference data (branches, reasons, shapes, a first term) and the first admin.
// Safe to run more than once: existing rows are left alone.
// Run with: npm run db:seed
import bcrypt from "bcryptjs";
import pg from "pg";
import { normalizePhone } from "../src/lib/phone.mjs";

const { DATABASE_URL, SEED_ADMIN_PHONE, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run the Neon setup first (see README).");
  process.exit(1);
}

const branches = [
  ["liturgical", "الطقس", 1],
  ["coptic", "القبطي", 2],
  ["archives", "الأرشيف", 3],
  ["chants", "الألحان", 4],
];

// [slug, name, is_competition, sort]
const reasons = [
  ["class", "حضور الفصل", false, 1],
  ["doxology", "حضور التسبحة", false, 2],
  ["mass", "حضور القداس", false, 3],
  ["competition", "مسابقة", true, 4],
  ["politeness", "أدب وسلوك", false, 5],
];

// [slug, name, emoji (placeholder), stars_required, sort]
// The first three are free to choose; the rest unlock by lifetime stars.
const shapes = [
  ["star", "نجمة", "⭐", 0, 1],
  ["football", "كورة", "⚽", 0, 2],
  ["cat", "قطة", "🐱", 0, 3],
  ["dove", "حمامة", "🕊️", 20, 4],
  ["little-deacon", "شماس صغير", "🧒", 40, 5],
  ["trophy", "كأس", "🏆", 80, 6],
  ["crown", "تاج", "👑", 150, 7],
];

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  await client.query("begin");

  for (const [slug, name, sort] of branches) {
    await client.query(
      "insert into branches (slug, name_ar, sort_order) values ($1, $2, $3) on conflict (slug) do nothing",
      [slug, name, sort],
    );
  }
  for (const [slug, name, isComp, sort] of reasons) {
    await client.query(
      "insert into reasons (slug, name_ar, is_competition, sort_order) values ($1, $2, $3, $4) on conflict (slug) do nothing",
      [slug, name, isComp, sort],
    );
  }
  for (const [slug, name, emoji, required, sort] of shapes) {
    await client.query(
      "insert into shapes (slug, name_ar, emoji, stars_required, sort_order) values ($1, $2, $3, $4, $5) on conflict (slug) do nothing",
      [slug, name, emoji, required, sort],
    );
  }

  // A starting term so stars can be awarded right away. Admins can rename it or change the dates.
  const terms = await client.query("select count(*)::int as n from terms");
  if (terms.rows[0].n === 0) {
    await client.query(
      "insert into terms (name, start_date, end_date, is_active) values ($1, $2, $3, true)",
      ["الترم الأول", "2026-09-01", "2027-01-31"],
    );
    console.log("Created a starting term (edit its name/dates later in the admin screen).");
  }

  // First admin
  if (SEED_ADMIN_PHONE && SEED_ADMIN_PASSWORD) {
    const phone = normalizePhone(SEED_ADMIN_PHONE);
    if (!phone) throw new Error("SEED_ADMIN_PHONE is not a valid phone number.");
    if (SEED_ADMIN_PASSWORD.length < 8) throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");

    const exists = await client.query("select 1 from users where phone = $1", [phone]);
    if (exists.rowCount === 0) {
      const hash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);
      await client.query(
        "insert into users (phone, password_hash, full_name, role) values ($1, $2, $3, 'admin')",
        [phone, hash, SEED_ADMIN_NAME || "المدير"],
      );
      console.log(`Created admin account for ${phone}.`);
    } else {
      console.log("Admin account already exists; left unchanged.");
    }
  } else {
    console.log("SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD not set; no admin account created.");
  }

  await client.query("commit");
  console.log("Seed finished.");
} catch (err) {
  await client.query("rollback");
  throw err;
} finally {
  await client.end();
}
