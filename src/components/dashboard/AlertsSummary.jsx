import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, CheckCircle, TrendingUp, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AlertsSummary({ transactions, budgets, flotillas, selectedFlotilla = 'all' }) {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [drillDownType, setDrillDownType] = useState(null);

  const getBudgetAlerts = () => {
    const alerts = [];
    const relevantBudgets = selectedFlotilla === 'all' 
      ? budgets.filter(b => b.budget_year === currentYear)
      : budgets.filter(b => b.budget_year === currentYear && b.flotilla_id === selectedFlotilla);

    relevantBudgets.forEach(budget => {
      const flotilla = flotillas.find(f => f.id === budget.flotilla_id);
      
      // Get all transactions for this flotilla this year
      const flotillaTransactions = transactions.filter(
        t => t.flotilla_id === budget.flotilla_id && 
        new Date(t.transaction_date).getFullYear() === currentYear
      );

      const totalIncome = flotillaTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalExpenses = flotillaTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const netIncome = totalIncome - totalExpenses;

      // Alert for negative budget (expenses exceed income)
      if (netIncome < 0) {
        alerts.push({
          type: 'critical',
          title: `${flotilla?.flotilla_number || 'Flotilla'} Budget Deficit`,
          message: `Negative balance: -$${formatCurrency(Math.abs(netIncome), 0)} (Income: $${formatCurrency(totalIncome, 0)}, Expenses: $${formatCurrency(totalExpenses, 0)})`,
          flotillaId: budget.flotilla_id
        });
      }

      // Alert for expense budget overruns
      const budgetedExpenses = Object.values(budget.expense_budget || {}).reduce((sum, val) => sum + val, 0);
      const percentageUsed = budgetedExpenses > 0 ? (totalExpenses / budgetedExpenses) * 100 : 0;

      if (percentageUsed >= 80 && netIncome >= 0) {
        alerts.push({
          type: percentageUsed >= 100 ? 'critical' : percentageUsed >= 90 ? 'high' : 'medium',
          title: `${flotilla?.flotilla_number || 'Flotilla'} Budget Alert`,
          message: `${(percentageUsed || 0).toFixed(1)}% used ($${formatCurrency(totalExpenses, 0)} of $${formatCurrency(budgetedExpenses, 0)})`,
          flotillaId: budget.flotilla_id
        });
      }
    });

    return alerts;
  };

  const getPendingApprovals = () => {
    const relevantTransactions = selectedFlotilla === 'all' 
      ? transactions
      : transactions.filter(t => t.flotilla_id === selectedFlotilla);

    return relevantTransactions.filter(t => !t.approved_by);
  };

  const getRecentTransactions = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const relevantTransactions = selectedFlotilla === 'all' 
      ? transactions
      : transactions.filter(t => t.flotilla_id === selectedFlotilla);

    return relevantTransactions.filter(t => new Date(t.transaction_date) >= thirtyDaysAgo);
  };

  const budgetAlerts = getBudgetAlerts();
  const pendingApprovals = getPendingApprovals();
  const recentTransactions = getRecentTransactions();

  const handleDrillDown = (type) => {
    setDrillDownType(type);
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleAlertClick = (alert) => {
    const flotilla = flotillas.find(f => f.id === alert.flotillaId);
    const flotillaTransactions = transactions.filter(
      t => t.flotilla_id === alert.flotillaId && 
      new Date(t.transaction_date).getFullYear() === currentYear
    );

    const totalIncome = flotillaTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalExpenses = flotillaTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const budget = budgets.find(b => b.flotilla_id === alert.flotillaId && b.budget_year === currentYear);
    
    setSelectedAlert({
      ...alert,
      flotilla,
      totalIncome,
      totalExpenses,
      budget,
      transactions: flotillaTransactions
    });
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Budget Alerts */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Budget Alerts
              </CardTitle>
              <Badge variant={budgetAlerts.length > 0 ? "destructive" : "secondary"}>
                {budgetAlerts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {budgetAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-sm text-slate-600">All budgets are healthy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgetAlerts.slice(0, 3).map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${getSeverityColor(alert.type)} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-xs mt-1">{alert.message}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                  </div>
                ))}
                {budgetAlerts.length > 3 && (
                  <p className="text-xs text-slate-500 text-center pt-2">
                    +{budgetAlerts.length - 3} more alerts
                  </p>
                )}
                <Link to={createPageUrl("Budgets")}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View All Budgets
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
                onClick={() => handleDrillDown('pending')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      Pending Approvals
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-slate-600">Transactions awaiting review</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-600">{pendingApprovals.length}</span>
              </div>

              <div 
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group"
                onClick={() => handleDrillDown('recent')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      Recent Transactions
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-slate-600">Last 30 days</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{recentTransactions.length}</span>
              </div>

              <Link to={createPageUrl("Transactions")}>
                <Button variant="outline" size="sm" className="w-full">
                  View All Transactions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Budget Details - {selectedAlert?.flotilla?.flotilla_number} {selectedAlert?.flotilla?.flotilla_name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Budget Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-slate-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ${formatCurrency(selectedAlert?.totalIncome)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${formatCurrency(selectedAlert?.totalExpenses)}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${(selectedAlert?.totalIncome || 0) - (selectedAlert?.totalExpenses || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm text-slate-600">Net Income</p>
                <p className={`text-2xl font-bold ${(selectedAlert?.totalIncome || 0) - (selectedAlert?.totalExpenses || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${formatCurrency((selectedAlert?.totalIncome || 0) - (selectedAlert?.totalExpenses || 0))}
                </p>
              </div>
            </div>

            {/* Budget Categories */}
            {selectedAlert?.budget && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Budget vs Actual by Category</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Budgeted</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(selectedAlert.budget.expense_budget || {}).map(([category, budgeted]) => {
                      const actual = selectedAlert.transactions
                        .filter(t => t.transaction_type === 'expense' && t.category === category)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                      const variance = budgeted - actual;
                      
                      return (
                        <TableRow key={category}>
                          <TableCell className="font-medium">
                            {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableCell>
                          <TableCell className="text-right">${formatCurrency(budgeted)}</TableCell>
                          <TableCell className="text-right">${formatCurrency(actual)}</TableCell>
                          <TableCell className={`text-right font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${formatCurrency(variance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link to={createPageUrl("Budgets")}>
                <Button variant="outline">View All Budgets</Button>
              </Link>
              <Link to={createPageUrl("Transactions")}>
                <Button className="bg-blue-600 hover:bg-blue-700">View Transactions</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={drillDownType === 'pending'} onOpenChange={() => setDrillDownType(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pending Approvals ({pendingApprovals.length})
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {pendingApprovals.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No pending approvals</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flotilla</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map(t => {
                    const flotilla = flotillas.find(f => f.id === t.flotilla_id);
                    return (
                      <TableRow 
                        key={t.id} 
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(createPageUrl("Transactions") + `?edit=${t.id}`)}
                      >
                        <TableCell>
                          <Badge variant="outline">{flotilla?.flotilla_number || 'N/A'}</Badge>
                        </TableCell>
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
                          );
                          })}
                          </TableBody>
                          </Table>
                          )}
                          <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Pending Amount:</span>
                          <span className="text-lg font-bold">
                          ${formatCurrency(pendingApprovals.reduce((sum, t) => sum + (t.amount || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={drillDownType === 'recent'} onOpenChange={() => setDrillDownType(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Recent Transactions ({recentTransactions.length}) - Last 30 Days
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No recent transactions</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flotilla</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map(t => {
                    const flotilla = flotillas.find(f => f.id === t.flotilla_id);
                    return (
                      <TableRow 
                        key={t.id}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(createPageUrl("Transactions") + `?edit=${t.id}`)}
                      >
                        <TableCell>
                          <Badge variant="outline">{flotilla?.flotilla_number || 'N/A'}</Badge>
                        </TableCell>
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
                          );
                          })}
                          </TableBody>
                          </Table>
                          )}
                          <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                          <p className="text-sm text-slate-600">Total Income</p>
                          <p className="text-lg font-bold text-green-600">
                          ${formatCurrency(recentTransactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0))}
                          </p>
                          </div>
                          <div className="text-center">
                          <p className="text-sm text-slate-600">Total Expenses</p>
                          <p className="text-lg font-bold text-red-600">
                          ${formatCurrency(recentTransactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0))}
                          </p>
                          </div>
                          <div className="text-center">
                          <p className="text-sm text-slate-600">Net</p>
                          <p className="text-lg font-bold text-blue-600">
                          ${formatCurrency(recentTransactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0) - 
                          recentTransactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}