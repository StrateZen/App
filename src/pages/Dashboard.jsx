import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Anchor, Plus, TrendingUp, DollarSign, ExternalLink, FileText, AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/lib/utils";
import { RequireAuth, useFlotillaFilter, useRolePermissions } from "../components/auth/AccessControl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

import DivisionStats from "../components/dashboard/DivisionStats";
import MonthlyIncomeExpenseChart from "../components/dashboard/MonthlyIncomeExpenseChart";
import BudgetVsActualChart from "../components/dashboard/BudgetVsActualChart";
import TransactionTrendsChart from "../components/dashboard/TransactionTrendsChart";
import AlertsSummary from "../components/dashboard/AlertsSummary";

export default function DashboardPage() {
  return (
    <RequireAuth pageName="Dashboard">
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { filterByFlotilla, user } = useFlotillaFilter();
  const { hasDivisionRole, getUserFlotillaIds } = useRolePermissions();
  const canViewAllFlotillas = hasDivisionRole();
  const userFlotillaIds = getUserFlotillaIds();
  
  const [selectedFlotilla, setSelectedFlotilla] = useState(
    canViewAllFlotillas ? 'all' : (userFlotillaIds[0] || 'all')
  );
  const [drillDownAccount, setDrillDownAccount] = useState(null);
  const [drillDownStat, setDrillDownStat] = useState(null); // { type: 'income'|'expense'|'transactions', transactions: [] }
  
  const { data: allDivisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => base44.entities.Division.list(),
    initialData: [],
  });
  
  const division = allDivisions[0];

  const { data: allFlotillas, isLoading: isLoadingFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const flotillas = canViewAllFlotillas
    ? allFlotillas
    : allFlotillas.filter(f => userFlotillaIds.includes(f.id));

  useEffect(() => {
    // Set initial flotilla based on access
    if (!canViewAllFlotillas && userFlotillaIds.length > 0) {
      setSelectedFlotilla(userFlotillaIds[0]);
    }
  }, [canViewAllFlotillas, userFlotillaIds]);

  const { data: allTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date', 2000),
    initialData: [],
  });

  // For division roles, show all transactions; for flotilla roles, filter to assigned flotillas
  const transactions = canViewAllFlotillas ? allTransactions : filterByFlotilla(allTransactions);

  const { data: allBudgets, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const budgets = filterByFlotilla(allBudgets);

  const { data: allBankAccounts = [], isLoading: isLoadingBankAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => base44.entities.BankAccount.list(),
  });

  const { data: allReconciliations = [] } = useQuery({
    queryKey: ['reconciliations'],
    queryFn: () => base44.entities.Reconciliation.list('-reconciled_date'),
  });

  const { data: allVolunteerActivities = [], isLoading: isLoadingVolunteer } = useQuery({
    queryKey: ['volunteerActivities'],
    queryFn: () => base44.entities.VolunteerActivity.list('-date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const bankAccounts = filterByFlotilla(allBankAccounts, 'flotilla_id').filter(a => a.active);

  // Calculate current balance using the LATEST reconciliation for an account
  const calculateAccountBalance = (accountId) => {
    const accountReconciliations = allReconciliations
      .filter(r => r.bank_account_id === accountId && r.reconciled)
      .sort((a, b) => new Date(b.reconciled_date) - new Date(a.reconciled_date));
    if (accountReconciliations.length > 0) {
      return accountReconciliations[0].ending_balance;
    }
    return 0;
  };

  const filteredBankAccounts = selectedFlotilla === 'all' 
    ? bankAccounts 
    : bankAccounts.filter(a => a.flotilla_id === selectedFlotilla);

  // Total balance respects the selected flotilla filter
  const totalDivisionBalance = filteredBankAccounts.reduce((sum, account) => sum + calculateAccountBalance(account.id), 0);

  const handleBalanceClick = () => {
    const accountDetails = filteredBankAccounts.map(account => ({
      ...account,
      balance: calculateAccountBalance(account.id),
      flotilla: flotillas.find(f => f.id === account.flotilla_id)
    }));
    
    setDrillDownAccount({
      accounts: accountDetails,
      totalBalance: accountDetails.reduce((sum, a) => sum + a.balance, 0)
    });
  };

  // Calculate stats - filter by selected flotilla
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredTransactions = selectedFlotilla === 'all' 
    ? transactions 
    : transactions.filter(t => t.flotilla_id === selectedFlotilla);

  // Use rolling 12 months for summary stats
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const monthlyTransactions = filteredTransactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate >= twelveMonthsAgo;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = monthlyTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netIncome = totalIncome - totalExpenses;

  // Calculate volunteer hours by flotilla for current month
  console.log('Dashboard - All volunteer activities:', allVolunteerActivities.length);
  console.log('Dashboard - All users:', allUsers.length);
  console.log('Dashboard - Sample activity:', allVolunteerActivities[0]);
  console.log('Dashboard - Sample user:', allUsers.find(u => u.email === allVolunteerActivities[0]?.created_by));
  
  const volunteerActivitiesByFlotilla = flotillas.map(flotilla => {
    const flotillaActivities = allVolunteerActivities.filter(a => {
      // First check the date
      const aDate = new Date(a.date);
      const isCurrentMonth = aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear;
      
      if (!isCurrentMonth) return false;
      
      // Match by flotilla_id directly
      if (a.flotilla_id === flotilla.id) {
        console.log(`Activity ${a.id} matched by flotilla_id for ${flotilla.flotilla_number}`);
        return true;
      }
      
      // Fallback: check if activity was created by a user assigned to this flotilla
      if (!a.flotilla_id && a.created_by) {
        const activityUser = allUsers?.find(u => u.email === a.created_by);
        if (activityUser?.role_assignments) {
          const hasMatch = activityUser.role_assignments.some(r => r.flotilla_id === flotilla.id);
          if (hasMatch) {
            console.log(`Activity ${a.id} matched by user assignment for ${flotilla.flotilla_number} (user: ${a.created_by})`);
          }
          return hasMatch;
        }
      }
      
      return false;
    });
    
    const totalHours = flotillaActivities.reduce((sum, a) => sum + (a.total_hours || 0), 0);
    const totalMileage = flotillaActivities.reduce((sum, a) => sum + (a.mileage || 0), 0);
    const totalExpenses = flotillaActivities.reduce((sum, a) => sum + (a.non_reimbursed_expenses || 0), 0);
    
    return {
      flotilla,
      totalHours,
      totalMileage,
      totalExpenses,
      activityCount: flotillaActivities.length
    };
  });

  const totalDivisionHours = volunteerActivitiesByFlotilla.reduce((sum, f) => sum + f.totalHours, 0);
  const totalDivisionMileage = volunteerActivitiesByFlotilla.reduce((sum, f) => sum + f.totalMileage, 0);

  if (isLoadingFlotillas || isLoadingTransactions) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading dashboard...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <img 
                  src={division?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693829a377dc19b168d2f13c/15f931f6b_Division10_logo.png"} 
                  alt="Division Logo" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-xl md:text-3xl font-bold text-slate-900">
                  Division 10 - Greater Phoenix Dashboard
                </h1>
                <p className="text-sm md:text-base text-slate-600 mt-1">Comprehensive Reporting of Flotillas</p>
              </div>
            </div>
            <Select value={selectedFlotilla} onValueChange={setSelectedFlotilla}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canViewAllFlotillas && <SelectItem value="all">All Flotillas</SelectItem>}
                {flotillas.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.flotilla_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Division Total Balance */}
        <Card 
          className="shadow-sm border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all group"
          onClick={handleBalanceClick}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                  Greater Phoenix Division Balance
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-4xl font-bold text-white mt-2">
                  ${isLoadingBankAccounts ? '...' : formatCurrency(totalDivisionBalance)}
                </p>
                <p className="text-blue-100 text-xs mt-1">
                  Across {filteredBankAccounts.length} bank account{filteredBankAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Division Stats */}
        <DivisionStats
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netIncome={netIncome}
          flotillasCount={flotillas.length}
          transactionsCount={monthlyTransactions.length}
          isLoading={isLoadingTransactions}
          onIncomeClick={() => setDrillDownStat({ type: 'income', transactions: monthlyTransactions.filter(t => t.transaction_type === 'income') })}
          onExpensesClick={() => setDrillDownStat({ type: 'expense', transactions: monthlyTransactions.filter(t => t.transaction_type === 'expense') })}
          onNetClick={() => setDrillDownStat({ type: 'net', transactions: monthlyTransactions })}
          onTransactionsClick={() => setDrillDownStat({ type: 'transactions', transactions: monthlyTransactions })}
        />

        {/* Alerts and Activity Summary */}
        <AlertsSummary
          transactions={transactions}
          budgets={budgets}
          flotillas={flotillas}
          selectedFlotilla={selectedFlotilla}
        />

        {/* Flagged Transactions Alert */}
        {filteredTransactions.filter(t => t.audit_status === 'flagged').length > 0 && (
          <Card className="shadow-sm border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="border-b border-red-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Flagged Transactions Requiring Attention
                </CardTitle>
                <Badge className="bg-red-500 text-white">
                  {filteredTransactions.filter(t => t.audit_status === 'flagged').length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Breakdown by Flotilla */}
              {selectedFlotilla === 'all' && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
                  <h4 className="font-semibold text-slate-900 mb-3">Breakdown by Flotilla</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {flotillas.map(f => {
                      const count = filteredTransactions.filter(t => t.audit_status === 'flagged' && t.flotilla_id === f.id).length;
                      if (count === 0) return null;
                      return (
                        <div key={f.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs text-slate-600 mb-1">{f.flotilla_number}</p>
                          <p className="text-xl font-bold text-red-700">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {filteredTransactions.filter(t => t.audit_status === 'flagged').slice(0, 5).map(t => {
                  const flotilla = flotillas.find(f => f.id === t.flotilla_id);
                  return (
                    <Link 
                      key={t.id} 
                      to={createPageUrl(`Transactions?edit=${t.id}`)}
                      className="block"
                    >
                      <div className="p-4 bg-white rounded-lg border border-red-200 hover:border-red-400 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {flotilla && (
                                <Badge variant="outline" className="text-xs">
                                  {flotilla.flotilla_number}
                                </Badge>
                              )}
                              <Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>
                                {t.transaction_type}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-900">{t.description}</h4>
                            {t.audit_notes && (
                              <p className="text-sm text-red-700 mt-2">
                                <span className="font-medium">Reason:</span> {t.audit_notes}
                              </p>
                            )}
                            {t.vendor_payee && (
                              <p className="text-xs text-slate-600 mt-1">Vendor: {t.vendor_payee}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-slate-900">${formatCurrency(t.amount)}</p>
                            <Button 
                              size="sm" 
                              className="mt-2 bg-red-600 hover:bg-red-700"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = createPageUrl(`Transactions?edit=${t.id}`);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {filteredTransactions.filter(t => t.audit_status === 'flagged').length > 5 && (
                  <Link to={createPageUrl('AuditCommittee')}>
                    <div className="p-3 bg-red-100 rounded-lg text-center hover:bg-red-200 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-red-900">
                        + {filteredTransactions.filter(t => t.audit_status === 'flagged').length - 5} more flagged transaction{filteredTransactions.filter(t => t.audit_status === 'flagged').length - 5 > 1 ? 's' : ''} → View All
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Income vs Expenses */}
        <MonthlyIncomeExpenseChart
          transactions={transactions}
          flotillas={flotillas}
          selectedFlotilla={selectedFlotilla}
        />

        {/* Budget vs Actual */}
        <BudgetVsActualChart
          transactions={transactions}
          budgets={budgets}
          selectedFlotilla={selectedFlotilla}
          flotillas={flotillas}
        />

        {/* Transaction Trends */}
        <TransactionTrendsChart
          transactions={transactions}
          selectedFlotilla={selectedFlotilla}
          flotillas={flotillas}
        />

        {/* Volunteer Hours by Flotilla */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Volunteer Hours by Flotilla - {format(now, 'MMMM yyyy')}
              </CardTitle>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">{totalDivisionHours.toFixed(1)} hrs</p>
                <p className="text-xs text-slate-600">Division Total</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volunteerActivitiesByFlotilla
                .sort((a, b) => b.totalHours - a.totalHours)
                .map(({ flotilla, totalHours, totalMileage, totalExpenses, activityCount }) => (
                  <Card key={flotilla.id} className="border-slate-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge className="bg-green-600 text-white mb-2">
                            {flotilla.flotilla_number}
                          </Badge>
                          <p className="text-xs text-slate-600">{flotilla.flotilla_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-700">{totalHours.toFixed(1)}</p>
                          <p className="text-xs text-slate-500">hours</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Activities:</span>
                          <span className="font-semibold">{activityCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mileage:</span>
                          <span className="font-semibold">{totalMileage.toFixed(0)} mi</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expenses:</span>
                          <span className="font-semibold">${formatCurrency(totalExpenses)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {volunteerActivitiesByFlotilla.every(f => f.totalHours === 0) && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No volunteer hours logged this month</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stat Drill-down Dialog */}
        <Dialog open={!!drillDownStat} onOpenChange={() => setDrillDownStat(null)}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {drillDownStat?.type === 'income' && `12-Month Income ($${formatCurrency(drillDownStat?.transactions?.reduce((s,t) => s + (t.amount||0), 0)||0)})`}
                {drillDownStat?.type === 'expense' && `12-Month Expenses ($${formatCurrency(drillDownStat?.transactions?.reduce((s,t) => s + (t.amount||0), 0)||0)})`}
                {drillDownStat?.type === 'net' && `All Transactions — Last 12 Months`}
                {drillDownStat?.type === 'transactions' && `All Transactions — Last 12 Months (${drillDownStat?.transactions?.length || 0})`}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-x-auto">
              {drillDownStat?.transactions?.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No transactions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flotilla</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drillDownStat?.transactions?.map(t => {
                      const flotilla = flotillas.find(f => f.id === t.flotilla_id);
                      return (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => { setDrillDownStat(null); window.location.href = createPageUrl(`Transactions?edit=${t.id}`); }}
                        >
                          <TableCell><Badge variant="outline">{flotilla?.flotilla_number || 'N/A'}</Badge></TableCell>
                          <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{t.description}</TableCell>
                          <TableCell className="text-sm">{t.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                          <TableCell><Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>{t.transaction_type}</Badge></TableCell>
                          <TableCell className={`text-right font-semibold ${t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            ${formatCurrency(t.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-600">Total Income</p>
                  <p className="text-lg font-bold text-green-600">
                    ${formatCurrency(drillDownStat?.transactions?.filter(t => t.transaction_type === 'income').reduce((s,t) => s+(t.amount||0),0)||0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    ${formatCurrency(drillDownStat?.transactions?.filter(t => t.transaction_type === 'expense').reduce((s,t) => s+(t.amount||0),0)||0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Net</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${formatCurrency((drillDownStat?.transactions?.filter(t => t.transaction_type === 'income').reduce((s,t) => s+(t.amount||0),0)||0) - 
                       (drillDownStat?.transactions?.filter(t => t.transaction_type === 'expense').reduce((s,t) => s+(t.amount||0),0)||0))}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!drillDownAccount} onOpenChange={() => setDrillDownAccount(null)}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Greater Phoenix Division Bank Accounts - Total Balance: ${formatCurrency(drillDownAccount?.totalBalance)}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flotilla</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDownAccount?.accounts?.map(account => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          {account.flotilla?.flotilla_number}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{account.account_name}</TableCell>
                      <TableCell>{account.bank_name}</TableCell>
                      <TableCell className="text-slate-600">{account.account_number}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        ${formatCurrency(account.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Balance:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${formatCurrency(drillDownAccount?.totalBalance)}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}