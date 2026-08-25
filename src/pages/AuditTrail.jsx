import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { RequireAuth } from "../components/auth/AccessControl";
import AuditLogViewer from "../components/audit/AuditLogViewer";

export default function AuditTrailPage() {
  return (
    <RequireAuth pageName="AuditTrail">
      <AuditTrailContent />
    </RequireAuth>
  );
}

function AuditTrailContent() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500),
  });

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
  });

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Audit Trail</h1>
              <p className="text-slate-600 mt-1">
                Complete history of all changes made in the system
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <p className="text-sm text-blue-700 mb-1">Total Entries</p>
              <p className="text-3xl font-bold text-blue-900">{logs.length}</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <p className="text-sm text-green-700 mb-1">Created</p>
              <p className="text-3xl font-bold text-green-900">
                {logs.filter(l => l.action === 'create').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <p className="text-sm text-amber-700 mb-1">Updated</p>
              <p className="text-3xl font-bold text-amber-900">
                {logs.filter(l => l.action === 'update').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <p className="text-sm text-red-700 mb-1">Deleted</p>
              <p className="text-3xl font-bold text-red-900">
                {logs.filter(l => l.action === 'delete').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Viewer */}
        <AuditLogViewer logs={logs} flotillas={flotillas} isLoading={isLoading} />
      </div>
    </div>
  );
}