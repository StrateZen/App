import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Anchor, DollarSign, TrendingUp, TrendingDown, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/lib/utils";
import { RequireAuth, useFlotillaFilter, useRolePermissions } from "../components/auth/AccessControl";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

import MonthlyIncomeExpenseChart from "../components/dashboard/MonthlyIncomeExpenseChart";
import BudgetVsActualChart from "../components/dashboard/BudgetVsActualChart";
import TransactionTrendsChart from "../components/dashboard/TransactionTrendsChart";
import AlertsSummary from "../components/dashboard/AlertsSummary";

export default function FlotillaDashboardPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <FlotillaDashboardContent />
    </RequireAuth>
  );
}

function FlotillaDashboardContent() {
  const { user, loading: userLoading } = useFlotillaFilter();
  const { hasDivisionRole, getUserFlotillaIds } = useRolePermissions();
  const canViewAllFlotillas = hasDivisionRole();
  const userFlotillaIds = getUserFlotillaIds();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drillDownStat, setDrillDownStat] = useState(null);

  const { data: allFlotillas = [], isLoading: isLoadingFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
  });

  const { data: allTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date', 2000),
    initialData: [],
  });

  const { data: allBudgets, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const { data: allBankAccounts = [], isLoading: isLoadingBankAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => base44.entities.BankAccount.list(),
  });

  const { data: allReconciliations = [], isLoading: isLoadingReconciliations } = useQuery({
    queryKey: ['reconciliations'],
    queryFn: () => base44.entities.Reconciliation.list('-reconciled_date'),
  });

  // Filter flotillas based on user's assignments
  const flotillas = canViewAllFlotillas
    ? allFlotillas
    : allFlotillas.filter(f => userFlotillaIds.includes(f.id));

  const [selectedFlotilla, setSelectedFlotilla] = useState(null);

  useEffect(() => {
    if (!canViewAllFlotillas && userFlotillaIds.length > 0) {
      setSelectedFlotilla(userFlotillaIds[0]);
    } else if (flotillas.length > 0 && !selectedFlotilla) {
      setSelectedFlotilla(flotillas[0].id);
    }
  }, [canViewAllFlotillas, userFlotillaIds, flotillas, selectedFlotilla]);

  // Show loading state
  if (userLoading || isLoadingFlotillas || !user) {
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

  // Show empty state if no flotillas
  if (allFlotillas.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-600">No flotillas available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeFlotilla = selectedFlotilla || (flotillas.length > 0 ? flotillas[0].id : null);
  const selectedFlotillaData = allFlotillas.find(f => f.id === activeFlotilla);

  if (!activeFlotilla || !selectedFlotillaData) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-600">Unable to load flotilla data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  console.log('Active Flotilla:', activeFlotilla);
  console.log('All Transactions:', allTransactions);
  console.log('User:', user);
  
  const transactions = allTransactions.filter(t => t.flotilla_id === activeFlotilla);
  const budgets = allBudgets.filter(b => b.flotilla_id === activeFlotilla);
  const bankAccounts = allBankAccounts.filter(a => a.flotilla_id === activeFlotilla && a.active);

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

  const totalBalance = bankAccounts.reduce((sum, account) => sum + calculateAccountBalance(account.id), 0);

  const handleAccountClick = (account) => {
    // Get all reconciliations for this account sorted latest first
    const accountReconciliations = allReconciliations
      .filter(r => r.bank_account_id === account.id && r.reconciled)
      .sort((a, b) => new Date(b.reconciled_date) - new Date(a.reconciled_date));
    const latestReconciliation = accountReconciliations[0] || null;

    // Show all flotilla transactions so user can see full context
    setSelectedAccount({
      ...account,
      balance: calculateAccountBalance(account.id),
      transactions: transactions,
      reconciliation: latestReconciliation,
      allReconciliations: accountReconciliations
    });
  };
  
  console.log('Filtered Transactions:', transactions);

  // Calculate stats for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Rolling 12 months
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const monthlyTransactions = transactions.filter(t => {
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

  const stats = [
    {
      title: "12-Month Income",
      value: `$${formatCurrency(totalIncome)}`,
      icon: DollarSign,
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      onClick: () => setDrillDownStat({ type: 'income', transactions: monthlyTransactions.filter(t => t.transaction_type === 'income') }),
    },
    {
      title: "12-Month Expenses", 
      value: `$${formatCurrency(totalExpenses)}`,
      icon: TrendingDown,
      bgColor: "bg-red-500",
      textColor: "text-red-600",
      onClick: () => setDrillDownStat({ type: 'expense', transactions: monthlyTransactions.filter(t => t.transaction_type === 'expense') }),
    },
    {
      title: "Net Income",
      value: `$${formatCurrency(netIncome)}`,
      icon: TrendingUp,
      bgColor: (netIncome || 0) >= 0 ? "bg-blue-500" : "bg-orange-500",
      textColor: (netIncome || 0) >= 0 ? "text-blue-600" : "text-orange-600",
      onClick: () => setDrillDownStat({ type: 'net', transactions: monthlyTransactions }),
    },
    {
      title: "Total Transactions",
      value: monthlyTransactions.length,
      icon: FileText,
      bgColor: "bg-purple-500",
      textColor: "text-purple-600",
      onClick: () => setDrillDownStat({ type: 'transactions', transactions: monthlyTransactions }),
    },
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                {selectedFlotillaData.logo_url ? (
                  <img 
                    src={selectedFlotillaData.logo_url} 
                    alt="Flotilla Logo" 
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <Anchor className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Flotilla {selectedFlotillaData.flotilla_number} {selectedFlotillaData.flotilla_name}
                </h1>
                <p className="text-slate-600 mt-1">
                  Financial overview and performance
                </p>
              </div>
            </div>
            {flotillas.length > 1 && (
              <Select value={activeFlotilla} onValueChange={setSelectedFlotilla}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {flotillas.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.flotilla_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Bank Accounts Balance */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingBankAccounts ? (
              <div className="text-center text-slate-500">Loading...</div>
            ) : bankAccounts.length === 0 ? (
              <p className="text-center text-slate-500">No bank accounts</p>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map(account => (
                  <div 
                    key={account.id} 
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => handleAccountClick(account)}
                  >
                    <div>
                      <p className="font-semibold text-slate-900 flex items-center gap-2">
                        {account.account_name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-xs text-slate-600">{account.bank_name}</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      ${formatCurrency(calculateAccountBalance(account.id))}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200 mt-4">
                  <p className="font-bold text-slate-900">Total Balance</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${formatCurrency(totalBalance)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden shadow-sm border-slate-200 transition-all duration-200 ${stat.onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 group' : 'hover:shadow-md'}`}
              onClick={stat.onClick}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 transform translate-x-6 -translate-y-6 ${stat.bgColor} rounded-full opacity-10`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      {stat.title}
                      {stat.onClick && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </p>
                    <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
                      {isLoadingTransactions ? <Skeleton className="h-8 w-20" /> : stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.bgColor} bg-opacity-15`}>
                    <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Alerts and Activity Summary */}
        <AlertsSummary
          transactions={transactions}
          budgets={budgets}
          flotillas={flotillas}
          selectedFlotilla={activeFlotilla}
        />

        {/* Flagged Transactions Alert */}
        {transactions.filter(t => t.audit_status === 'flagged').length > 0 && (
          <Card className="shadow-sm border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="border-b border-red-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-red-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Flagged Transactions Requiring Attention
                </CardTitle>
                <Badge className="bg-red-500 text-white">
                  {transactions.filter(t => t.audit_status === 'flagged').length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {transactions.filter(t => t.audit_status === 'flagged').slice(0, 5).map(t => (
                  <Link 
                    key={t.id} 
                    to={createPageUrl(`Transactions?edit=${t.id}`)}
                    className="block"
                  >
                    <div className="p-4 bg-white rounded-lg border border-red-200 hover:border-red-400 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                ))}
                {transactions.filter(t => t.audit_status === 'flagged').length > 5 && (
                  <Link to={createPageUrl('AuditCommittee')}>
                    <div className="p-3 bg-red-100 rounded-lg text-center hover:bg-red-200 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-red-900">
                        + {transactions.filter(t => t.audit_status === 'flagged').length - 5} more flagged transaction{transactions.filter(t => t.audit_status === 'flagged').length - 5 > 1 ? 's' : ''} → View All
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
          selectedFlotilla={activeFlotilla}
        />

        {/* Budget vs Actual */}
        <BudgetVsActualChart
          transactions={transactions}
          budgets={budgets}
          selectedFlotilla={activeFlotilla}
        />

        {/* Transaction Trends */}
        <TransactionTrendsChart
          transactions={transactions}
          selectedFlotilla={activeFlotilla}
        />

        {/* Stat Drill-down Dialog */}
        <Dialog open={!!drillDownStat} onOpenChange={() => setDrillDownStat(null)}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {drillDownStat?.type === 'income' && `Monthly Income — ${format(now, 'MMMM yyyy')} ($${formatCurrency(drillDownStat?.transactions?.reduce((s,t) => s+(t.amount||0),0)||0)})`}
                {drillDownStat?.type === 'expense' && `Monthly Expenses — ${format(now, 'MMMM yyyy')} ($${formatCurrency(drillDownStat?.transactions?.reduce((s,t) => s+(t.amount||0),0)||0)})`}
                {(drillDownStat?.type === 'net' || drillDownStat?.type === 'transactions') && `All Transactions — ${format(now, 'MMMM yyyy')} (${drillDownStat?.transactions?.length || 0})`}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-x-auto">
              {drillDownStat?.transactions?.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No transactions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drillDownStat?.transactions?.map(t => (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => { setDrillDownStat(null); window.location.href = createPageUrl(`Transactions?edit=${t.id}`); }}
                      >
                        <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell className="text-sm">{t.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                        <TableCell><Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>{t.transaction_type}</Badge></TableCell>
                        <TableCell className={`text-right font-semibold ${t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          ${formatCurrency(t.amount)}
                          </TableCell>
                          </TableRow>
                          ))}
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

        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount?.account_name} - Account Details
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              {/* Account Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${formatCurrency(selectedAccount?.balance)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Bank</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedAccount?.bank_name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedAccount?.account_number}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Last Reconciled</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedAccount?.reconciliation?.reconciled_date 
                      ? format(new Date(selectedAccount.reconciliation.reconciled_date), 'MMM dd, yyyy')
                      : 'Not reconciled'
                    }
                  </p>
                </div>
              </div>

              {/* All Flotilla Transactions */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  All Flotilla Transactions ({selectedAccount?.transactions?.length || 0})
                </h3>
                {selectedAccount?.transactions?.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-xs text-slate-600">Total Income</p>
                        <p className="text-lg font-bold text-green-600">
                          ${formatCurrency(selectedAccount.transactions.filter(t => t.transaction_type === 'income').reduce((s,t) => s+(t.amount||0),0))}
                        </p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg text-center">
                        <p className="text-xs text-slate-600">Total Expenses</p>
                        <p className="text-lg font-bold text-red-600">
                          ${formatCurrency(selectedAccount.transactions.filter(t => t.transaction_type === 'expense').reduce((s,t) => s+(t.amount||0),0))}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-slate-600">Net</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${formatCurrency(selectedAccount.transactions.filter(t => t.transaction_type === 'income').reduce((s,t) => s+(t.amount||0),0) - selectedAccount.transactions.filter(t => t.transaction_type === 'expense').reduce((s,t) => s+(t.amount||0),0))}
                        </p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAccount.transactions.map(t => (
                          <TableRow 
                            key={t.id} 
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => { setSelectedAccount(null); window.location.href = createPageUrl(`Transactions?edit=${t.id}`); }}
                          >
                            <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>
                              <Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>
                                {t.transaction_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {t.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              ${formatCurrency(t.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <p className="text-center text-slate-500 py-8">No transactions found for this flotilla</p>
                )}
              </div>

              {/* Reconciliation History */}
              {selectedAccount?.allReconciliations?.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg mb-3">Reconciliation History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Starting Balance</TableHead>
                        <TableHead className="text-right">Ending Balance</TableHead>
                        <TableHead>Reconciled Date</TableHead>
                        <TableHead>By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAccount.allReconciliations.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">
                            {format(new Date(r.period_start), 'MMM dd, yyyy')} – {format(new Date(r.period_end), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">${formatCurrency(r.starting_balance)}</TableCell>
                          <TableCell className="text-right font-bold text-blue-600">${formatCurrency(r.ending_balance)}</TableCell>
                          <TableCell>{r.reconciled_date ? format(new Date(r.reconciled_date), 'MMM dd, yyyy') : '—'}</TableCell>
                          <TableCell className="text-sm text-slate-600">{r.reconciled_by || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}