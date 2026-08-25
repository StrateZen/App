# GPD App Rebuild — Project Brief

**Read this first.** It contains every decision made so far, so the work can resume without
re-deriving anything.

---

## What this is

The Greater Phoenix Division App serves the U.S. Coast Guard Auxiliary Division 7 and its
Flotillas. It handles flotilla finances (transactions, budgets, bank reconciliation, journal
entries), operations (vessel safety examinations, volunteer activity hours), and governance
(role assignments, audit committees, audit trails, scheduled reports).

It currently runs on **base44** at `gpd.uscgaux.app`. We are migrating off that platform.

**Owner:** Dan (`dan@stratezen.co`), StrateZen Advisors. Dan is new to programming, prefers
decisions made and executed rather than presented for approval at each step, and reviews
results rather than intermediate work. Keep explanations brief; use analogies for new
concepts. He has limited use of his left arm — minimize required typing.

---

## Target architecture

| Layer | Choice | Status |
|---|---|---|
| Database | Supabase (Postgres + Auth + RLS + Storage) | Schema written and tested |
| Code hosting | GitHub, private repo | Dan sets up |
| Development | GitHub Codespaces + Claude Code | Browser-only, no local machine |
| Deployment | Vercel, auto-deploy from `main` | Not yet configured |

**Hard constraint: everything must run in the cloud.** Dan does not want anything on a local
machine. This is not a preference to work around — it drives the Codespaces choice.

---

## The central design insight

The original app collapses **three independent axes of authority** into a single role
enumeration. This is the root cause of several visible bugs and must not be reintroduced.

| Axis | Question | Examples | Where it belongs |
|---|---|---|---|
| **Office** | What position do you hold? | FSO-FN, SO-VE, Flotilla Commander | `office_assignment` |
| **Qualification** | What are you certified to do? | VE, IT, PV, Coxswain | `member_qualification` |
| **Committee** | What body do you sit on? | Audit committee chair | `committee_member` |

An office does not expire; a **qualification lapses**. That single difference is why
qualifications cannot live in a role enum.

Evidence this was the actual bug: `Vessel Examiner`, `Division Audit Committee`, and
`Flotilla Audit Committee` appear in `RoleConfig.jsx` permission checks but are **absent from
the `User` schema's role enum** — so they could never be assigned, and every page gated on
them was unreachable by the people it was built for.

Dan confirmed: *"FSO-VE is a Flotilla staff officer position and VE Examiner is a
qualification."*

---

## Security model — the whole point of this rebuild

**The original app has no row-level security.** All CRUD travels from the browser directly to
the base44 entity API. `RoleConfig.jsx` is enforced only in the client, so an authenticated
Auxiliarist could read or write another flotilla's financial records from the browser console.

The rebuild moves authorization into the database. Every tenant-scoped table answers two
questions, via the `may(entity, action, flotilla_id)` helper:

1. **Does this member's role permit the action?** → `has_permission()`
2. **Does their assignment reach this flotilla?** → `can_access_flotilla()`

Division-scope officers pass the second test for all flotillas; flotilla-scope officers pass
only for their own. This is Dan's "keycard" metaphor, now enforced by Postgres.

Client-side permission checks should still exist — but purely to hide controls the server
would refuse anyway. **Never treat a client check as the authority.**

---

## Current state

### Complete and tested

`001_schema.sql` — 24 tables, 55 RLS policies, trigger-based audit logging
`002_seed_permissions.sql` — 46 roles, 56 permissions, 534 grants, 6 qualifications

Both were run against a real Postgres 16 instance. Verified behavior:

- FSO-FN of Flotilla A sees only Flotilla A's transactions
- The same officer's write into Flotilla B is **refused by the database**
- An Auxiliarist can view transactions but cannot create them
- SO-FN (division scope) sees every flotilla
- A vessel exam naming an examiner with lapsed VE currency is **rejected**
- A vessel exam naming a current VE is accepted
- Audit rows are written by triggers, never by the client

The permission matrix was **extracted programmatically** from the live `RoleConfig.jsx` by
evaluating the module in Node — not retyped. Zero transcription risk.

### Key schema decisions

- `flotilla_id` is now a real foreign key on all tenant-scoped tables (was an unconstrained
  string). `reconciliation` carries it directly rather than reaching it through
  `bank_account`, with a trigger keeping the two in agreement.
- `budget_line_item` replaces the untyped `income_budget` / `expense_budget` JSON blobs, so
  budget lines are queryable and comparable to actuals in SQL.
- Role codes deliberately reuse the exact strings the current app uses (`'SO-FN'`,
  `'Super Admin'`), so existing `role_assignments` migrate one-to-one without translation.
- `enforce_office_scope()` rejects a division-scope role bound to a flotilla, and a
  flotilla-scope role without one.
- Vessel exams separate two questions: **role** governs who may *record* an exam;
  **qualification** governs who may be *named* as examiner. A Flotilla Commander may enter an
  exam on a VE's behalf; nobody — not even a Super Admin — can name a lapsed examiner.

### Assumptions made to keep moving (confirm with Dan before Phase 4)

1. Immediate Past Division/Flotilla Commanders → view-only
2. SO/FSO-AS, DV, NS, PV, SC, HR → `directory_only = true`, grant nothing
3. Only VE gates permissions; IT, PV, AUXOP, COX, CREW are tracked but gate nothing
4. Lapsed VE currency is a hard block, not an override-with-logging

---

## Remaining phases

**Phase 2 — Finance domain.** Replace the base44 SDK with a Supabase client. Wire
Transactions, Budgets, BankAccounts, Reconciliation, JournalEntry, PayeeVendor. Port
`parseBankStatement` and `matchBankTransactions` to Edge Functions — these carry real logic
worth preserving closely.

**Phase 3 — Operations.** VesselExam (five USCG form types, PDF generation) and
VolunteerActivity. Port `completeVesselExam` and `sendMonthlyVolunteerReports`.

**Phase 4 — Governance.** Role and qualification administration, audit committee management,
audit log viewer, report schedules.

**Phase 5 — Migration and cutover.** Export base44 data, transform, load. Run both systems in
parallel for one full reporting cycle. Cut over only when the numbers agree.

---

## Specific cleanup required

- **`src/pages/UpdateDanRole.jsx`** is a one-off administrative utility that grants role
  assignments. It must not survive into the rebuild, and should be removed from the live
  base44 app as well.
- `canWriteComponent()` and `canReadComponent()` in `AccessControl.jsx` return `true`
  unconditionally. Dead stubs — delete rather than port.
- Two role-update functions authorize on **different** rules: `updateUserRole` checks legacy
  `access_level === 'super_admin'`; `updateUserRoleAssignments` checks `role_assignments` for
  `Super Admin` **or** the base44-native `user.role === 'admin'`. Consolidate to one path.
- The legacy `access_level` / `flotilla_ids` fields must be migrated into office assignments
  and then retired. Do not carry both systems forward.

---

## Original app reference

base44 app ID `693829a377dc19b168d2f13c`. The `base44/` directory here contains the full
eject — 16 entity schemas and 8 backend functions, which the UI's ZIP export does *not*
include. `src/` holds 25 pages and 16 component groups.

To re-eject later: `npx base44 eject --app-id 693829a377dc19b168d2f13c --path ./gpd`
(requires a device-code login at `https://app.base44.com/login/device`).
