import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileEdit, Search, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogViewer({ logs, flotillas, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.changed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changed_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesEntity && matchesAction;
  });

  const getActionBadge = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800 border-green-300',
      update: 'bg-blue-100 text-blue-800 border-blue-300',
      delete: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[action] || 'bg-slate-100 text-slate-800';
  };

  const renderChangeDetails = (changes) => {
    if (!changes || typeof changes !== 'object') return null;

    return (
      <div className="mt-3 space-y-2">
        {Object.entries(changes).map(([field, change]) => {
          if (typeof change === 'object' && change !== null && 'from' in change && 'to' in change) {
            return (
              <div key={field} className="bg-slate-50 rounded p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">{field}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-600 font-medium">From: </span>
                    <span className="text-slate-700">
                      {change.from === null || change.from === '' ? '(empty)' : 
                       typeof change.from === 'object' ? JSON.stringify(change.from) : String(change.from)}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">To: </span>
                    <span className="text-slate-700">
                      {change.to === null || change.to === '' ? '(empty)' : 
                       typeof change.to === 'object' ? JSON.stringify(change.to) : String(change.to)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by user or entity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Entity Type</label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Transaction">Transaction</SelectItem>
                  <SelectItem value="Budget">Budget</SelectItem>
                  <SelectItem value="Flotilla">Flotilla</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="BankAccount">Bank Account</SelectItem>
                  <SelectItem value="ReportSchedule">Report Schedule</SelectItem>
                  <SelectItem value="Division">Division</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Audit Trail ({filteredLogs.length} entries)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const flotilla = flotillas?.find(f => f.id === log.flotilla_id);
                const isExpanded = expandedLog === log.id;

                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={getActionBadge(log.action)}>
                            {log.action.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {log.entity_type}
                          </Badge>
                          {flotilla && (
                            <Badge variant="secondary">
                              {flotilla.flotilla_number}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{log.changed_by_name || log.changed_by}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>

                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Entity ID: </span>
                          <code className="bg-slate-100 px-2 py-1 rounded text-xs">{log.entity_id}</code>
                        </div>

                        {log.ip_address && (
                          <div className="text-xs text-slate-500">
                            IP: {log.ip_address}
                          </div>
                        )}

                        {isExpanded && log.changes && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-2">Changes:</p>
                            {renderChangeDetails(log.changes)}
                          </div>
                        )}
                      </div>

                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="flex-shrink-0"
                        >
                          <FileEdit className="w-4 h-4 mr-2" />
                          {isExpanded ? 'Hide' : 'Show'} Changes
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}