// Role definitions
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  // Division roles
  DIVISION_COMMANDER: 'Division Commander',
  VICE_DIVISION_COMMANDER: 'Vice Division Commander',
  SO_FN: 'SO-FN',
  SO_CM: 'SO-CM',
  SO_CS: 'SO-CS',
  SO_IS: 'SO-IS',
  SO_MA: 'SO-MA',
  SO_MS: 'SO-MS',
  SO_MT: 'SO-MT',
  SO_OP: 'SO-OP',
  SO_PA: 'SO-PA',
  SO_PB: 'SO-PB',
  SO_PE: 'SO-PE',
  SO_SR: 'SO-SR',
  SO_VE: 'SO-VE',
  SO_AS: 'SO-AS',
  SO_DV: 'SO-DV',
  SO_NS: 'SO-NS',
  SO_PV: 'SO-PV',
  SO_SC: 'SO-SC',
  SO_HR: 'SO-HR',
  DIVISION_AUDIT: 'Division Audit Committee',
  // Flotilla roles
  FLOTILLA_COMMANDER: 'Flotilla Commander',
  VICE_FLOTILLA_COMMANDER: 'Vice Flotilla Commander',
  FSO_FN: 'FSO-FN',
  FSO_CM: 'FSO-CM',
  FSO_CS: 'FSO-CS',
  FSO_HR: 'FSO-HR',
  FSO_IS: 'FSO-IS',
  FSO_MA: 'FSO-MA',
  FSO_MS: 'FSO-MS',
  FSO_MT: 'FSO-MT',
  FSO_OP: 'FSO-OP',
  FSO_PA: 'FSO-PA',
  FSO_PB: 'FSO-PB',
  FSO_PE: 'FSO-PE',
  FSO_SR: 'FSO-SR',
  FSO_VE: 'FSO-VE',
  FSO_AS: 'FSO-AS',
  FSO_DV: 'FSO-DV',
  FSO_NS: 'FSO-NS',
  FSO_PV: 'FSO-PV',
  FSO_SC: 'FSO-SC',
  FLOTILLA_AUDIT: 'Flotilla Audit Committee',
  MEMBER: 'Auxiliarist',
  // Immediate Past Commanders hold the sitting officer's full grant set.
  IPDCDR: 'Immediate Past Division Commander',
  IPFC: 'Immediate Past Flotilla Commander'
};

// NOTE: 'Vessel Examiner' was removed. It is a QUALIFICATION, not a role --
// tracked in member_qualification with an expiry date. Page access to Vessel
// Exams comes from the vessel_exam:view permission; the ability to record an
// exam is gated on holding a current VE qualification.


export const DIVISION_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.DIVISION_COMMANDER,
  ROLES.VICE_DIVISION_COMMANDER,
  ROLES.SO_FN,
  ROLES.SO_CM,
  ROLES.SO_CS,
  ROLES.SO_IS,
  ROLES.SO_MA,
  ROLES.SO_MS,
  ROLES.SO_MT,
  ROLES.SO_OP,
  ROLES.SO_PA,
  ROLES.SO_PB,
  ROLES.SO_PE,
  ROLES.SO_SR,
  ROLES.SO_VE,
  ROLES.SO_AS,
  ROLES.SO_DV,
  ROLES.SO_NS,
  ROLES.SO_PV,
  ROLES.SO_SC,
  ROLES.SO_HR,
  ROLES.DIVISION_AUDIT,
  ROLES.IPDCDR
];

export const FLOTILLA_ROLES = [
  ROLES.FLOTILLA_COMMANDER,
  ROLES.VICE_FLOTILLA_COMMANDER,
  ROLES.FSO_FN,
  ROLES.FSO_CM,
  ROLES.FSO_CS,
  ROLES.FSO_HR,
  ROLES.FSO_IS,
  ROLES.FSO_MA,
  ROLES.FSO_MS,
  ROLES.FSO_MT,
  ROLES.FSO_OP,
  ROLES.FSO_PA,
  ROLES.FSO_PB,
  ROLES.FSO_PE,
  ROLES.FSO_SR,
  ROLES.FSO_VE,
  ROLES.FSO_AS,
  ROLES.FSO_DV,
  ROLES.FSO_NS,
  ROLES.FSO_PV,
  ROLES.FSO_SC,
  ROLES.FLOTILLA_AUDIT,
  ROLES.MEMBER,
  ROLES.IPFC
];

