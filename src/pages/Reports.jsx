import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, Building2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { RequireAuth, useFlotillaFilter } from "../components/auth/AccessControl";

import BalanceSheet from "../components/reports/BalanceSheet";
import CashFlowStatement from "../components/reports/CashFlowStatement";
import ProfitLossStatement from "../components/reports/ProfitLossStatement";
import BudgetVarianceReport from "../components/reports/BudgetVarianceReport";
import FlotillaBreakdownReport from "../components/reports/FlotillaBreakdownReport";
import ApproverReport from "../components/reports/ApproverReport";
import AIReportGenerator from "../components/reports/AIReportGenerator";
import BudgetApprovalReport from "../components/reports/BudgetApprovalReport";
import ReportScheduler from "../components/reports/ReportScheduler";

export default function ReportsPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <ReportsContent />
    </RequireAuth>
  );
}

function ReportsContent() {
  const { filterByFlotilla, user } = useFlotillaFilter();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedFlotilla, setSelectedFlotilla] = useState('all');
  const [reportType, setReportType] = useState('balance-sheet');

  const { data: allFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const flotillas = user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length > 0
    ? allFlotillas.filter(f => user.flotilla_ids.includes(f.id))
    : allFlotillas;

  const { data: allTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date'),
    initialData: [],
  });

  const transactions = filterByFlotilla(allTransactions);

  const { data: allBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const budgets = filterByFlotilla(allBudgets);

  useEffect(() => {
    if (user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length === 1) {
      setSelectedFlotilla(user.flotilla_ids[0]);
    }
  }, [user]);

  const getFilteredTransactions = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
    const monthEnd = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));

    let filtered = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    if (selectedFlotilla !== 'all') {
      filtered = filtered.filter(t => t.flotilla_id === selectedFlotilla);
    }

    return filtered;
  };

  const getAllTransactionsUpToMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const monthEnd = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));

    let filtered = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate <= monthEnd;
    });

    if (selectedFlotilla !== 'all') {
      filtered = filtered.filter(t => t.flotilla_id === selectedFlotilla);
    }

    return filtered;
  };

  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy')
      });
    }
    return options;
  };

  const exportToCSV = (data, filename) => {
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${selectedMonth}.csv`;
    link.click();
  };

  const flotillaName = selectedFlotilla === 'all' 
    ? 'Division 10 - All Flotillas' 
    : flotillas.find(f => f.id === selectedFlotilla)?.flotilla_number + ' ' + flotillas.find(f => f.id === selectedFlotilla)?.flotilla_name;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
                <p className="text-slate-600 mt-1">Monthly financial statements and analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Report Month
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(user?.access_level !== 'flotilla_staff') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Flotilla
                  </label>
                  <Select value={selectedFlotilla} onValueChange={setSelectedFlotilla}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Flotillas (Division Level)</SelectItem>
                      {flotillas.map(flotilla => (
                        <SelectItem key={flotilla.id} value={flotilla.id}>
                          {flotilla.flotilla_number} - {flotilla.flotilla_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Report Type
                </label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                    <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                    <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                    <SelectItem value="budget-variance">Budget vs Actuals</SelectItem>
                    <SelectItem value="flotilla-breakdown">Flotilla Breakdown Report</SelectItem>
                    <SelectItem value="approver-report">Income & Expenses by Approver</SelectItem>
                    <SelectItem value="budget-approval">Budget Approval Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Viewing:</span> {flotillaName}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export to Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Report Generator */}
        <AIReportGenerator
          flotillas={allFlotillas}
          transactions={transactions}
          budgets={budgets}
        />

        {/* Report Scheduler */}
        <ReportScheduler
          flotillas={allFlotillas}
          user={user}
        />

        {/* Reports Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {reportType === 'balance-sheet' && (
            <BalanceSheet
              transactions={getAllTransactionsUpToMonth()}
              flotillaName={flotillaName}
              reportMonth={selectedMonth}
              budgets={budgets}
            />
          )}
          
          {reportType === 'cash-flow' && (
            <CashFlowStatement
              transactions={getFilteredTransactions()}
              flotillaName={flotillaName}
              reportMonth={selectedMonth}
            />
          )}
          
          {reportType === 'profit-loss' && (
            <ProfitLossStatement
              transactions={getFilteredTransactions()}
              flotillaName={flotillaName}
              reportMonth={selectedMonth}
              budgets={budgets}
            />
          )}
          
          {reportType === 'budget-variance' && (
            <BudgetVarianceReport
              transactions={getAllTransactionsUpToMonth()}
              budgets={budgets}
              flotillaId={selectedFlotilla}
              flotillaName={flotillaName}
              reportMonth={selectedMonth}
              allFlotillas={selectedFlotilla === 'all'}
            />
          )}

          {reportType === 'flotilla-breakdown' && (
            <FlotillaBreakdownReport
              transactions={getFilteredTransactions()}
              flotillas={allFlotillas}
              allFlotillas={allFlotillas}
              selectedMonth={selectedMonth}
            />
          )}

          {reportType === 'approver-report' && (
            <ApproverReport
              transactions={getFilteredTransactions()}
              flotillaName={flotillaName}
              reportMonth={selectedMonth}
            />
          )}

          {reportType === 'budget-approval' && (
            <BudgetApprovalReport
              budgets={budgets}
              flotillas={allFlotillas}
              flotillaId={selectedFlotilla}
              reportMonth={selectedMonth}
            />
          )}
        </div>
      </div>
    </div>
  );
}