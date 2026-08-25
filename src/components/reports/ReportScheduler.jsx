import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function ReportScheduler({ flotillas, user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => base44.entities.ReportSchedule.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      setShowDialog(false);
      setEditingSchedule(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReportSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      setShowDialog(false);
      setEditingSchedule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportSchedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      schedule_name: formData.get('schedule_name'),
      report_type: formData.get('report_type'),
      flotilla_id: formData.get('flotilla_id') || null,
      frequency: formData.get('frequency'),
      recipients: formData.get('recipients').split(',').map(r => r.trim()).filter(Boolean),
      active: editingSchedule ? editingSchedule.active : true,
      next_run_date: calculateNextRunDate(formData.get('frequency'))
    };

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const calculateNextRunDate = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  const handleToggleActive = async (schedule) => {
    await updateMutation.mutateAsync({
      id: schedule.id,
      data: { ...schedule, active: !schedule.active }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-5 h-5" />
              Automated Report Scheduling
            </CardTitle>
            <Button onClick={() => { setEditingSchedule(null); setShowDialog(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              New Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No scheduled reports yet</p>
              <Button onClick={() => setShowDialog(true)} variant="outline">
                Create Your First Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map(schedule => {
                const flotilla = flotillas.find(f => f.id === schedule.flotilla_id);
                return (
                  <div key={schedule.id} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{schedule.schedule_name}</h4>
                          <Badge variant={schedule.active ? "default" : "secondary"}>
                            {schedule.active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p>
                            <span className="font-medium">Report:</span> {schedule.report_type}
                          </p>
                          {flotilla && (
                            <p>
                              <span className="font-medium">Flotilla:</span> {flotilla.flotilla_number}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Frequency:</span> {schedule.frequency}
                          </p>
                          <p>
                            <span className="font-medium">Next Run:</span> {schedule.next_run_date}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">Recipients:</span> {schedule.recipients?.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.active}
                          onCheckedChange={() => handleToggleActive(schedule)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingSchedule(schedule); setShowDialog(true); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create New Report Schedule'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="schedule_name">Schedule Name</Label>
              <Input
                id="schedule_name"
                name="schedule_name"
                defaultValue={editingSchedule?.schedule_name}
                placeholder="e.g., Monthly Financial Summary"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report_type">Report Type</Label>
                <Select name="report_type" defaultValue={editingSchedule?.report_type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Profit & Loss Statement">Profit & Loss Statement</SelectItem>
                    <SelectItem value="Balance Sheet">Balance Sheet</SelectItem>
                    <SelectItem value="Cash Flow Statement">Cash Flow Statement</SelectItem>
                    <SelectItem value="Budget Variance">Budget Variance</SelectItem>
                    <SelectItem value="Flotilla Breakdown">Flotilla Breakdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="flotilla_id">Flotilla (Optional)</Label>
                <Select name="flotilla_id" defaultValue={editingSchedule?.flotilla_id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="All flotillas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Flotillas</SelectItem>
                    {flotillas.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.flotilla_number} - {f.flotilla_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select name="frequency" defaultValue={editingSchedule?.frequency || 'monthly'} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipients">Email Recipients (comma-separated)</Label>
              <Input
                id="recipients"
                name="recipients"
                defaultValue={editingSchedule?.recipients?.join(', ')}
                placeholder="email1@example.com, email2@example.com"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Reports will be automatically generated and emailed to these addresses
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}