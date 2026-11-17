# Deacons School Stars App (برنامج نجوم مدرسة الشمامسة)

A small web app for the deacons school: servants give kids stars for attendance, behaviour and competitions, and kids see their stars, their chosen shape, their star history and a leaderboard. The whole interface is in Arabic (RTL).

**Stack:** Next.js (React) on Vercel, Postgres on Neon, login by phone number and password (hashed, kept in a signed cookie).

## What the app does

**Kids**
- Home: the chosen shape (tap the circle with 🎨 to change it), total stars, the next shape to unlock, the colored star chart, and the place in their grade this term.
- Shape picker: free shapes, unlocked shapes, and locked ones greyed out with "X stars to go". A shape, once unlocked, stays unlocked even if a star is cancelled later.
- Star history: every star received, with the reason and date. Servant names and notes are never shown to kids.
- Leaderboard: this term only, within the kid's own grade. Tabs: all stars, then one tab per reason. The competition tab has a second row: all branches, or one branch. Ties share a place. Only first and second name show, never phone numbers.

**Servants**
- Add stars: pick a grade, tap kids (or search), choose the reason and amount, choose the branch for competitions. Several kids at once. Recent awards with undo.
- Leaderboard for any grade.

**Admin** (everything above, plus)
- Kids and servants: add, edit, reset password, deactivate, delete, Excel/CSV import, grade tabs, search, bulk move, yearly promotion (with undo) and the graduates archive.
- Terms: add, edit, activate (only one is active), delete an empty one.
- Reasons: add, rename, hide/show, reorder, delete an unused one. The competition reason can't be hidden or deleted, and the last visible reason can't be removed.
- Shapes: add, edit, hide/show, delete an unused one, upload artwork (PNG/JPG/WebP, shrunk automatically; SVG is refused). Stars needed: 0 means free for everyone.
- Award history (سجل النجوم): every award, with filters (term, reason, grade, name), and a void button on any row. A voided award stays in the history, greyed out, and stops counting everywhere.

**Passwords**
- A new account (or one the admin just reset) sees a "choose your own password" screen once after login. It can be skipped.
- Everyone has a "كلمة السر" button on the home page to change their password at any time.

## Rules worth knowing
- Stars are a ledger: totals are always calculated from the awards, never stored as a counter. Fixing a mistake means voiding the award.
- Stars always belong to the active term. Without an active term nobody can give stars (the admin must activate one in "الترمات").
- Branches (الألحان، الطقس، المحفوظات، القبطي) are fixed and have no admin screen.
- Servants can give stars to any kid. There is no time limit on a servant's undo for their own recent awards.

## Project layout
- `src/app/...` pages and server actions (`admin/`, `stars/`, `home/`, `shapes/`, `history/`, `leaderboard/`, `password/`, `login/`)
- `src/lib/...` shared code (database, session, validation, ranking). Files ending in `.mjs` are plain JavaScript so they can be unit-tested.
- `db/migrations/*.sql` database changes, applied in order, once each
- `scripts/seed.mjs` creates the starting data and the first admin
- `scripts/migrate.mjs` applies the migrations
- `tests/*.test.mjs` unit tests

## Environment variables

| Name | Needed where | What it is |
|---|---|---|
| `DATABASE_URL` | Vercel, and your computer when running migrate/seed | Neon connection string. On Vercel use the **pooled** one (the host contains `-pooler`). |
| `SESSION_SECRET` | Vercel, and your computer for local runs | A random string of **at least 32 characters**. Keep it secret. Changing it logs everybody out. |
| `SEED_ADMIN_PHONE` | Only when running the seed | Phone number of the first admin (e.g. `01012345678`). |
| `SEED_ADMIN_PASSWORD` | Only when running the seed | The first admin's starting password. |
| `SEED_ADMIN_NAME` | Only when running the seed (optional) | The admin's name. Defaults to "المدير". |
| `SEED_ADMIN_GENDER` | Only when running the seed (optional) | The admin's gender (`male` or `female`), used for the greeting. |

Make a random secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

For local work put the variables in a `.env.local` file (never commit it). If a command doesn't pick them up, set them in the terminal before running it.

