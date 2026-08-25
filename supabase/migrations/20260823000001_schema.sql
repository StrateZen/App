-- =====================================================================
-- Greater Phoenix Division App — Core schema
-- Target: Postgres 15+ / Supabase
-- Migration 001 of 2. Run 002_seed_permissions.sql immediately after.
--
-- Design principle: authorization is a property of the data, enforced by
-- row-level security, not a property of the screen. The client may still
-- hide buttons, but the database is the authority.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- =====================================================================
-- 1. ORGANIZATION
-- =====================================================================

create table division (
  id                uuid primary key default gen_random_uuid(),
  division_number   text not null unique,
  division_name     text,
  logo_url          text,
  meeting_location  text,
  meeting_address   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table flotilla (
  id                    uuid primary key default gen_random_uuid(),
  division_id           uuid not null references division(id) on delete restrict,
  flotilla_number       text not null unique,
  flotilla_name         text not null,
  logo_url              text,
  meeting_location      text,
  meeting_address       text,
  location              text,
  standing_rules_limit  numeric(12,2),
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on flotilla (division_id);

create table member (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique,              -- FK to auth.users on Supabase
  email         citext not null unique,
  full_name     text,
  phone         text,
  auxid         text unique,              -- USCG Auxiliary member ID
  address       text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on member (auth_user_id);

-- =====================================================================
-- 2. AUTHORITY, AXIS 1 — OFFICE
--
-- Role codes deliberately reuse the exact strings the current app uses
-- ('SO-FN', 'Super Admin'), so existing role_assignments migrate without
-- translation.
-- =====================================================================

create type role_scope as enum ('division', 'flotilla');

create table role (
  code          text primary key,
  display_name  text not null,
  scope         role_scope not null,
  is_super      boolean not null default false,
  directory_only boolean not null default false,  -- listed, but grants nothing
  sort_order    integer not null default 100
);

create table office_assignment (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references member(id) on delete cascade,
  role_code    text not null references role(code) on delete restrict,
  flotilla_id  uuid references flotilla(id) on delete cascade,
  start_date   date,
  end_date     date,
  created_at   timestamptz not null default now(),
  unique (member_id, role_code, flotilla_id)
);
create index on office_assignment (member_id);
create index on office_assignment (flotilla_id);

-- A division-scope office must NOT name a flotilla; a flotilla-scope office
-- MUST. This is the keycard rule, enforced at write time.
create or replace function enforce_office_scope() returns trigger
language plpgsql as $$
declare s role_scope;
begin
  select scope into s from role where code = new.role_code;
  if s = 'division' and new.flotilla_id is not null then
    raise exception 'Role % is division-scope and cannot be tied to a flotilla', new.role_code;
  elsif s = 'flotilla' and new.flotilla_id is null then
    raise exception 'Role % is flotilla-scope and requires a flotilla_id', new.role_code;
  end if;
  return new;
end $$;

create trigger trg_office_scope before insert or update on office_assignment
  for each row execute function enforce_office_scope();

-- =====================================================================
-- 3. AUTHORITY, AXIS 2 — QUALIFICATION
--
-- A qualification is earned, is held independently of any office, and can
-- LAPSE. That last property is why it cannot live in the role enumeration:
-- an office does not expire, a currency does.
-- =====================================================================

create table qualification (
  code              text primary key,
  display_name      text not null,
  requires_currency boolean not null default true,
  description       text
);

create table member_qualification (
  id                     uuid primary key default gen_random_uuid(),
  member_id              uuid not null references member(id) on delete cascade,
  qualification_code     text not null references qualification(code) on delete restrict,
  earned_date            date,
  currency_expires_date  date,
  active                 boolean not null default true,
  notes                  text,
  unique (member_id, qualification_code)
);
create index on member_qualification (member_id);

-- =====================================================================
-- 4. AUTHORITY, AXIS 3 — COMMITTEE
-- =====================================================================

create type committee_level as enum ('division', 'flotilla');
create type committee_role  as enum ('chair', 'member');

create table committee (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  level        committee_level not null,
  flotilla_id  uuid references flotilla(id) on delete cascade,
  active       boolean not null default true,
  check ((level = 'flotilla') = (flotilla_id is not null))
);

create table committee_member (
  id              uuid primary key default gen_random_uuid(),
  committee_id    uuid not null references committee(id) on delete cascade,
  member_id       uuid not null references member(id) on delete cascade,
  role            committee_role not null default 'member',
  appointed_date  date,
  term_end_date   date,
  active          boolean not null default true,
  unique (committee_id, member_id)
);

-- =====================================================================
-- 5. PERMISSION MATRIX
-- Seeded in 002 from the existing ENTITY_PERMISSIONS map.
-- =====================================================================

create table permission (
  entity  text not null,
  action  text not null,
  primary key (entity, action)
);

create table role_permission (
  role_code  text not null references role(code) on delete cascade,
  entity     text not null,
  action     text not null,
  primary key (role_code, entity, action),
  foreign key (entity, action) references permission(entity, action) on delete cascade
);

-- =====================================================================
-- 6. HELPER FUNCTIONS
-- SECURITY DEFINER so that policies can read authority tables without
-- recursing through the policies on those same tables.
-- =====================================================================

create or replace function current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from member where auth_user_id = auth.uid() and active
$$;

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from office_assignment oa
      join role r on r.code = oa.role_code
    where oa.member_id = current_member_id() and r.is_super
  )
$$;

create or replace function has_division_role() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from office_assignment oa
      join role r on r.code = oa.role_code
    where oa.member_id = current_member_id()
      and r.scope = 'division'
      and not r.directory_only
  )
$$;

-- The keycard test: division officers hold a master key; flotilla officers
-- hold keys only to their own doors.
create or replace function can_access_flotilla(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_super_admin()
      or has_division_role()
      or exists (
        select 1 from office_assignment
        where member_id = current_member_id() and flotilla_id = target
      )
$$;

create or replace function has_permission(p_entity text, p_action text) returns boolean
language sql stable security definer set search_path = public as $$
  select is_super_admin()
      or exists (
        select 1 from office_assignment oa
          join role_permission rp on rp.role_code = oa.role_code
        where oa.member_id = current_member_id()
          and rp.entity = p_entity
          and rp.action = p_action
      )
$$;

create or replace function has_current_qualification(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_qualification mq
      join qualification q on q.code = mq.qualification_code
    where mq.member_id = current_member_id()
      and mq.qualification_code = p_code
      and mq.active
      and (not q.requires_currency
           or mq.currency_expires_date is null
           or mq.currency_expires_date >= current_date)
  )
$$;

-- Convenience wrapper: the two conditions that gate almost every row.
create or replace function may(p_entity text, p_action text, p_flotilla uuid)
returns boolean language sql stable as $$
  select has_permission(p_entity, p_action) and can_access_flotilla(p_flotilla)
$$;

-- =====================================================================
-- 7. FINANCIAL RECORDS
-- =====================================================================

create type transaction_type   as enum ('income', 'expense');
create type payment_method     as enum ('cash', 'check', 'card', 'other');
create type authorization_kind as enum ('routine', 'emergency', 'special');
create type audit_status       as enum ('pending', 'reviewed', 'flagged', 'approved');
create type budget_period      as enum ('annual', 'quarterly', 'monthly');
create type budget_direction   as enum ('income', 'expense');

create table bank_account (
  id                 uuid primary key default gen_random_uuid(),
  flotilla_id        uuid not null references flotilla(id) on delete restrict,
  account_name       text not null,
  account_number     text not null,
  bank_name          text not null,
  bank_branch        text,
  bank_address       text,
  bank_phone         text,
  bank_email         text,
  primary_signer     uuid references member(id),
  secondary_signer   uuid references member(id),
  additional_signers text,
  active             boolean not null default true,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on bank_account (flotilla_id);

create table payee_vendor (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       citext,
  phone       text,
  address     text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table budget (
  id             uuid primary key default gen_random_uuid(),
  flotilla_id    uuid not null references flotilla(id) on delete restrict,
  budget_year    integer not null,
  budget_period  budget_period not null default 'annual',
  period_start   date not null,
  period_end     date not null,
  approved       boolean not null default false,
  approved_by    uuid references member(id),
  approved_at    timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (period_end >= period_start),
  unique (flotilla_id, budget_year, period_start)
);
create index on budget (flotilla_id);

-- Replaces the untyped income_budget / expense_budget JSON blobs, so that
-- budget lines become queryable and can be compared to actuals in SQL.
create table budget_line_item (
  id           uuid primary key default gen_random_uuid(),
  budget_id    uuid not null references budget(id) on delete cascade,
  direction    budget_direction not null,
  category     text not null,
  description  text,
  amount       numeric(12,2) not null check (amount >= 0),
  unique (budget_id, direction, category)
);
create index on budget_line_item (budget_id);

create table "transaction" (
  id                  uuid primary key default gen_random_uuid(),
  flotilla_id         uuid not null references flotilla(id) on delete restrict,
  transaction_type    transaction_type not null,
  category            text not null,
  description         text not null,
  amount              numeric(12,2) not null check (amount > 0),
  transaction_date    date not null,
  method              payment_method,
  check_number        text,
  authorization_kind  authorization_kind default 'routine',
  payee_vendor_id     uuid references payee_vendor(id),
  vendor_payee        text,       -- retained for free-text legacy entries
  receipt_url         text,
  budget_line_item_id uuid references budget_line_item(id),
  approved_by         uuid references member(id),
  approved_at         timestamptz,
  audit_status        audit_status not null default 'pending',
  audit_reviewed_by   uuid references member(id),
  audit_review_date   date,
  audit_notes         text,
  notes               text,
  created_by          uuid references member(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on "transaction" (flotilla_id, transaction_date desc);
create index on "transaction" (audit_status) where audit_status <> 'approved';

create table reconciliation (
  id                uuid primary key default gen_random_uuid(),
  flotilla_id       uuid not null references flotilla(id) on delete restrict,
  bank_account_id   uuid not null references bank_account(id) on delete restrict,
  period_start      date not null,
  period_end        date not null,
  starting_balance  numeric(12,2) not null,
  ending_balance    numeric(12,2) not null,
  reconciled        boolean not null default false,
  reconciled_date   date,
  reconciled_by     uuid references member(id),
  notes             text,
  created_at        timestamptz not null default now(),
  check (period_end >= period_start)
);
create index on reconciliation (flotilla_id);

-- Reconciliation previously reached its flotilla only through the bank
-- account, leaving it one join away from the tenancy boundary. It now
-- carries flotilla_id directly, and this keeps the two in agreement.
create or replace function enforce_reconciliation_flotilla() returns trigger
language plpgsql as $$
declare fid uuid;
begin
  select flotilla_id into fid from bank_account where id = new.bank_account_id;
  if fid is distinct from new.flotilla_id then
    raise exception 'Reconciliation flotilla_id must match its bank account flotilla';
  end if;
  return new;
end $$;

create trigger trg_reconciliation_flotilla before insert or update on reconciliation
  for each row execute function enforce_reconciliation_flotilla();

create type journal_entry_type as enum
  ('adjustment_increase', 'adjustment_decrease', 'correction');
create type journal_category as enum
  ('bank_reconciliation', 'error_correction', 'missing_transaction',
   'duplicate_removal', 'other');

create table journal_entry (
  id                      uuid primary key default gen_random_uuid(),
  flotilla_id             uuid not null references flotilla(id) on delete restrict,
  entry_date              date not null,
  entry_type              journal_entry_type not null,
  amount                  numeric(12,2) not null,
  category                journal_category not null default 'other',
  description             text not null,
  notes                   text,
  related_bank_account_id uuid references bank_account(id),
  approved_by             uuid references member(id),
  created_by              uuid references member(id),
  created_at              timestamptz not null default now()
);
create index on journal_entry (flotilla_id);

-- =====================================================================
-- 8. OPERATIONAL RECORDS
-- =====================================================================

create type exam_type   as enum
  ('7012_vsc', '7012a_paddlecraft', '7066_commercial', '7008_pwc', '7003_facility');
create type exam_status as enum ('draft', 'completed', 'sent');

create table vessel_exam (
  id                          uuid primary key default gen_random_uuid(),
  flotilla_id                 uuid not null references flotilla(id) on delete restrict,
  exam_type                   exam_type not null,
  exam_date                   date not null,
  examiner_member_id          uuid not null references member(id),
  examiner_number             text,
  decal_awarded               boolean not null default false,
  owner_operator_name         text,
  owner_email                 citext not null,
  location_county             text,
  location_state              text,
  registration_number         text,
  hin                         text,
  vessel_length               text,
  powered_by                  text,
  area_of_operations          text,
  vessel_type                 text,
  safe_boating_class_attended boolean,
  replaced_decal              text,
  requirements                jsonb not null default '{}'::jsonb,
  recommended_items           jsonb not null default '{}'::jsonb,
  form_data                   jsonb not null default '{}'::jsonb,  -- commercial / pwc / facility
  remarks                     text,
  status                      exam_status not null default 'draft',
  locked                      boolean not null default false,
  sent_date                   timestamptz,
  pdf_url                     text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index on vessel_exam (flotilla_id, exam_date desc);

-- The qualification axis doing real work: holding FSO-VE is neither
-- necessary nor sufficient to sign an exam — a current VE currency is.
create or replace function enforce_examiner_qualified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from member_qualification mq
      join qualification q on q.code = mq.qualification_code
    where mq.member_id = new.examiner_member_id
      and mq.qualification_code = 'VE'
      and mq.active
      and (not q.requires_currency
           or mq.currency_expires_date is null
           or mq.currency_expires_date >= new.exam_date)
  ) then
    raise exception 'Examiner % held no current VE qualification on %',
      new.examiner_member_id, new.exam_date;
  end if;
  return new;
end $$;

create trigger trg_examiner_qualified before insert or update on vessel_exam
  for each row execute function enforce_examiner_qualified();

create table volunteer_activity (
  id                      uuid primary key default gen_random_uuid(),
  member_id               uuid not null references member(id) on delete cascade,
  flotilla_id             uuid not null references flotilla(id) on delete restrict,
  activity_date           date not null,
  start_time              time,
  end_time                time,
  total_hours             numeric(6,2) check (total_hours >= 0),
  activity_mission        text not null,
  activity_code           text,
  mileage                 numeric(8,2),
  non_reimbursed_expenses numeric(10,2),
  notes                   text,
  created_at              timestamptz not null default now()
);
create index on volunteer_activity (member_id, activity_date desc);
create index on volunteer_activity (flotilla_id);

create type notification_type     as enum
  ('budget_alert', 'transaction_approval', 'event_reminder', 'critical_issue');
create type notification_priority as enum ('low', 'medium', 'high', 'critical');

create table notification (
  id                 uuid primary key default gen_random_uuid(),
  member_id          uuid not null references member(id) on delete cascade,
  flotilla_id        uuid references flotilla(id) on delete cascade,
  type               notification_type not null,
  priority           notification_priority not null default 'medium',
  title              text not null,
  message            text not null,
  read               boolean not null default false,
  action_url         text,
  related_entity_id  uuid,
  created_at         timestamptz not null default now()
);
create index on notification (member_id) where not read;

create type report_frequency as enum ('daily', 'weekly', 'monthly', 'quarterly');

create table report_schedule (
  id             uuid primary key default gen_random_uuid(),
  schedule_name  text not null,
  report_type    text not null,
  flotilla_id    uuid references flotilla(id) on delete cascade,
  frequency      report_frequency not null,
  recipients     text[] not null default '{}',
  active         boolean not null default true,
  next_run_date  date,
  last_run_date  date,
  created_at     timestamptz not null default now()
);

create table app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- 9. AUDIT TRAIL
--
-- Written only by triggers. The previous design let the client supply the
-- entity, action, and diff — an audit trail whose contents the audited
-- party controls is weak evidence.
-- =====================================================================

create type audit_action as enum ('create', 'update', 'delete');

create table audit_log (
  id               bigserial primary key,
  entity_type      text not null,
  entity_id        uuid,
  action           audit_action not null,
  changed_by       uuid references member(id),
  changed_by_email text,
  changes          jsonb,
  flotilla_id      uuid,
  occurred_at      timestamptz not null default now()
);
create index on audit_log (entity_type, entity_id);
create index on audit_log (flotilla_id, occurred_at desc);

create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_member uuid := current_member_id();
  v_email  text;
  v_row    jsonb;
  v_flot   uuid;
  v_diff   jsonb;
begin
  select email into v_email from member where id = v_member;
  v_row := to_jsonb(coalesce(new, old));
  if v_row ? 'flotilla_id' then
    v_flot := nullif(v_row ->> 'flotilla_id', '')::uuid;
  end if;

  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      into v_diff
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value;
  else
    v_diff := v_row;
  end if;

  insert into audit_log (entity_type, entity_id, action, changed_by,
                         changed_by_email, changes, flotilla_id)
  values (tg_table_name,
          (v_row ->> 'id')::uuid,
          (case tg_op when 'INSERT' then 'create'
                      when 'UPDATE' then 'update'
                      else 'delete' end)::audit_action,
          v_member, v_email, v_diff, v_flot);

  return coalesce(new, old);
end $$;

create trigger trg_audit_transaction after insert or update or delete on "transaction"
  for each row execute function log_change();
create trigger trg_audit_budget after insert or update or delete on budget
  for each row execute function log_change();
create trigger trg_audit_bank_account after insert or update or delete on bank_account
  for each row execute function log_change();
create trigger trg_audit_journal_entry after insert or update or delete on journal_entry
  for each row execute function log_change();
create trigger trg_audit_office_assignment after insert or update or delete on office_assignment
  for each row execute function log_change();
create trigger trg_audit_member_qualification after insert or update or delete on member_qualification
  for each row execute function log_change();
create trigger trg_audit_flotilla after insert or update or delete on flotilla
  for each row execute function log_change();
create trigger trg_audit_vessel_exam after insert or update or delete on vessel_exam
  for each row execute function log_change();

-- updated_at maintenance
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger trg_touch_transaction before update on "transaction"
  for each row execute function touch_updated_at();
create trigger trg_touch_budget before update on budget
  for each row execute function touch_updated_at();
create trigger trg_touch_flotilla before update on flotilla
  for each row execute function touch_updated_at();
create trigger trg_touch_member before update on member
  for each row execute function touch_updated_at();
create trigger trg_touch_vessel_exam before update on vessel_exam
  for each row execute function touch_updated_at();
create trigger trg_touch_bank_account before update on bank_account
  for each row execute function touch_updated_at();

-- =====================================================================
-- 10. ROW-LEVEL SECURITY
--
-- Every tenant-scoped table answers the same two questions: does this
-- member's role permit the action, and does their assignment reach this
-- flotilla? Division officers pass the second test everywhere.
-- =====================================================================

alter table division              enable row level security;
alter table flotilla              enable row level security;
alter table member                enable row level security;
alter table office_assignment     enable row level security;
alter table qualification         enable row level security;
alter table member_qualification  enable row level security;
alter table committee             enable row level security;
alter table committee_member      enable row level security;
alter table role                  enable row level security;
alter table permission            enable row level security;
alter table role_permission       enable row level security;
alter table bank_account          enable row level security;
alter table payee_vendor          enable row level security;
alter table budget                enable row level security;
alter table budget_line_item      enable row level security;
alter table "transaction"         enable row level security;
alter table reconciliation        enable row level security;
alter table journal_entry         enable row level security;
alter table vessel_exam           enable row level security;
alter table volunteer_activity    enable row level security;
alter table notification          enable row level security;
alter table report_schedule       enable row level security;
alter table app_settings          enable row level security;
alter table audit_log             enable row level security;

-- Reference data: readable by any authenticated member, writable by no one
-- through the API (migrations only).
create policy read_role        on role              for select using (current_member_id() is not null);
create policy read_permission  on permission        for select using (current_member_id() is not null);
create policy read_role_perm   on role_permission   for select using (current_member_id() is not null);
create policy read_qual        on qualification     for select using (current_member_id() is not null);
create policy read_settings    on app_settings      for select using (current_member_id() is not null);
create policy write_settings   on app_settings      for all
  using (is_super_admin()) with check (is_super_admin());

-- Organization
create policy read_division  on division for select using (current_member_id() is not null);
create policy write_division on division for all
  using (has_permission('division','edit')) with check (has_permission('division','edit'));

create policy read_flotilla   on flotilla for select using (current_member_id() is not null);
create policy insert_flotilla on flotilla for insert with check (has_permission('flotilla','create'));
create policy update_flotilla on flotilla for update
  using (has_permission('flotilla','edit') and can_access_flotilla(id))
  with check (has_permission('flotilla','edit') and can_access_flotilla(id));
create policy delete_flotilla on flotilla for delete using (has_permission('flotilla','delete'));

-- Members: always your own record; others require the member:view permission.
create policy read_member on member for select
  using (id = current_member_id() or has_permission('member','view'));
create policy update_own_member on member for update
  using (id = current_member_id()) with check (id = current_member_id());
create policy manage_member on member for all
  using (has_permission('member','edit')) with check (has_permission('member','edit'));

-- Office assignments: visible to self; only assign_roles may change them.
create policy read_office on office_assignment for select
  using (member_id = current_member_id()
         or has_permission('member','view')
         or has_division_role());
create policy write_office on office_assignment for all
  using (has_permission('member','assign_roles')
         and (flotilla_id is null or can_access_flotilla(flotilla_id)))
  with check (has_permission('member','assign_roles')
         and (flotilla_id is null or can_access_flotilla(flotilla_id)));

create policy read_member_qual on member_qualification for select
  using (member_id = current_member_id() or has_permission('member','view'));
create policy write_member_qual on member_qualification for all
  using (has_permission('member','assign_roles'))
  with check (has_permission('member','assign_roles'));

create policy read_committee on committee for select
  using (flotilla_id is null or can_access_flotilla(flotilla_id));
create policy write_committee on committee for all
  using (has_permission('committee','edit')) with check (has_permission('committee','edit'));
create policy read_committee_member on committee_member for select
  using (has_permission('committee','view') or member_id = current_member_id());
create policy write_committee_member on committee_member for all
  using (has_permission('committee','edit')) with check (has_permission('committee','edit'));

-- Financial records: the standard two-condition test.
create policy sel_bank on bank_account for select using (may('bank_account','view',flotilla_id));
create policy ins_bank on bank_account for insert with check (may('bank_account','create',flotilla_id));
create policy upd_bank on bank_account for update
  using (may('bank_account','edit',flotilla_id)) with check (may('bank_account','edit',flotilla_id));
create policy del_bank on bank_account for delete using (may('bank_account','delete',flotilla_id));

create policy sel_budget on budget for select using (may('budget','view',flotilla_id));
create policy ins_budget on budget for insert with check (may('budget','create',flotilla_id));
create policy upd_budget on budget for update
  using (may('budget','edit',flotilla_id)) with check (may('budget','edit',flotilla_id));
create policy del_budget on budget for delete using (may('budget','delete',flotilla_id));

create policy sel_bli on budget_line_item for select
  using (exists (select 1 from budget b where b.id = budget_id and may('budget','view',b.flotilla_id)));
create policy write_bli on budget_line_item for all
  using (exists (select 1 from budget b where b.id = budget_id and may('budget','edit',b.flotilla_id)))
  with check (exists (select 1 from budget b where b.id = budget_id and may('budget','edit',b.flotilla_id)));

create policy sel_txn on "transaction" for select using (may('transaction','view',flotilla_id));
create policy ins_txn on "transaction" for insert with check (may('transaction','create',flotilla_id));
create policy upd_txn on "transaction" for update
  using (may('transaction','edit',flotilla_id)) with check (may('transaction','edit',flotilla_id));
create policy del_txn on "transaction" for delete using (may('transaction','delete',flotilla_id));

create policy sel_recon on reconciliation for select using (may('bank_account','view',flotilla_id));
create policy write_recon on reconciliation for all
  using (may('bank_account','reconcile',flotilla_id))
  with check (may('bank_account','reconcile',flotilla_id));

create policy sel_je on journal_entry for select using (may('journal_entry','view',flotilla_id));
create policy write_je on journal_entry for all
  using (may('journal_entry','edit',flotilla_id))
  with check (may('journal_entry','edit',flotilla_id));

create policy sel_vendor on payee_vendor for select using (has_permission('payee_vendor','view'));
create policy ins_vendor on payee_vendor for insert with check (has_permission('payee_vendor','create'));
create policy upd_vendor on payee_vendor for update
  using (has_permission('payee_vendor','edit')) with check (has_permission('payee_vendor','edit'));
create policy del_vendor on payee_vendor for delete using (has_permission('payee_vendor','delete'));

-- Vessel exams: two distinct questions, answered on two distinct axes.
-- WHO MAY RECORD an exam is a role question, handled here. WHO MAY BE NAMED
-- as the examiner is a qualification question, handled by the trigger above.
-- A Flotilla Commander may therefore enter an exam on behalf of a VE without
-- holding the currency personally, while nobody — not even a Super Admin —
-- can name an examiner whose currency has lapsed.
create policy sel_exam on vessel_exam for select using (may('vessel_exam','view',flotilla_id));
create policy ins_exam on vessel_exam for insert
  with check (may('vessel_exam','create',flotilla_id));
create policy upd_exam on vessel_exam for update
  using (may('vessel_exam','edit',flotilla_id) and not locked)
  with check (may('vessel_exam','edit',flotilla_id));
create policy del_exam on vessel_exam for delete
  using (may('vessel_exam','delete',flotilla_id) and not locked);

-- Volunteer hours: members always manage their own; leadership sees the unit.
create policy sel_vol on volunteer_activity for select
  using (member_id = current_member_id()
         or (has_permission('volunteer_activity','view_all') and can_access_flotilla(flotilla_id)));
create policy own_vol on volunteer_activity for all
  using (member_id = current_member_id()) with check (member_id = current_member_id());

create policy own_notification on notification for all
  using (member_id = current_member_id()) with check (member_id = current_member_id());

create policy sel_rs on report_schedule for select
  using (has_permission('report_schedule','view')
         and (flotilla_id is null or can_access_flotilla(flotilla_id)));
create policy write_rs on report_schedule for all
  using (has_permission('report_schedule','edit')
         and (flotilla_id is null or can_access_flotilla(flotilla_id)))
  with check (has_permission('report_schedule','edit')
         and (flotilla_id is null or can_access_flotilla(flotilla_id)));

-- Audit log is append-only from triggers; readable, never writable by the API.
create policy read_audit on audit_log for select
  using (has_permission('transaction','audit')
         and (flotilla_id is null or can_access_flotilla(flotilla_id)));
