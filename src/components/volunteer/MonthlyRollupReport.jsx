import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { exportToCSV } from "./VolunteerExport";

const ACTIVITY_CODES = {
  '91A': 'Vessel Safety Checks',
  '91H': 'VSC Paddlecraft',
  '91B': 'Vessel Facility Inspections',
  '91C': 'Commercial Fishing Vessel Exams',
  '91D': 'Uninspected Passenger Vessel Exams',
  '91G': 'Uninspected Towing Vessel Exams',
  '99A': 'Auxiliary Leadership',
  '99B': 'RBS Support',
  '99C': 'Marine Safety Support',
  '99D': 'Training Support',
  '99E': 'Administrative/Logistical Support'
};

export default function MonthlyRollupReport({ activities, userName, periodType = 'month', periodLabel }) {
  const periodActivities = activities;

  // Aggregate by activity code
  const aggregated = periodActivities.reduce((acc, activity) => {
    const code = activity.activity_code || 'Unknown';
    if (!acc[code]) {
      acc[code] = {
        code,
        name: ACTIVITY_CODES[code] || 'Unknown',
        hours: 0,
        mileage: 0,
        expenses: 0,
        missions: []
      };
    }
    acc[code].hours += activity.total_hours || 0;
    acc[code].mileage += activity.mileage || 0;
    acc[code].expenses += activity.non_reimbursed_expenses || 0;
    acc[code].missions.push(activity.activity_mission);
    return acc;
  }, {});

  const aggregatedArray = Object.values(aggregated);

  const totals = {
    hours: aggregatedArray.reduce((sum, item) => sum + item.hours, 0),
    mileage: aggregatedArray.reduce((sum, item) => sum + item.mileage, 0),
    expenses: aggregatedArray.reduce((sum, item) => sum + item.expenses, 0)
  };

  const handleExport = () => {
    const exportData = aggregatedArray.map(item => ({
      period: periodLabel,
      activity_code: item.code,
      activity_mission: `${item.name} - ${item.missions.length} missions`,
      start_time: '',
      end_time: '',
      total_hours: item.hours.toFixed(2),
      mileage: item.mileage.toFixed(0),
      non_reimbursed_expenses: item.expenses.toFixed(2),
      notes: item.missions.join('; ')
    }));
    
    exportToCSV(exportData, `${periodType}-rollup-${periodLabel.replace(/\s+/g, '-')}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>{periodType === 'month' ? 'Monthly' : 'Yearly'} Volunteer Activity Roll-up</CardTitle>
            <Button variant="outline" onClick={handleExport} disabled={aggregatedArray.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-sm text-slate-600">
              <strong>Period:</strong> {periodLabel}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Volunteer:</strong> {userName}
            </p>
          </div>

          {aggregatedArray.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No activities recorded for this month</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Code</TableHead>
                    <TableHead>Activity Name</TableHead>
                    <TableHead className="text-right">Total Hours</TableHead>
                    <TableHead className="text-right">Mileage</TableHead>
                    <TableHead className="text-right">Non-Reimbursed $</TableHead>
                    <TableHead className="text-right">Missions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedArray.map(item => (
                    <TableRow key={item.code}>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.mileage.toFixed(0)}</TableCell>
                      <TableCell className="text-right">${item.expenses.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.missions.length}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{totals.hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{totals.mileage.toFixed(0)}</TableCell>
                    <TableCell className="text-right">${totals.expenses.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{periodActivities.length}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-slate-900">Mission Details:</h4>
                {aggregatedArray.map(item => (
                  <div key={item.code} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-slate-900">{item.code} - {item.name}</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {item.missions.map((mission, idx) => (
                        <li key={idx}>• {mission}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}