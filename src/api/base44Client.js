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

const toColumn = (field) => FIELD_ALIASES[field] || field;

/** Echo created_at/updated_at back under their old names so views don't break. */
const withLegacyFields = (row) => {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  if ('created_at' in row) out.created_date = row.created_at;
  if ('updated_at' in row) out.updated_date = row.updated_at;
  return out;
};

const decorate = (data) =>
  Array.isArray(data) ? data.map(withLegacyFields) : withLegacyFields(data);

/** Strip legacy aliases before writing, so Postgres never sees created_date. */
const stripLegacyFields = (data) => {
  const { created_date, updated_date, ...rest } = data || {};
  return rest;
};

/** base44 sort strings: 'name' ascending, '-created_date' descending. */
const applySort = (query, sort) => {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = toColumn(desc ? sort.slice(1) : sort);
  return query.order(column, { ascending: !desc, nullsFirst: false });
};

const raise = (error, entity, op) => {
  if (error) throw new Error(`${entity}.${op} failed: ${error.message}`);
};

function makeEntity(name) {
  const table = TABLES[name];

  return {
    async list(sort, limit) {
      let q = supabase.from(table).select('*');
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      raise(error, name, 'list');
      return decorate(data ?? []);
    },

    async filter(criteria = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        const column = toColumn(key);
        // An array means "any of these", matching base44's behaviour.
        q = Array.isArray(value) ? q.in(column, value) : q.eq(column, value);
      }
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      raise(error, name, 'filter');
      return decorate(data ?? []);
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table).select('*').eq('id', id).single();
      raise(error, name, 'get');
      return decorate(data);
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table).insert(stripLegacyFields(payload)).select().single();
      raise(error, name, 'create');
      return decorate(data);
    },

    async bulkCreate(rows = []) {
      if (!rows.length) return [];
      const { data, error } = await supabase
        .from(table).insert(rows.map(stripLegacyFields)).select();
      raise(error, name, 'bulkCreate');
      return decorate(data ?? []);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table).update(stripLegacyFields(payload)).eq('id', id).select().single();
      raise(error, name, 'update');
      return decorate(data);
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
