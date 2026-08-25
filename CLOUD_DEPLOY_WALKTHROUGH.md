# GPD App Rebuild — Your Step-by-Step Instructions

Everything here runs in a browser. Nothing installs on your machine.

**What I have already done:** designed and tested the database (24 tables, 55 security
policies, 46 roles, 534 permission grants), extracted your permission matrix from the live app
code, and validated the whole thing against a real Postgres 16 instance.

**What only you can do:** the four things below. They exist because they require *your*
credentials or *your* judgment — not because they're difficult. Budget about 30 minutes.

---

## Step 1 — Create the GitHub repository (5 minutes)

A repository is the permanent home for the code. Right now the only copy of your ejected
base44 project lives in a temporary workspace that erases itself; this fixes that for good.

1. Go to **https://github.com/new**
2. Repository name: `gpd-app`
3. Select **Private**
4. Check **Add a README file**
5. Click **Create repository**

Then upload the ZIP I provide:

6. On the new repo page, click **Add file → Upload files**
7. Drag in `gpdapp-rebuild.zip`
8. In the "Commit changes" box, type: `Initial import from base44`
9. Click **Commit changes**

> **Note:** GitHub will store the ZIP as a single file. That is fine for safekeeping — the
> Codespace in Step 3 will unpack it properly. The point right now is that your code exists
> somewhere permanent.

---

## Step 2 — Create the Supabase project and run the migrations (10 minutes)

Supabase is Postgres plus authentication, storage, and an auto-generated API. This is where
your data will live, and where the security rules I wrote will actually be enforced.

### 2a. Create the project

1. Go to **https://supabase.com/dashboard** and sign in with GitHub
2. Click **New project**
3. Organization: your personal one
4. Name: `gpd-app`
5. **Database password: click Generate, then immediately save it in your password manager.**
   Supabase will not show it again, and you cannot recover it later.
6. Region: **West US (North California)** — closest to Phoenix
7. Click **Create new project**, then wait about two minutes for provisioning

### 2b. Run migration 001 (the schema)

1. In the left sidebar, click **SQL Editor**
2. Click **New query**
3. Open `001_schema.sql`, select all of it, copy, and paste into the editor
4. Click **Run** (or press Ctrl+Enter)
5. Expect: **Success. No rows returned.**

### 2c. Run migration 002 (roles and permissions)

1. Click **New query** again
2. Paste the entire contents of `002_seed_permissions.sql`
3. Click **Run**
4. Expect: **Success. No rows returned.**

### 2d. Verify it worked

New query, paste this, Run:

```sql
select
  (select count(*) from role)            as roles,
  (select count(*) from permission)      as permissions,
  (select count(*) from role_permission) as grants,
  (select count(*) from pg_policies where schemaname = 'public') as security_policies;
```

**You should see exactly: 46 · 56 · 534 · 55.**

If those four numbers match, your database is built and secured. If any number differs, stop
and send me the result rather than continuing.

### 2e. Collect two values I will need

1. Left sidebar → **Project Settings** (gear icon) → **API**
2. Copy **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy the **anon / public** key (a long string starting `eyJ...`)

> **Safe to share with me:** the Project URL and the anon key. The anon key is designed to sit
> in browser code — the row-level security policies are what protect your data, not the
> secrecy of that key.
>
> **Never share:** the `service_role` key or the database password. The service_role key
> bypasses every security policy in the system. If either is ever exposed, rotate it
> immediately from this same settings page.

---

## Step 3 — Open a Codespace and start Claude Code (10 minutes)

A Codespace is a full development machine running in Microsoft's cloud, reached through your
browser. This satisfies your cloud-only requirement completely.

1. Go to your `gpd-app` repository on GitHub
2. Click the green **Code** button
3. Select the **Codespaces** tab
4. Click **Create codespace on main**
5. Wait roughly two minutes — a VS Code editor will open in your browser

Then, in the terminal panel at the bottom of that editor, paste these two lines one at a time:

```bash
npm install -g @anthropic-ai/claude-code
```

```bash
claude
```

Claude Code will ask you to sign in with your Anthropic account on first run. After that, it
has full access to the repository and can do the remaining build work — the frontend rewrite,
the Supabase wiring, and the deployment — with state that persists between sessions.

**Your first instruction to it should be:**

> Read PROJECT_BRIEF.md and continue the rebuild from Phase 2.

That file is in the ZIP and contains everything decided so far, so you will not need to
re-explain any of this.

---

## Step 4 — Decisions I still need from you

These are genuinely judgment calls about how the Auxiliary works. I made a defensible
assumption on each so the build could proceed; correcting any of them takes me about a minute.

| # | Question | My assumption | Consequence if wrong |
|---|---|---|---|
| 1 | Do **Immediate Past** Division/Flotilla Commanders retain any app access? | View-only on finance and operations | They see too much, or too little |
| 2 | Should **SO/FSO-AS, DV, NS, PV, SC, HR** have permissions, or appear only as directory entries? | Directory only — listed, but grant nothing | Those officers cannot do their jobs in the app |
| 3 | Beyond **VE**, which qualifications should gate app permissions? | None — IT, PV, AUXOP, Coxswain, Crew are tracked but gate nothing | Currency lapses go unenforced |
| 4 | Should a **lapsed VE currency** hard-block an exam, or warn and allow override? | Hard block — the database refuses it | Legitimate exams get rejected in the field |

Question 4 is the one I would most encourage you to think about. A hard block is correct
policy but unforgiving in practice; if a VE's currency lapses the morning of a scheduled
exam, the app will simply refuse. An override that logs who authorized it may serve the
Division better than an absolute rule.

---

## What happens after these steps

Phase 2 (finance domain), Phase 3 (operations), and Phase 4 (governance) all proceed inside
Claude Code, against the live Supabase database. You review and approve at each phase rather
than at each step.

The base44 app stays running untouched throughout. Nothing cuts over until you have run both
systems side by side for a full reporting cycle and are satisfied the numbers agree.
