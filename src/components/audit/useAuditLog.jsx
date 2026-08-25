import { base44 } from "@/api/base44Client";

/**
 * Hook to log audit entries
 * Usage: 
 * const logAudit = useAuditLog();
 * await logAudit('Transaction', transactionId, 'update', changes, flotillaId);
 */
export function useAuditLog() {
  const logAudit = async (entityType, entityId, action, changes = {}, flotillaId = null) => {
    try {
      await base44.functions.invoke('logAuditEntry', {
        entity_type: entityType,
        entity_id: entityId,
        action,
        changes,
        flotilla_id: flotillaId
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error - audit logging should not break the main flow
    }
  };

  return logAudit;
}

/**
 * Helper function to capture changes between old and new data
 */
export function captureChanges(oldData, newData, fieldsToTrack = null) {
  const changes = {};
  
  // If specific fields are provided, only track those
  const fields = fieldsToTrack || Object.keys(newData);
  
  fields.forEach(field => {
    const oldValue = oldData?.[field];
    const newValue = newData[field];
    
    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return;
    }
    
    // Skip system fields
    if (['id', 'created_date', 'updated_date', 'created_by'].includes(field)) {
      return;
    }
    
    changes[field] = {
      from: oldValue,
      to: newValue
    };
  });
  
  return changes;
}