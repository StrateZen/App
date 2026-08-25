import React from "react";
import { useRolePermissions } from "./AccessControl";
import { AlertCircle } from "lucide-react";

/**
 * Component-level permission guard
 * Wraps components that require specific permissions
 */
export function PermissionGuard({ 
  entityType, 
  action, 
  children, 
  fallback = null,
  showMessage = true 
}) {
  const { canPerformAction } = useRolePermissions();
  const hasPermission = canPerformAction(entityType, action);

  if (!hasPermission) {
    if (fallback) return fallback;
    
    if (showMessage) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-800 font-medium">
            You don't have permission to {action} {entityType.toLowerCase()}s.
          </p>
        </div>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook for conditional rendering based on permissions
 */
export function usePermission(entityType, action) {
  const { canPerformAction } = useRolePermissions();
  return canPerformAction(entityType, action);
}

/**
 * HOC for protecting entire components
 */
export function withPermission(entityType, action) {
  return function(Component) {
    return function PermissionWrappedComponent(props) {
      return (
        <PermissionGuard entityType={entityType} action={action}>
          <Component {...props} />
        </PermissionGuard>
      );
    };
  };
}