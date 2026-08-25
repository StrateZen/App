import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft, Loader2 } from "lucide-react";
import { useAppSettings } from "./useAppSettings";

const FEATURES = [
  { key: "vessel_exams",       label: "Vessel Exams",          description: "VSC / paddlecraft exam management" },
  { key: "transactions",       label: "Financial Entry",        description: "Transaction recording and management" },
  { key: "budgets",            label: "Budget Planning",        description: "Budget creation and tracking" },
  { key: "bank_reconciliation",label: "Bank Reconciliation",    description: "Bank account reconciliation" },
  { key: "reports",            label: "Reports Center",         description: "Financial and operational reports" },
  { key: "analytics",          label: "Analytics",              description: "Charts and data analytics" },
  { key: "audit",              label: "Audit",                  description: "Audit committee & audit trail" },
  { key: "volunteer",          label: "Volunteer Hours",        description: "Volunteer activity tracking & reports" },
  { key: "flotillas",          label: "Flotilla Management",    description: "Flotilla profiles and settings" },
  { key: "division_settings",  label: "Division Settings",      description: "Division-level configuration" },
  { key: "user_management",    label: "User Management",        description: "User accounts and role management" },
  { key: "payee_vendors",      label: "Payee / Vendor Mgmt",    description: "Manage vendors and payees" },
];

export default function FeatureFlagsPanel() {
  const { settings, isLoading, updateSettings, isSaving } = useAppSettings();

  const toggle = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const enabledCount = FEATURES.filter(f => settings[f.key]).length;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ToggleLeft className="w-5 h-5" />
            App Section Controls
          </CardTitle>
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
            <Badge className="bg-blue-100 text-blue-700">{enabledCount}/{FEATURES.length} enabled</Badge>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1">Toggle entire sections on or off across the application.</p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="divide-y">
            {FEATURES.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">{feature.label}</p>
                  <p className="text-sm text-slate-500">{feature.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={settings[feature.key] ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                    {settings[feature.key] ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={!!settings[feature.key]}
                    onCheckedChange={() => toggle(feature.key)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}