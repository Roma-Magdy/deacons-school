# مدرسة الشمامسة — Deacons School

Arabic web app where kids in grades 3–6 earn stars (shown as a shape they choose) for attending, competitions and good behavior. Servants add stars; leaderboards show rankings per grade and per branch.

Stack: Next.js (App Router) · Postgres (Neon) · Vercel.

## Status

Step 1 of the build plan is done:

- Arabic / right-to-left layout with the Cairo font
- Database schema (users, terms, branches, reasons, shapes, star awards)
- Phone number + password login (lockout for 15 minutes after 5 wrong passwords)
- A placeholder home page for kids (shows their star total) and for servants/admins

Next: admin screens to add kids and servants, then the servant "add stars" screen.

## Run it on your computer

1. Install dependencies:

   ```
   npm install
   ```

2. Create the `.env` file. If you ran Neon's `neon init`, it already contains `DATABASE_URL`. Add the other lines from `.env.example`:

   - `SESSION_SECRET` — generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD` (at least 8 characters), `SEED_ADMIN_NAME` — the first admin account

   `.env` is ignored by git. Never commit it.

3. Create the tables and the starting data:

   ```
   npm run db:migrate
   npm run db:seed
   ```

4. Start the app and open http://localhost:3000

   ```
   npm run dev
   ```

   Log in with the admin phone and password you put in `.env`.

`db:migrate` and `db:seed` are safe to run again; they skip anything that already exists.

## Deploying to Vercel

1. Import this GitHub repo in Vercel.
2. In the project's Environment Variables add `DATABASE_URL` (use Neon's pooled connection string, whose host contains `-pooler`) and `SESSION_SECRET`.
3. Deploy. Run `npm run db:migrate` and `npm run db:seed` from your computer; they use the same database.

## Notes

- Star totals are always calculated from the `star_awards` table (a ledger). Mistakes are fixed by voiding an award, not by editing numbers.
- Shapes are placeholders (emoji) for now. To use designed images later, set `image_url` on a shape.
- The seed creates one starting term with placeholder dates (Sep 2026 – Jan 2027). Terms will be editable in the admin screen.
- Phone numbers are private and never shown on leaderboards.
