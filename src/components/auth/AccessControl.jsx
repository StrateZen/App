import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { PAGE_PERMISSIONS, PAGE_REQUIREMENTS, ENTITY_PERMISSIONS, isDivisionRole, isFlotillaRole, hasEntityPermission, canAccessFlotilla as canAccessFlotillaHelper, canManageUser, canManageFinancials } from "./RoleConfig";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Not authenticated", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading };
}

// New role-based permissions system
export function useRolePermissions() {
  const { user, loading } = useAuth();

  const getUserRoles = () => {
    if (!user) {
      return [];
    }
    
    // Support new role_assignments
    if (user.role_assignments && Array.isArray(user.role_assignments) && user.role_assignments.length > 0) {
      return user.role_assignments;
    }
    
    // Legacy fallback for users not yet migrated to role system
    if (user.access_level === 'super_admin') {
      return [{ role: 'Super Admin', flotilla_id: null }];
    }
    if (user.access_level === 'division_staff') {
      return [{ role: 'SO-FN', flotilla_id: null }];
    }
    if (user.access_level === 'flotilla_staff' && user.flotilla_ids) {
      return user.flotilla_ids.map(fid => ({ role: 'FSO-FN', flotilla_id: fid }));
    }
    
    // Default fallback - give basic member access
    return [{ role: 'Auxiliarist', flotilla_id: null }];
  };

  const hasRole = (roleNames) => {
    const roles = getUserRoles();
    const roleArray = Array.isArray(roleNames) ? roleNames : [roleNames];
    return roles.some(r => roleArray.includes(r.role));
  };

  const hasDivisionRole = () => {
    const roles = getUserRoles();
    return roles.some(r => isDivisionRole(r.role) && !r.flotilla_id);
  };

  const getUserFlotillaIds = () => {
    const roles = getUserRoles();
    const flotillaIds = roles
      .filter(r => r.flotilla_id)
      .map(r => r.flotilla_id);
    return [...new Set(flotillaIds)];
  };

  const canAccessFlotilla = (flotillaId) => {
    if (!user) return false;
    if (hasDivisionRole()) return true;
    const userFlotillaIds = getUserFlotillaIds();
    return userFlotillaIds.includes(flotillaId);
  };

  // Delegates to hasPageAccess so the sidebar and the page guard cannot
  // disagree. They previously held separate copies of this logic, which meant
  // the nav could offer a link that the page then refused -- the exact drift
  // the database-driven permission model exists to prevent.
  const canAccessPage = (pageName) => hasPageAccess(user, pageName);

  const canWriteComponent = () => true;

  const canReadComponent = () => true;

  const canPerformAction = (entityType, action) => {
    if (!user) return false;
    const roles = getUserRoles();
    return hasEntityPermission(roles, entityType, action);
  };

  const canAccessFlotillaData = (flotillaId) => {
    if (!user) return false;
    const roles = getUserRoles();
    return canAccessFlotillaHelper(roles, flotillaId);
  };

  return {
    user,
    loading,
    getUserRoles,
    hasRole,
    hasDivisionRole,
    getUserFlotillaIds,
    canAccessFlotilla,
    canAccessPage,
    canWriteComponent,
    canReadComponent,
    canPerformAction,
    canAccessFlotillaData
  };
}

// Legacy support - will be deprecated
export function useFlotillaFilter() {
  const { user, loading, hasDivisionRole, getUserFlotillaIds, canAccessFlotilla } = useRolePermissions();

  const filterByFlotilla = (items, flotillaIdField = 'flotilla_id') => {
    if (loading || !user) return items;
    if (hasDivisionRole()) return items;
    
    const userFlotillaIds = getUserFlotillaIds();
    return items.filter(item => userFlotillaIds.includes(item[flotillaIdField]));
  };

  return { filterByFlotilla, canAccessFlotilla, user, loading };
}

export function RequireAuth({ children, pageName }) {
  const { user, loading, canAccessPage } = useRolePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // New role-based check
  if (pageName && !canAccessPage(pageName)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">
              You don't have the required role to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

// New role-based access check
/**
 * Page access, resolved against the database wherever possible.
 *
 * Order of precedence:
 *   1. Super Admin passes everything.
 *   2. If the page maps to a real permission (entity:action), test the grants
 *      that came back from the database with the session. This is the path
 *      that keeps the UI in step with role_permission automatically.
 *   3. Otherwise fall back to the legacy hardcoded role list, so pages that
 *      have not been mapped yet keep working.
 */
export function hasPageAccess(user, pageName) {
  if (!user) return false;
  if (user.is_super_admin) return true;

  // An explicit null means "open to anyone on the roster".
  if (pageName in PAGE_REQUIREMENTS) {
    const req = PAGE_REQUIREMENTS[pageName];
    if (req === null) return true;
    if (req && Array.isArray(user.permissions)) {
      return user.permissions.includes(`${req.entity}:${req.action}`);
    }
  }

  const pagePerms = PAGE_PERMISSIONS[pageName];
  if (!pagePerms) return true;

  const roles = user.role_assignments || [];
  return roles.some(r => pagePerms.allowedRoles.includes(r.role));
}

/**
 * Whether the member may perform a qualification-gated action, e.g. recording
 * a vessel exam. Mirrors the database gate in qualification_permission, so the
 * button is hidden for the same reason the insert would be refused.
 */
export function hasQualification(user, code) {
  if (!user) return false;
  return (user.current_qualifications || []).includes(code);
}
