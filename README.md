# مدرسة الشمامسة — Deacons School

Arabic web app where kids in grades 3–6 earn stars (shown as a shape they choose) for attending, competitions and good behavior. Servants add stars; leaderboards show rankings per grade and per branch.

Stack: Next.js (App Router) · Postgres (Neon) · Vercel.

## Status

Steps 1 and 2 of the build plan are done:

- Arabic / right-to-left layout with the Cairo font, in light Egyptian Arabic
- School logo and a theme built from its colors (light and dark mode); playful kid home page, calmer servant home page
- Greetings by role and gender (شماسنا الشاطر / تاسونتنا الشاطرة / يا باسون / يا تاسوني)
- Database schema (users, terms, branches, reasons, shapes, star awards)
- Phone number + password login (lockout for 15 minutes after 5 wrong passwords)
- A placeholder home page for kids (shows their star total) and for servants/admins
- Admin screens (admins only) at `/admin/users`: list with search and filters, add one account, edit, new password (also clears a lockout), stop/restart an account, and import from Excel

Next: the servant "add stars" screen.

## Adding kids and servants (admins)

Log in as admin and open «إدارة الحسابات» on the home page.

- **Add one:** pick the account type, fill in the details. Leave the password empty to get a generated one (6 digits for kids, 8 characters for servants). It is shown **once**, so send it to the family right away.
- **Import from Excel:** select the columns in Excel, copy, and paste into the import page (or save as CSV and choose the file). Column order without a header row: name, mobile, grade, gender for kids; name, mobile, gender for servants. With a header row (الاسم، الموبايل، الصف، النوع) the columns can be in any order. Rows with problems are listed with their line number and skipped; the rest are added. Download the result file with the generated passwords before closing the page.
- **Rules:** a mobile number can belong to only one account; kids need first and second name, a grade (3-6) and a gender (the gender picks the greeting wording).
- Accounts are never deleted, only stopped, because star history refers to them.
- Passwords are stored hashed. Nobody, including admins, can read an existing password; use «كلمة سر جديدة» instead.

## Run it on your computer

1. Install dependencies:

   ```
   npm install
   ```

2. Create the `.env` file. If you ran Neon's `neon init`, it already contains `DATABASE_URL`. Add the other lines from `.env.example`:

   - `SESSION_SECRET` — generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD` (at least 8 characters), `SEED_ADMIN_NAME`, `SEED_ADMIN_GENDER` (`male` or `female`) — the first admin account

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

`db:migrate` and `db:seed` are safe to run again; they skip anything that already exists. If the admin account already exists without a gender, running `db:seed` with `SEED_ADMIN_GENDER` set fills it in (it never overwrites a gender that is already set).

## Tests

`npm test` runs the checks for phone numbers and the Excel import parser.

## Deploying to Vercel

1. Import this GitHub repo in Vercel.
2. In the project's Environment Variables add `DATABASE_URL` (use Neon's pooled connection string, whose host contains `-pooler`) and `SESSION_SECRET`.
3. Deploy. Run `npm run db:migrate` and `npm run db:seed` from your computer; they use the same database.

## Changing the wording

Every sentence the app shows is in `src/lib/strings.ts`. Edit it there; no other file needs to change.

## Notes

- The logo is `public/logo.png`. The browser-tab icon is `src/app/icon.png` and `src/app/apple-icon.png`.

- Star totals are always calculated from the `star_awards` table (a ledger). Mistakes are fixed by voiding an award, not by editing numbers.
- Shapes are placeholders (emoji) for now. To use designed images later, set `image_url` on a shape.
- The seed creates one starting term with placeholder dates (Sep 2026 – Jan 2027). Terms will be editable in the admin screen.
- Phone numbers are private and never shown on leaderboards.
