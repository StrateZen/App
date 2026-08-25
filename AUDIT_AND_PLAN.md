# Greater Phoenix Division App — Data Model, Permission Audit, and Rebuild Plan

**Source:** base44 app `693829a377dc19b168d2f13c`, pulled 8 August 2026 via `base44 eject`
**Contents of the pull:** 16 entity schemas, 8 backend functions, 25 pages, 16 component groups, full build configuration
**Status:** Read-only analysis. Nothing was deployed or modified.

---

## 1. Data model

### 1.1 Structural entities

| Entity | Role | Notes |
|---|---|---|
| `Division` | Top of the hierarchy | Single record in practice; officer contact fields stored as flat columns (`commander_name`, `so_fn_email`, …) |
| `Flotilla` | Tenant boundary | 20 fields, same flat-officer pattern; `standing_rules_limit` drives spending authority |
| `User` | Identity + permissions | Discussed in §2 |
| `AppSettings` | Feature flags | 12 booleans keyed by a single `setting_key` |

### 1.2 Financial entities

`Transaction` · `Budget` · `BankAccount` · `Reconciliation` · `JournalEntry` · `PayeeVendor`

`Transaction` is the center of gravity (20 fields), carrying both the financial record and its
audit state (`audit_status`, `audit_reviewed_by`, `audit_review_date`, `audit_notes`).
`Budget` stores `income_budget` and `expense_budget` as untyped `object` blobs — meaning line
items have no schema and cannot be queried or validated at the data layer.

### 1.3 Operational entities

`VesselExam` (29 fields, five USCG form types, PDF generation) · `VolunteerActivity` ·
`AuditCommittee` · `AuditLog` · `Notification` · `ReportSchedule`

### 1.4 The tenancy key

**Eleven of sixteen entities carry `flotilla_id`:** AuditCommittee, AuditLog, BankAccount,
Budget, JournalEntry, Notification, ReportSchedule, Transaction, User, VesselExam,
VolunteerActivity.

This single field is the entire multi-tenancy model. It is a plain string with no foreign key,
no index declaration, and no constraint tying it to a real `Flotilla` record. `Reconciliation`
reaches its flotilla indirectly through `bank_account_id`, so it is one join away from the
tenancy boundary — an inconsistency worth resolving in the rebuild.

**Analogy:** every record wears a name tag saying which flotilla it belongs to, but nobody
checks the tags at the door, and nothing stops someone writing a tag for a flotilla that
doesn't exist.

---

## 2. Permission audit

### 2.1 Where authorization actually lives

Three layers exist, and all three are advisory rather than enforced:

| Layer | File | What it does | Enforced where |
|---|---|---|---|
| Page gating | `RoleConfig.jsx` → `PAGE_PERMISSIONS` | Controls which pages a role may open | Browser |
| Action gating | `RoleConfig.jsx` → `ENTITY_PERMISSIONS` | Controls view/create/edit/delete/approve per entity | Browser |
| Function gating | `base44/functions/*` | Real server-side checks | Server |

Only the third layer is trustworthy, and it covers just 8 operations. **All ordinary CRUD —
every transaction, budget, bank account, and vessel exam — travels from the browser directly to
the base44 entity API.** The entity schemas contain **no row-level security rules whatsoever**.
The permission matrix is a very well-designed set of instructions posted on the lobby wall; it
is not a lock.

Practical consequence: an authenticated Auxiliarist who opens the browser console can read or
write another flotilla's financial records. The UI would never offer it, but nothing on the
server refuses it.

### 2.2 The dual-role problem

`User` carries two generations of permission model simultaneously:

- **Legacy:** `access_level` (`super_admin` | `division_staff` | `flotilla_staff`) + `flotilla_ids[]`
- **Current:** `role_assignments[]` — an array of `{ role, flotilla_id }` pairs

Both are marked `required` in the schema, and `getUserRoles()` in `AccessControl.jsx` falls back
through legacy values when `role_assignments` is empty, ending at a default of `Auxiliarist` for
anyone unrecognized. This is your keycard model working correctly in spirit — role plus unit —
but implemented twice, in two places, with silent fallbacks between them.

### 2.3 Role vocabulary drift

The schema enum and the application code disagree about which roles exist:

**In the schema but unknown to `RoleConfig.jsx` (13):** SO-AS, SO-DV, SO-HR, SO-NS, SO-PV,
SO-SC, FSO-AS, FSO-DV, FSO-NS, FSO-PV, FSO-SC, Immediate Past Division Commander,
Immediate Past Flotilla Commander

**In `RoleConfig.jsx` but rejected by the schema (3):** Division Audit Committee,
Flotilla Audit Committee, Vessel Examiner

The second group is the more serious — and the diagnosis is now confirmed: **none of those three
is a role at all.**

- `Vessel Examiner` is a **qualification**. The staff officer position is FSO-VE; the
  qualification is held by members regardless of office, and many VEs hold no staff position.
- `Division Audit Committee` and `Flotilla Audit Committee` are **committee memberships**, and
  the app already models them properly in the `AuditCommittee` entity
  (`member_email`, `role: chair|member`, `flotilla_id`).

All three were forced into the role enumeration because it was the only axis available. The
schema correctly refused them, which is why any page gated on them is unreachable — the code is
asking a question the data model cannot answer.

