# GPD App — Supabase build

Greater Phoenix Division App, U.S. Coast Guard Auxiliary.
Migrated off base44 to Supabase + Vercel.

## Environment variables

Set these locally in `.env.local` and in Vercel project settings:

    VITE_SUPABASE_URL=https://veobytbspazfomskaelk.supabase.co
    VITE_SUPABASE_ANON_KEY=<anon key from Supabase > Settings > API>

The anon key is safe to expose in the browser. Row-Level Security, not key
secrecy, is what protects the data.

## Local development

    npm install
    npm run dev

## Architecture notes

`src/api/base44Client.js` is a compatibility layer, not the base44 SDK. It
exposes the same method surface the 46 existing source files were written
against (`entities.X.list/filter/create/update/delete/bulkCreate`,
`auth.me/logout/updateMe`, `functions.invoke`) but implements it against
Supabase. This let the migration proceed without rewriting every component.

Two translations happen inside it:
  - PascalCase entity names map to snake_case Postgres tables.
  - base44's `created_date` / `updated_date` map to `created_at` / `updated_at`,
    and are echoed back under the old names so existing views still render.

When components are eventually rewritten, they should call `supabase` directly
from `src/api/supabaseClient.js` and this shim can shrink.

## Not yet ported

The following base44 backend functions still need Supabase Edge Function
equivalents. Calls to them will throw until then:

  - parseBankStatement, matchBankTransactions  (Phase 2 — finance)
  - completeVesselExam, reprintVesselExam      (Phase 3 — operations)
  - logAuditEntry                              (Phase 4 — governance)
  - sendMonthlyVolunteerReports                (Phase 3)
  - updateUserRole, updateUserRoleAssignments  (Phase 4; role writes now
    belong in the office_assignment table)

`InvokeLLM`, `SendEmail`, `SendSMS`, `GenerateImage`, and
`ExtractDataFromUploadedFile` were base44 integrations with no Supabase
equivalent. They throw explicitly rather than returning undefined.

## Removed

`src/pages/UpdateDanRole.jsx` was a one-off utility that granted role
assignments to whoever loaded the page. It has been deleted and must not be
reintroduced. It should also be removed from the live base44 app.