export function isDivisionRole(role) {
  return DIVISION_ROLES.includes(role);
}

export function isFlotillaRole(role) {
  return FLOTILLA_ROLES.includes(role);
}

export function isSuperAdmin(roleAssignments) {
  return roleAssignments?.some(r => r.role === ROLES.SUPER_ADMIN);
}

// Page permissions configuration
export const PAGE_PERMISSIONS = {
  Dashboard: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.SO_MS, ROLES.SO_PA, ROLES.SO_PB, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  FlotillaDashboard: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  Transactions: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  Budgets: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  Reports: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  Analytics: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  BankReconciliation: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN]
  },
  AuditCommittee: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  AuditTrail: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  VesselExams: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.SO_VE, ROLES.FSO_VE, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER]
  },
  SuperAdmin: {
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  Import: {
    allowedRoles: [ROLES.SUPER_ADMIN]
  },
  DivisionSettings: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },

  Flotillas: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  UserManagement: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER]
  },
  PayeeVendors: {
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  Search: {
    allowedRoles: Object.values(ROLES)
  },
  VolunteerActivityHours: {
    allowedRoles: Object.values(ROLES)
  },
  VolunteerReports: {
    allowedRoles: Object.values(ROLES)
  },
  UserProfile: {
    allowedRoles: Object.values(ROLES)
  }
};

// Page -> the database permission that governs it. hasPageAccess prefers this
// over the role lists above, so access follows the grants in role_permission
// rather than a hardcoded list that has to be kept in sync by hand.
export const PAGE_REQUIREMENTS = {
  Dashboard:              { entity: 'transaction',        action: 'view' },
  FlotillaDashboard:      { entity: 'transaction',        action: 'view' },
  Transactions:           { entity: 'transaction',        action: 'view' },
  Budgets:                { entity: 'budget',             action: 'view' },
  Reports:                { entity: 'report_schedule',    action: 'view' },
  Analytics:              { entity: 'transaction',        action: 'view' },
  BankReconciliation:     { entity: 'bank_account',       action: 'reconcile' },
  AuditCommittee:         { entity: 'committee',          action: 'view' },
  AuditTrail:             { entity: 'transaction',        action: 'audit' },
  VesselExams:            { entity: 'vessel_exam',        action: 'view' },
  DivisionSettings:       { entity: 'division',           action: 'manage_settings' },
  Flotillas:              { entity: 'flotilla',           action: 'edit' },
  UserManagement:         { entity: 'member',             action: 'edit' },
  RoleManagement:         { entity: 'member',             action: 'assign_roles' },
  PayeeVendors:           { entity: 'payee_vendor',       action: 'view' },
  VolunteerReports:       { entity: 'volunteer_activity', action: 'view_all' },
  // Everyone on the roster may use these; no grant required.
  Search:                 null,
  UserProfile:            null,
  UserSettings:           null,
  VolunteerActivityHours: null,
  Logout:                 null,
};

// Granular entity-level permissions
export const ENTITY_PERMISSIONS = {
  Transaction: {
    view: Object.values(ROLES),
    create: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    delete: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    approve: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER],
    audit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  Budget: {
    view: Object.values(ROLES),
    create: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    delete: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    approve: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  Flotilla: {
    view: Object.values(ROLES),
    create: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER],
    delete: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER],
    manage_settings: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN]
  },
  Division: {
    view: Object.values(ROLES),
    create: [ROLES.SUPER_ADMIN],
    edit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER],
    delete: [ROLES.SUPER_ADMIN],
    manage_settings: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  User: {
    view: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.SO_FN],
    create: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER],
    edit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER],
    delete: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER],
    assign_roles: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER]
  },
  BankAccount: {
    view: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN],
    create: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    delete: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN],
    reconcile: [ROLES.SUPER_ADMIN, ROLES.SO_FN, ROLES.FSO_FN]
  },
  PayeeVendor: {
    view: Object.values(ROLES),
    create: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN],
    delete: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN]
  },
  AuditCommittee: {
    view: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN],
    create: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN],
    delete: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER]
  },
  ReportSchedule: {
    view: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER, ROLES.FSO_FN],
    create: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN],
    edit: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN],
    delete: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER]
  },
  VolunteerActivity: {
    view: Object.values(ROLES),
    create: Object.values(ROLES),
    edit: Object.values(ROLES),
    delete: Object.values(ROLES),
    view_all: [ROLES.SUPER_ADMIN, ROLES.DIVISION_COMMANDER, ROLES.VICE_DIVISION_COMMANDER, ROLES.SO_FN, ROLES.FLOTILLA_COMMANDER, ROLES.VICE_FLOTILLA_COMMANDER]
  }
};

