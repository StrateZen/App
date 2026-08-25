/**
 * base44 SDK compatibility layer, backed by Supabase.
 *
 * The 46 files in src/ were written against base44's SDK. Rather than rewrite
 * all of them, this module reproduces the exact surface they call:
 *
 *   base44.entities.<Name>.list(sort?, limit?)
 *   base44.entities.<Name>.filter(criteria, sort?, limit?)
 *   base44.entities.<Name>.create(data) / .update(id, data) / .delete(id)
 *   base44.entities.<Name>.bulkCreate(rows)
 *   base44.auth.me() / .logout() / .redirectToLogin() / .updateMe(data)
 *   base44.functions.invoke(name, payload)
 *
 * Two translations happen here:
 *   1. PascalCase entity names -> snake_case Postgres tables.
 *   2. base44's created_date/updated_date -> Postgres created_at/updated_at.
 *      Rows are echoed back with the old field names too, so existing
 *      components keep rendering without edits.
 */

import { supabase } from './supabaseClient';

// ---------------------------------------------------------------------------
// Entity -> table
// ---------------------------------------------------------------------------
const TABLES = {
  AppSettings:       'app_settings',
  AuditCommittee:    'committee',
  AuditLog:          'audit_log',
  BankAccount:       'bank_account',
  Budget:            'budget',
  Division:          'division',
  Flotilla:          'flotilla',
  JournalEntry:      'journal_entry',
  Notification:      'notification',
  PayeeVendor:       'payee_vendor',
  Reconciliation:    'reconciliation',
  ReportSchedule:    'report_schedule',
  Transaction:       'transaction',
  User:              'member',
  VesselExam:        'vessel_exam',
  VolunteerActivity: 'volunteer_activity',
};

// base44 named these *_date; Postgres has them as *_at.
const FIELD_ALIASES = { created_date: 'created_at', updated_date: 'updated_at' };

// Per-entity column renames where the rebuilt schema chose a different name.
// Notifications belong to a member, not a "user".
const ENTITY_FIELD_ALIASES = {
  // Notifications belong to a member, not a "user".
  Notification: { user_id: 'member_id' },
  // audit_log has no created_at; the event time is occurred_at.
  AuditLog: { created_date: 'occurred_at', created_at: 'occurred_at' },
  // volunteer_activity uses activity_date, not a bare "date".
  VolunteerActivity: { date: 'activity_date' },
};

const toColumn = (field, entity) =>
  (entity && ENTITY_FIELD_ALIASES[entity]?.[field]) || FIELD_ALIASES[field] || field;

// Some entities need a join to reproduce a field the UI expects.
const ENTITY_SELECT = {
  // The UI compares created_by against the signed-in email, but the table
  // stores member_id. Pull the member's email alongside the row.
  VolunteerActivity: '*, member:member_id(email)',
};

// Read-side shaping: present rebuilt columns under the names the UI reads.
// Without this the pages render blanks rather than failing loudly.
const ENTITY_READ_TRANSFORMS = {
  AuditLog: (row) => ({
    ...row,
    created_date: row.occurred_at,
    created_at: row.occurred_at,
    // The rebuilt schema records the actor's email, not a display name, and
    // deliberately does not store IP addresses.
    changed_by_name: row.changed_by_email ?? row.changed_by,
    ip_address: undefined,
  }),
  VolunteerActivity: (row) => ({
    ...row,
    created_by: row.member?.email,
    date: row.activity_date,
  }),
};

/** Echo created_at/updated_at back under their old names so views don't break. */
const withLegacyFields = (row) => {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  if ('created_at' in row) out.created_date = row.created_at;
  if ('updated_at' in row) out.updated_date = row.updated_at;
  return out;
};

const shapeRow = (row, entity) => {
  const base = withLegacyFields(row);
  const transform = entity && ENTITY_READ_TRANSFORMS[entity];
  return transform && base ? transform(base) : base;
};

const decorate = (data, entity) =>
  Array.isArray(data) ? data.map((r) => shapeRow(r, entity))
                      : shapeRow(data, entity);

