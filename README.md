# Easy Expense Tracker

Personal expense tracker. Single-user, Google-OAuth, dark-mode, mobile + laptop responsive. Built with Next.js (App Router) + Supabase + Tailwind + shadcn/ui.

## Stack

- **Next.js 16** App Router (TypeScript, Turbopack)
- **Tailwind v4** + **shadcn/ui** (forced dark mode)
- **Supabase** Postgres + Auth (GitHub OAuth, locked to one email)
- **Recharts** for the dashboard charts
- **Vercel** for deployment

## One-time setup

### 1. Install Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
```

### 2. Create + link the cloud project

```bash
cd easy-expense-tracker
supabase projects create easy-expense-tracker --region ap-south-1   # Mumbai
# copy the project ref from output, then:
supabase link --project-ref <project-ref>
supabase db push                                               # runs migrations
```

### 3. Configure GitHub OAuth (no Supabase dashboard clicks)

1. In [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers), create a new OAuth App.
   - Homepage URL: `http://localhost:3000` (also add your Vercel URL after deploy)
   - Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Save the client ID and generate a client secret.
2. Put them in `.env.local`:
   ```
   SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=...
   SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=...
   ```
3. Push the auth config:
   ```bash
   supabase config push
   ```
4. Make sure your GitHub primary email (https://github.com/settings/emails) matches `ALLOWED_EMAIL`. The callback uses the email returned by GitHub to enforce the allowlist; if your primary email is private or different, sign-in will be rejected.

### 4. Set the allowed email at the DB level

The RLS policies read the email allowlist from `app.allowed_email`. Set it on the linked DB:

```bash
supabase db remote query "alter database postgres set app.allowed_email = 'harsh.m@simformsolutions.com'"
```

### 5. Generate typed DB client (optional but recommended)

```bash
supabase gen types typescript --linked > types/database.ts
```

### 6. Local env + run

```bash
cp .env.local.example .env.local         # fill in URL + ANON_KEY + ALLOWED_EMAIL
npm install
npm run dev
```

Open <http://localhost:3000> → sign in with Google → land on `/dashboard`.

## Deploy to Vercel

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ALLOWED_EMAIL
vercel --prod
```

After the first deploy, add the Vercel URL to Supabase's allowed redirect URLs in `supabase/config.toml`:

```toml
[auth]
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "https://<your-vercel-domain>/auth/callback",
]
```

Then `supabase config push`.

## Daily use

- **Add expense**: tap the **+** FAB. Type something like `100 petrol` or `lunch 250`. The amount is parsed and the category is auto-detected from keywords. If only an amount is typed (e.g. `500`), you’re asked to pick a category before save.
- **Dashboard**: this-month / this-year / daily-average KPIs, category donut, 30-day trend, and the current month’s transactions.
- **Transactions**: filter by date range and category, export CSV.
- **Budgets**: set a monthly limit per category; bars turn red when over.
- **Settings**: rename categories, recolor, edit keyword rules, archive unused, add new ones.

## Project layout

```
app/
  (auth)/sign-in/             Google sign-in page
  auth/callback/              OAuth code exchange + email allowlist
  (app)/
    layout.tsx                Auth-required shell (sidebar + bottom nav + FAB)
    dashboard/
    transactions/
    budgets/
    settings/
  api/transactions/export/    CSV download
components/                   Presentational + small client components
lib/
  supabase/{client,server,middleware}.ts
  parse-input.ts              "100 petrol" → { amount, description }
  categorize.ts               keyword-rule classifier
  format.ts                   ₹ formatter, date helpers
  queries.ts                  Typed RSC query helpers
supabase/
  config.toml                 Auth + Google OAuth wiring
  migrations/                 Schema + seeded categories
types/database.ts             DB row types (regen via `supabase gen types`)
middleware.ts                 Refresh session + protect (app)/* routes
```

## Updating the schema

Anything DB-related goes through migrations — no manual edits in the Supabase web dashboard:

```bash
supabase migration new <name>
# edit the new SQL file in supabase/migrations/
supabase db push
supabase gen types typescript --linked > types/database.ts
```
