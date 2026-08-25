import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const DEFAULT_FLAGS = {
  vessel_exams: true,
  audit: true,
  bank_reconciliation: true,
  budgets: true,
  reports: true,
  volunteer: true,
  analytics: true,
  transactions: true,
  user_management: true,
  division_settings: true,
  flotillas: true,
  payee_vendors: true,
};

export function useAppSettings() {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => base44.entities.AppSettings.filter({ setting_key: "feature_flags" }),
    staleTime: 30000,
  });

  const record = records[0];
  const settings = record ? { ...DEFAULT_FLAGS, ...record } : { ...DEFAULT_FLAGS };

  const updateMutation = useMutation({
    mutationFn: async (newFlags) => {
      if (record) {
        return base44.entities.AppSettings.update(record.id, newFlags);
      } else {
        return base44.entities.AppSettings.create({ setting_key: "feature_flags", ...newFlags });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["app-settings"] }),
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isSaving: updateMutation.isPending,
  };
}