// Helper function to check entity permission
export function hasEntityPermission(userRoles, entityType, action) {
  if (isSuperAdmin(userRoles)) return true;
  
  const entityPerms = ENTITY_PERMISSIONS[entityType];
  if (!entityPerms) return true;
  
  const allowedRoles = entityPerms[action];
  if (!allowedRoles) return false;
  
  return userRoles.some(r => allowedRoles.includes(r.role));
}

// User management permissions
export function canManageUser(managerRoles, targetUser) {
  // Super Admin can manage anyone
  if (isSuperAdmin(managerRoles)) return true;
  
  const targetRoles = targetUser.role_assignments || [];
  
  // Can't manage Super Admins (only Super Admin can)
  if (isSuperAdmin(targetRoles)) return false;
  
  // Division Commanders and Vice Division Commanders can manage division staff and flotilla commanders
  const isDivisionLeader = managerRoles.some(r => 
    (r.role === ROLES.DIVISION_COMMANDER || r.role === ROLES.VICE_DIVISION_COMMANDER) && !r.flotilla_id
  );
  
  if (isDivisionLeader) {
    // Can manage division staff (SO- roles) and flotilla commanders/vice commanders
    // Also allow managing new users with no roles yet
    if (targetRoles.length === 0) return true;
    const canManage = targetRoles.every(tr => {
      const isDivisionStaff = DIVISION_ROLES.includes(tr.role) && !tr.flotilla_id && tr.role !== ROLES.SUPER_ADMIN;
      const isFlotillaLeader = tr.role === ROLES.FLOTILLA_COMMANDER || tr.role === ROLES.VICE_FLOTILLA_COMMANDER;
      return isDivisionStaff || isFlotillaLeader;
    });
    if (canManage) return true;
  }
  
  // Flotilla Commanders and Vice Flotilla Commanders can manage their flotilla staff
  const managerFlotillaIds = managerRoles
    .filter(r => r.role === ROLES.FLOTILLA_COMMANDER || r.role === ROLES.VICE_FLOTILLA_COMMANDER)
    .map(r => r.flotilla_id)
    .filter(Boolean);
  
  if (managerFlotillaIds.length > 0) {
    // Can manage flotilla staff in their own flotillas (excluding commanders)
    // Also allow managing new users with no roles yet
    if (targetRoles.length === 0) return true;
    const canManage = targetRoles.every(tr => {
      const isFlotillaStaff = FLOTILLA_ROLES.includes(tr.role) && 
                             managerFlotillaIds.includes(tr.flotilla_id) &&
                             tr.role !== ROLES.FLOTILLA_COMMANDER &&
                             tr.role !== ROLES.VICE_FLOTILLA_COMMANDER;
      return isFlotillaStaff;
    });
    if (canManage) return true;
  }
  
  return false;
}

// Financial permissions - only Super Admin, SO-FN, and FSO-FN
export function canManageFinancials(userRoles) {
  return isSuperAdmin(userRoles) || 
         userRoles.some(r => r.role === ROLES.SO_FN || r.role === ROLES.FSO_FN);
}

// Helper function to check if user can access flotilla data
export function canAccessFlotilla(userRoles, flotillaId) {
  // Super admin and division roles can access all flotillas
  const hasDivisionAccess = userRoles.some(r => 
    isDivisionRole(r.role) && !r.flotilla_id
  );
  
  if (hasDivisionAccess) return true;
  
  // Check if user has a role in this specific flotilla
  return userRoles.some(r => r.flotilla_id === flotillaId);
}
