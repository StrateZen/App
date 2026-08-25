import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { PAGE_PERMISSIONS, ENTITY_PERMISSIONS, isDivisionRole, isFlotillaRole, hasEntityPermission, canAccessFlotilla as canAccessFlotillaHelper, canManageUser, canManageFinancials } from "./RoleConfig";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log("AccessControl - User loaded:", currentUser);
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
      console.log("getUserRoles - No user");
      return [];
    }
    
    console.log("getUserRoles - User:", user);
    
    // Support new role_assignments
    if (user.role_assignments && Array.isArray(user.role_assignments) && user.role_assignments.length > 0) {
      console.log("getUserRoles - Using role_assignments:", user.role_assignments);
      return user.role_assignments;
    }
    
    // Legacy fallback for users not yet migrated to role system
    if (user.access_level === 'super_admin') {
      console.log("getUserRoles - Legacy super_admin");
      return [{ role: 'Super Admin', flotilla_id: null }];
    }
    if (user.access_level === 'division_staff') {
      console.log("getUserRoles - Legacy division_staff");
      return [{ role: 'SO-FN', flotilla_id: null }];
    }
    if (user.access_level === 'flotilla_staff' && user.flotilla_ids) {
      console.log("getUserRoles - Legacy flotilla_staff");
      return user.flotilla_ids.map(fid => ({ role: 'FSO-FN', flotilla_id: fid }));
    }
    
    // Default fallback - give basic member access
    console.log("getUserRoles - Default fallback to Auxiliarist");
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

  const canAccessPage = (pageName) => {
    if (!user) return false;
    const pagePerms = PAGE_PERMISSIONS[pageName];
    if (!pagePerms) return true; // No restrictions
    
    const roles = getUserRoles();
    return roles.some(r => pagePerms.allowedRoles.includes(r.role));
  };

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

  console.log("RequireAuth - loading:", loading, "user:", user, "pageName:", pageName);

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
    console.log("RequireAuth - No user, returning null");
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
    console.log("RequireAuth - Access denied for page:", pageName);
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

  console.log("RequireAuth - Rendering children");
  return <>{children}</>;
}

// New role-based access check
export function hasPageAccess(user, pageName) {
  if (!user) return false;
  const pagePerms = PAGE_PERMISSIONS[pageName];
  if (!pagePerms) return true;
  
  const roles = user.role_assignments || [];
  return roles.some(r => pagePerms.allowedRoles.includes(r.role));
}