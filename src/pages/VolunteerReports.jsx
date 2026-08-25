import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "../components/auth/AccessControl";
import MonthlyRollupReport from "../components/volunteer/MonthlyRollupReport";
import VolunteerExport from "../components/volunteer/VolunteerExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function VolunteerReportsPage() {
  const { user, loading } = useAuth();
  const [periodType, setPeriodType] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: allActivities = [] } = useQuery({
    queryKey: ['volunteer-activities'],
    queryFn: () => base44.entities.VolunteerActivity.list('-date', 1000),
    initialData: [],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    base44.auth.redirectToLogin(window.location.pathname);
    return null;
  }

  const userActivities = allActivities.filter(a => a.created_by === user?.email);

  // Calculate cumulative totals
  const totalHours = userActivities.reduce((sum, a) => sum + (a.total_hours || 0), 0);
  const totalMileage = userActivities.reduce((sum, a) => sum + (a.mileage || 0), 0);
  const totalExpenses = userActivities.reduce((sum, a) => sum + (a.non_reimbursed_expenses || 0), 0);

  // Filter by selected period
  const filteredActivities = userActivities.filter(a => {
    if (periodType === 'month') {
      return a.date?.startsWith(selectedMonth);
    } else {
      return a.date?.startsWith(selectedYear);
    }
  });

  // Generate month options (current month + last 23 months = 24 total)
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const year = now.getFullYear();
    const month = now.getMonth() - i;
    const targetDate = new Date(year, month, 1);
    const monthStr = targetDate.toISOString().slice(0, 7);
    monthOptions.push(monthStr);
  }

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Volunteer Activity Reports</h1>
              <p className="text-slate-600 mt-1">View your volunteer hours and contributions</p>
            </div>
          </div>
        </div>

        {/* Cumulative Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-900">{totalHours.toFixed(2)}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Total Mileage</p>
                  <p className="text-3xl font-bold text-green-900">{totalMileage.toFixed(0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium mb-1">Total Non-Reimbursed $</p>
                  <p className="text-3xl font-bold text-amber-900">${totalExpenses.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Report Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={periodType === 'month' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('month')}
                  className={periodType === 'month' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  Monthly
                </Button>
                <Button
                  variant={periodType === 'year' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('year')}
                  className={periodType === 'year' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  Yearly
                </Button>
              </div>

              {periodType === 'month' ? (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(month => {
                      const [year, monthNum] = month.split('-');
                      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <SelectItem key={month} value={month}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Period Report */}
        <MonthlyRollupReport 
          activities={filteredActivities} 
          userName={user?.full_name}
          periodType={periodType}
          periodLabel={periodType === 'month' 
            ? (() => {
                const [year, month] = selectedMonth.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              })()
            : selectedYear
          }
        />

        {/* Export All Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Export All Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">Download all your volunteer activity records as a CSV file.</p>
            <VolunteerExport activities={userActivities} userName={user?.full_name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}