## Run it on your computer
1. Install Node.js (LTS) and run `npm install`.
2. Create a Neon database (see below) and put `DATABASE_URL` and `SESSION_SECRET` in `.env.local`.
3. `npm run db:migrate` (creates the tables)
4. Set the `SEED_ADMIN_*` variables, then `npm run db:seed` (creates branches, reasons, shapes, a first term and the admin)
5. `npm run dev` and open http://localhost:3000
6. Before any release run `npm test`, `npm run lint` and `npm run build`. All three must pass.

## Deploy checklist (Vercel + Neon)

### 1. Database (Neon)
- [ ] Create a project at neon.tech (free tier is enough for ~300 kids).
- [ ] Copy the **pooled** connection string (host contains `-pooler`). It is your `DATABASE_URL`.
- [ ] On your computer, set `DATABASE_URL` to it, then run `npm run db:migrate`. All migrations (001 to 008) should be applied. Run it again: it should say nothing is left to apply.
- [ ] Set the `SEED_ADMIN_*` variables and run `npm run db:seed` once. It is safe to run twice: existing rows are left alone.
- [ ] Open the Neon console and check the tables exist, and there are 4 branches, 5 reasons, 7 shapes and 1 term.

### 2. Code (GitHub)
- [ ] Put the project in a GitHub repository. Make sure `.env.local` and `node_modules` are ignored (`.gitignore`).
- [ ] `npm test`, `npm run lint` and `npm run build` pass on your computer.

### 3. Hosting (Vercel)
- [ ] Import the GitHub repository in Vercel (framework: Next.js, default settings).
- [ ] Add the environment variables `DATABASE_URL` (pooled) and `SESSION_SECRET` for **Production**. The seed variables are not needed on Vercel.
- [ ] Deploy and open the address Vercel gives you.

### 4. First check on the live site
- [ ] Log in as the admin (phone + the seed password). The "choose your own password" screen may appear; change the password now.
- [ ] Admin home shows: accounts, terms, reasons, shapes, award history, add stars, leaderboard.
- [ ] Terms: check the starting term's name and dates (edit if needed). It must be the active one.
- [ ] Add a test kid and a test servant. Log in as each, from a phone.
- [ ] As the servant: give the test kid stars (try a competition with a branch). Undo one.
- [ ] As the kid: the home page shows the stars and chart, the 🎨 circle opens the shape picker, history shows the stars, the leaderboard shows the kid.
- [ ] As the admin: award history shows the stars; void one and check the kid's total drops.
- [ ] Delete the test accounts (or deactivate them).

### 5. Real data
- [ ] Reasons: rename or add the reasons you really use.
- [ ] Shapes: add or edit shapes and upload the real artwork.
- [ ] Import the kids from a spreadsheet (accounts → import). Download the list of starting passwords right away: it is shown only once.
- [ ] Hand each family their phone number and starting password. They can change it from the "كلمة السر" button, but they are not forced to.

## Day-to-day and yearly tasks
- **New term:** admin → الترمات → add the new term → activate it. Old stars stay on the old term; leaderboards start fresh.
- **Wrong award:** admin → سجل النجوم → find it → إلغاء. (A servant can also undo their own recent awards from the add-stars screen.)
- **Forgotten password:** admin → open the account → reset password. The user sees the "choose your own password" screen again.
- **Yearly promotion:** admin → accounts → promotion. It can be undone once, right after.
- **Database changes later:** add a new numbered `.sql` file to `db/migrations/`, then run `npm run db:migrate` against the live database **before** deploying code that needs it.

## Troubleshooting
- *"SESSION_SECRET must be set..."* The variable is missing or shorter than 32 characters.
- *Nobody can give stars:* no active term. Admin → الترمات → activate one.
- *Pages work locally but the live site can't reach the database:* check that `DATABASE_URL` on Vercel is the pooled string and includes `sslmode=require`.
- *A page says a table or column doesn't exist:* a migration was not applied. Run `npm run db:migrate` against the live database.
- *Locked out after wrong passwords:* the account unlocks after 15 minutes, or the admin resets the password.

## Privacy
- Only logged-in users can see anything. Phone numbers are never shown to kids or on any leaderboard.
- Leaderboards show first and second name only.
- Passwords are stored hashed (bcrypt), never in plain text. Servant names and notes are never shown to kids.
- Uploaded shape pictures are checked on the server (real PNG, small size) and served with a fixed image type.