**This is the central modeling error to correct in the rebuild.** Authority in the Auxiliary
runs on three independent axes, and the current design collapses them into one:

| Axis | Question it answers | Example | Current home |
|---|---|---|---|
| **Office** | What position do you hold? | FSO-VE, SO-FN, Flotilla Commander | `role_assignments` |
| **Qualification** | What are you certified to do? | VE, IT, PV, coxswain | *nowhere* |
| **Committee** | What body do you sit on? | Flotilla audit committee chair | `AuditCommittee` |

A member may perform vessel exams because of the second axis while holding no office at all.
Conversely, an FSO-VE who has not maintained currency should not be completing exams. Only a
separate qualification axis can express either fact.

### 2.4 Additional inconsistencies

1. **Two role-update functions with different rules.** `updateUserRole` authorizes on legacy
   `access_level === 'super_admin'`; `updateUserRoleAssignments` authorizes on
   `role_assignments` containing `Super Admin` **or** `user.role === 'admin'` (a base44-native
   field). Both then write via `asServiceRole`, bypassing all further checks.
2. **Dead stubs.** `canWriteComponent()` and `canReadComponent()` return `true`
   unconditionally.
3. **`logAuditEntry` accepts client-supplied content.** The caller passes `entity_type`,
   `entity_id`, `action`, and `changes`; the server only stamps identity, IP, and user agent.
   An audit trail whose contents the audited party controls is weak evidence.
4. **Financial authority is hardcoded.** `canManageFinancials()` grants only Super Admin, SO-FN,
   and FSO-FN — reasonable, but it lives in three overlapping places
   (`ENTITY_PERMISSIONS`, `canManageFinancials`, per-page checks) that can drift apart.

---

## 3. Rebuild plan

The goal is to move authorization from the browser to the database, so that permission becomes a
property of the data rather than a property of the screen.

### Phase 1 — Foundation
- **Postgres** (Supabase or Neon) as the system of record.
- Promote `flotilla_id` to a real foreign key on all eleven entities; add `flotilla_id` to
  `Reconciliation` directly rather than by join.
- Replace `Budget.income_budget` / `expense_budget` blobs with a `BudgetLineItem` table.
- Normalize the officer contact fields on `Division` and `Flotilla` into an `OfficerAssignment`
  table keyed by role — which also makes the role vocabulary a single source of truth.

### Phase 2 — Permissions as data, on three axes
- One `roles` table and one `role_permissions` table, seeded from the existing
  `ENTITY_PERMISSIONS` matrix. The matrix is genuinely good work; it should be preserved and
  moved, not rewritten.
- **New `Qualification` and `MemberQualification` tables.** The latter carries
  `member_id`, `qualification_code` (VE, IT, PV, …), `earned_date`, `currency_expires_date`,
  and `active`. Expiry is the reason this must be data rather than an enum value — a
  qualification lapses, an office does not.
- **Committee membership stays in `AuditCommittee`**, extended to cover division-level
  committees rather than flotilla-only.
- Drop `Vessel Examiner`, `Division Audit Committee`, and `Flotilla Audit Committee` from the
  role vocabulary entirely; re-express every permission that referenced them against the
  correct axis. `VesselExam.examiner_id` should validate against a current VE qualification.
- Reconcile the remaining 13 drifted role names before seeding.
- Retire `access_level` and `flotilla_ids` after a one-time migration into `role_assignments`.

### Phase 3 — Enforcement
- **Row-level security policies** on every tenant-scoped table, keyed on the same two conditions
  you described: the user's role, and whether their assignment matches the row's `flotilla_id`
  (division-level roles matching all flotillas).
- Client-side checks remain — but purely for user experience, hiding buttons the server would
  refuse anyway. Belt and suspenders, with the suspenders finally attached.

### Phase 4 — Integrity and cutover
- Audit logging via database triggers rather than a client-invoked function.
- Port the 8 backend functions; `parseBankStatement`, `matchBankTransactions`, and the vessel
  exam PDF generation carry real logic worth preserving closely.
- Migrate data, run both systems in parallel for one reporting cycle, then cut over.

---

## 4. Recommended decisions

1. **~~Decide the `Vessel Examiner` question.~~** Resolved: FSO-VE is the office, VE is the
   qualification. Same correction applies to both audit-committee entries. Three axes, per §2.3.
2. **Confirm the qualification list.** VE is certain. Which others does the Division need to
   track — IT, PV, AUXOP, coxswain, crew, watchstander? Only those that gate an app permission
   need to be modeled now; the rest can be added later without schema change.
3. **Confirm the remaining 13 role names.** Chiefly whether the *Immediate Past* commander
   positions carry any access, and whether the staff officer positions absent from the code
   (SO/FSO-AS, DV, NS, PV, SC, HR) should have permissions or exist only as directory entries.
4. **Choose the platform.** Supabase gives RLS, auth, and storage in one package and maps most
   directly onto this architecture; Neon plus a separate auth provider gives more control.

### Immediate housekeeping

The page `UpdateDanRole.jsx` appears to be a one-off administrative utility that grants role
assignments. It should not survive into the rebuild, and is worth reviewing in the live app now.