/** Strip legacy aliases before writing, so Postgres never sees created_date. */
const stripLegacyFields = (data) => {
  const { created_date, updated_date, ...rest } = data || {};
  return rest;
};

/** base44 sort strings: 'name' ascending, '-created_date' descending. */
const applySort = (query, sort, entity) => {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = toColumn(desc ? sort.slice(1) : sort, entity);
  return query.order(column, { ascending: !desc, nullsFirst: false });
};

const raise = (error, entity, op) => {
  if (error) throw new Error(`${entity}.${op} failed: ${error.message}`);
};

function makeEntity(name) {
  const table = TABLES[name];

  return {
    async list(sort, limit) {
      let q = supabase.from(table).select(ENTITY_SELECT[name] ?? '*');
      q = applySort(q, sort, name);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      raise(error, name, 'list');
      return decorate(data ?? [], name);
    },

    async filter(criteria = {}, sort, limit) {
      let q = supabase.from(table).select(ENTITY_SELECT[name] ?? '*');
      for (const [key, value] of Object.entries(criteria)) {
        const column = toColumn(key, name);
        // An array means "any of these", matching base44's behaviour.
        q = Array.isArray(value) ? q.in(column, value) : q.eq(column, value);
      }
      q = applySort(q, sort, name);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      raise(error, name, 'filter');
      return decorate(data ?? [], name);
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table).select('*').eq('id', id).single();
      raise(error, name, 'get');
      return decorate(data, name);
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table).insert(stripLegacyFields(payload)).select().single();
      raise(error, name, 'create');
      return decorate(data, name);
    },

    async bulkCreate(rows = []) {
      if (!rows.length) return [];
      const { data, error } = await supabase
        .from(table).insert(rows.map(stripLegacyFields)).select();
      raise(error, name, 'bulkCreate');
      return decorate(data ?? [], name);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table).update(stripLegacyFields(payload)).eq('id', id).select().single();
      raise(error, name, 'update');
      return decorate(data, name);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      raise(error, name, 'delete');
      return { id };
    },
  };
}

const entities = Object.fromEntries(
  Object.keys(TABLES).map((n) => [n, makeEntity(n)])
);

// ---------------------------------------------------------------------------
// AppSettings shape adapter.
//
// base44 stored feature flags as flat columns on a row identified by
// setting_key. The rebuilt table is key/value: (key text, value jsonb).
// The UI still speaks the old shape, so translate in both directions rather
// than rewrite every consumer.
// ---------------------------------------------------------------------------
entities.AppSettings = {
  async filter(criteria = {}) {
    const key = criteria.setting_key ?? criteria.key ?? 'feature_flags';
    const { data, error } = await supabase
      .from('app_settings').select('*').eq('key', key).maybeSingle();

    // A missing settings row is normal on a fresh install, not an error.
    if (error && error.code !== 'PGRST116') {
      throw new Error(`AppSettings.filter failed: ${error.message}`);
    }
    if (!data) return [];

    // Flatten value{} up to the top level, which is where the UI looks.
    return [{ id: data.key, setting_key: data.key, ...(data.value ?? {}),
              updated_date: data.updated_at }];
  },

  async list() {
    return entities.AppSettings.filter({});
  },

  async create(payload = {}) {
    const { setting_key = 'feature_flags', id, ...flags } = payload;
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ key: setting_key, value: flags, updated_at: new Date().toISOString() })
      .select().single();
    if (error) throw new Error(`AppSettings.create failed: ${error.message}`);
    return { id: data.key, setting_key: data.key, ...(data.value ?? {}) };
  },

  // id here is the settings key, since that is what filter() handed back.
  async update(id, payload = {}) {
    const { setting_key, id: _ignored, ...flags } = payload;
    const key = setting_key ?? id ?? 'feature_flags';

    const { data: existing } = await supabase
      .from('app_settings').select('value').eq('key', key).maybeSingle();

    // Merge so updating one flag does not silently drop the others.
    const merged = { ...(existing?.value ?? {}), ...flags };

    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ key, value: merged, updated_at: new Date().toISOString() })
      .select().single();
    if (error) throw new Error(`AppSettings.update failed: ${error.message}`);
    return { id: data.key, setting_key: data.key, ...(data.value ?? {}) };
  },

  async delete(id) {
    const { error } = await supabase.from('app_settings').delete().eq('key', id);
    if (error) throw new Error(`AppSettings.delete failed: ${error.message}`);
    return { id };
  },
};

