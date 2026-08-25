import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";

export function exportToCSV(activities, filename = 'volunteer-activities') {
  const headers = ['Date', 'Activity Code', 'Mission', 'Start Time', 'End Time', 'Total Hours', 'Mileage', 'Non-Reimbursed $', 'Notes'];
  
  const rows = activities.map(activity => [
    format(new Date(activity.date), 'yyyy-MM-dd'),
    activity.activity_code || '',
    activity.activity_mission || '',
    activity.start_time || '',
    activity.end_time || '',
    activity.total_hours || 0,
    activity.mileage || 0,
    activity.non_reimbursed_expenses || 0,
    (activity.notes || '').replace(/"/g, '""')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function VolunteerExport({ activities, userName }) {
  const handleExportCSV = () => {
    exportToCSV(activities, `volunteer-activities-${userName?.replace(/\s+/g, '-')}`);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportCSV}
        className="gap-2"
        disabled={activities.length === 0}
      >
        <FileSpreadsheet className="w-4 h-4" />
        Export CSV
      </Button>
    </div>
  );
}