// `Query` was a base44 escape hatch. Nothing in src/ calls it; it is exported
// only so imports resolve. Any real use should become a Postgres view.
entities.Query = {
  async list() {
    throw new Error('Query is not supported on Supabase. Use a database view instead.');
  },
};

// ---------------------------------------------------------------------------
// Auth — magic link, replacing base44's hosted login
// ---------------------------------------------------------------------------
const auth = {
  /**
   * Returns the signed-in member, enriched with the role assignments and
   * qualifications the UI expects. Returns null when signed out so callers
   * can redirect rather than crash.
   */
  async me() {
    const { data: { user } = {}, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: member } = await supabase
      .from('member').select('*').eq('auth_user_id', user.id).maybeSingle();

    if (!member) {
      // Authenticated but not on the roster. Surfaced explicitly so the UI can
      // show "not registered" instead of an empty, broken dashboard.
      return {
        id: null, email: user.email, unregistered: true,
        role_assignments: [], qualifications: [],
      };
    }

    const [{ data: offices }, { data: quals }] = await Promise.all([
      supabase.from('office_assignment')
        .select('role_code, flotilla_id').eq('member_id', member.id),
      supabase.from('member_qualification')
        .select('qualification_code, currency_expires_date, active')
        .eq('member_id', member.id),
    ]);

    return {
      ...withLegacyFields(member),
      role_assignments: (offices ?? []).map((o) => ({
        role: o.role_code, flotilla_id: o.flotilla_id,
      })),
      qualifications: quals ?? [],
    };
  },

  async login(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/Dashboard` },
    });
    if (error) throw new Error(`Sign-in failed: ${error.message}`);
    return { sent: true };
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  },

  redirectToLogin() {
    window.location.href = '/login';
  },

  /** Self-service profile edits only. Role changes go through office_assignment. */
  async updateMe(payload) {
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');
    const { data, error } = await supabase
      .from('member').update(stripLegacyFields(payload))
      .eq('auth_user_id', user.id).select().single();
    raise(error, 'User', 'updateMe');
    return decorate(data);
  },

  // UserManagement.jsx calls User.list() and User.update() against members.
  list: (sort, limit) => entities.User.list(sort, limit),
  update: (id, payload) => entities.User.update(id, payload),
  filter: (criteria, sort, limit) => entities.User.filter(criteria, sort, limit),
};

// ---------------------------------------------------------------------------
// Backend functions -> Supabase Edge Functions
// ---------------------------------------------------------------------------
const functions = {
  async invoke(name, payload = {}) {
    const { data, error } = await supabase.functions.invoke(name, { body: payload });
    if (error) throw new Error(`Function ${name} failed: ${error.message}`);
    // base44 returned { data }; callers read response.data.
    return { data };
  },
};

// ---------------------------------------------------------------------------
// Integrations. Only UploadFile is actually used. The rest throw rather than
// silently returning undefined and corrupting downstream state.
// ---------------------------------------------------------------------------
const notImplemented = (label) => async () => {
  throw new Error(`${label} was a base44 integration and has no Supabase equivalent yet.`);
};

const Core = {
  async UploadFile({ file }) {
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return { file_url: data.publicUrl };
  },
  InvokeLLM: notImplemented('InvokeLLM'),
  SendEmail: notImplemented('SendEmail'),
  SendSMS: notImplemented('SendSMS'),
  GenerateImage: notImplemented('GenerateImage'),
  ExtractDataFromUploadedFile: notImplemented('ExtractDataFromUploadedFile'),
};

export const base44 = { entities, auth, functions, integrations: { Core } };
export default base44;
