import React, { useState } from 'react';
import { format, startOfYear, endOfYear } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import AIFinancialInsights from "./AIFinancialInsights";

export default function BudgetVarianceReport({ transactions, budgets, flotillaId, flotillaName, reportMonth, allFlotillas }) {
  const [drillDownData, setDrillDownData] = useState(null);
  
  const categoryDisplayNames = {
    membership_dues: "Membership Dues",
    donations: "Donations",
    fundraising_events: "Fundraising Events",
    grants: "Grants",
    boat_maintenance: "Boat Maintenance",
    fuel_costs: "Fuel Costs",
    training_materials: "Training Materials",
    communications_equipment: "Communications Equipment",
    safety_equipment: "Safety Equipment",
    meeting_expenses: "Meeting Expenses",
    administrative_costs: "Administrative Costs",
    uniforms_insignia: "Uniforms & Insignia",
    public_education: "Public Education",
    vessel_examination_supplies: "Vessel Examination Supplies",
    event_costs: "Event Costs",
    office_supplies: "Office Supplies",
    other: "Other"
  };

  const calculateVariances = () => {
    const [year, month] = reportMonth.split('-');
    const currentYear = parseInt(year);
    
    // Get relevant budgets
    let relevantBudgets = budgets.filter(b => b.budget_year === currentYear);
    if (!allFlotillas && flotillaId !== 'all') {
      relevantBudgets = relevantBudgets.filter(b => b.flotilla_id === flotillaId);
    }

    // Aggregate budgets if viewing all flotillas
    const aggregatedBudget = {
      income: {},
      expense: {}
    };

    relevantBudgets.forEach(budget => {
      Object.entries(budget.income_budget || {}).forEach(([category, amount]) => {
        aggregatedBudget.income[category] = (aggregatedBudget.income[category] || 0) + amount;
      });
      Object.entries(budget.expense_budget || {}).forEach(([category, amount]) => {
        aggregatedBudget.expense[category] = (aggregatedBudget.expense[category] || 0) + amount;
      });
    });

    // Calculate actuals YTD
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));
    
    const ytdTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= yearStart && transactionDate <= yearEnd;
    });

    const actualIncome = {};
    const actualExpenses = {};

    ytdTransactions
      .filter(t => t.transaction_type === 'income')
      .forEach(t => {
        actualIncome[t.category] = (actualIncome[t.category] || 0) + (t.amount || 0);
      });

    ytdTransactions
      .filter(t => t.transaction_type === 'expense')
      .forEach(t => {
        actualExpenses[t.category] = (actualExpenses[t.category] || 0) + (t.amount || 0);
      });

    // Calculate variances
    const incomeVariances = {};
    Object.keys({...aggregatedBudget.income, ...actualIncome}).forEach(category => {
      const budgeted = aggregatedBudget.income[category] || 0;
      const actual = actualIncome[category] || 0;
      const variance = actual - budgeted;
      const percentVariance = budgeted > 0 ? ((variance / budgeted) * 100) : 0;
      
      incomeVariances[category] = {
        budgeted,
        actual,
        variance,
        percentVariance,
        status: variance >= 0 ? 'favorable' : 'unfavorable'
      };
    });

    const expenseVariances = {};
    Object.keys({...aggregatedBudget.expense, ...actualExpenses}).forEach(category => {
      const budgeted = aggregatedBudget.expense[category] || 0;
      const actual = actualExpenses[category] || 0;
      const variance = budgeted - actual;
      const percentVariance = budgeted > 0 ? ((variance / budgeted) * 100) : 0;
      
      expenseVariances[category] = {
        budgeted,
        actual,
        variance,
        percentVariance,
        status: variance >= 0 ? 'favorable' : 'unfavorable'
      };
    });

    const totalIncomeBudget = Object.values(aggregatedBudget.income).reduce((sum, val) => sum + val, 0);
    const totalIncomeActual = Object.values(actualIncome).reduce((sum, val) => sum + val, 0);
    const totalExpenseBudget = Object.values(aggregatedBudget.expense).reduce((sum, val) => sum + val, 0);
    const totalExpenseActual = Object.values(actualExpenses).reduce((sum, val) => sum + val, 0);

    return {
      incomeVariances,
      expenseVariances,
      totalIncomeBudget,
      totalIncomeActual,
      totalIncomeVariance: totalIncomeActual - totalIncomeBudget,
      totalExpenseBudget,
      totalExpenseActual,
      totalExpenseVariance: totalExpenseBudget - totalExpenseActual,
      netBudget: totalIncomeBudget - totalExpenseBudget,
      netActual: totalIncomeActual - totalExpenseActual
    };
  };

  const variances = calculateVariances();
  const [year, month] = reportMonth.split('-');
  const reportDate = new Date(parseInt(year), parseInt(month) - 1);

  const getStatusIcon = (status) => {
    return status === 'favorable' ? (
      <CheckCircle className="w-4 h-4 text-emerald-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-amber-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <AIFinancialInsights
        reportType="budget-variance"
        transactions={transactions}
        budgets={budgets}
        flotillaName={flotillaName}
        reportMonth={reportMonth}
      />

      <div className="text-center border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900">Budget vs Actuals Variance Report</h2>
        <p className="text-lg font-semibold text-blue-600 mt-2">{flotillaName}</p>
        <p className="text-slate-600 mt-1">
          Year-to-Date through {format(reportDate, 'MMMM d, yyyy')}
        </p>
        <Badge variant="outline" className="mt-2">Fiscal Year {year}</Badge>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-slate-900">
            ${variances.netBudget.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Actual YTD</p>
          <p className="text-2xl font-bold text-blue-600">
            ${variances.netActual.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Net Variance</p>
          <p className={`text-2xl font-bold ${(variances.netActual - variances.netBudget) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${Math.abs(variances.netActual - variances.netBudget).toFixed(2)}
            {(variances.netActual - variances.netBudget) >= 0 ? ' ↑' : ' ↓'}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Income Variances */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-emerald-50 p-3 rounded-lg">
            REVENUE BUDGET vs ACTUALS
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual YTD</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(variances.incomeVariances).map(([category, data]) => {
                const [year] = reportMonth.split('-');
                const yearStart = startOfYear(new Date(parseInt(year), 0, 1));
                const yearEnd = endOfYear(new Date(parseInt(year), 11, 31));
                const categoryTransactions = transactions.filter(t => {
                  const tDate = new Date(t.transaction_date);
                  return t.transaction_type === 'income' && t.category === category && tDate >= yearStart && tDate <= yearEnd;
                });
                
                return (
                  <TableRow 
                    key={category}
                    className="cursor-pointer hover:bg-emerald-50 transition-colors"
                    onClick={() => setDrillDownData({ 
                      title: `${categoryDisplayNames[category] || category} - Income YTD`,
                      transactions: categoryTransactions,
                      budgeted: data.budgeted,
                      actual: data.actual,
                      variance: data.variance
                    })}
                  >
                    <TableCell className="font-medium">
                      {categoryDisplayNames[category] || category}
                    </TableCell>
                    <TableCell className="text-right">${data.budgeted.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${data.actual.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${data.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${Math.abs(data.variance).toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${data.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {data.percentVariance.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusIcon(data.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-emerald-50 border-t-2 border-emerald-200">
                <TableCell className="font-bold">Total Revenue</TableCell>
                <TableCell className="text-right font-bold">${variances.totalIncomeBudget.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">${variances.totalIncomeActual.toFixed(2)}</TableCell>
                <TableCell className={`text-right font-bold ${variances.totalIncomeVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Math.abs(variances.totalIncomeVariance).toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-bold ${variances.totalIncomeVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {variances.totalIncomeBudget > 0 ? ((variances.totalIncomeVariance / variances.totalIncomeBudget) * 100).toFixed(1) : '0.0'}%
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Expense Variances */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-red-50 p-3 rounded-lg">
            EXPENSE BUDGET vs ACTUALS
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual YTD</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(variances.expenseVariances).map(([category, data]) => {
                const [year] = reportMonth.split('-');
                const yearStart = startOfYear(new Date(parseInt(year), 0, 1));
                const yearEnd = endOfYear(new Date(parseInt(year), 11, 31));
                const categoryTransactions = transactions.filter(t => {
                  const tDate = new Date(t.transaction_date);
                  return t.transaction_type === 'expense' && t.category === category && tDate >= yearStart && tDate <= yearEnd;
                });
                
                return (
                  <TableRow 
                    key={category}
                    className="cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => setDrillDownData({ 
                      title: `${categoryDisplayNames[category] || category} - Expenses YTD`,
                      transactions: categoryTransactions,
                      budgeted: data.budgeted,
                      actual: data.actual,
                      variance: data.variance
                    })}
                  >
                    <TableCell className="font-medium">
                      {categoryDisplayNames[category] || category}
                    </TableCell>
                    <TableCell className="text-right">${data.budgeted.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${data.actual.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${data.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${Math.abs(data.variance).toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right ${data.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {data.percentVariance.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusIcon(data.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-red-50 border-t-2 border-red-200">
                <TableCell className="font-bold">Total Expenses</TableCell>
                <TableCell className="text-right font-bold">${variances.totalExpenseBudget.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">${variances.totalExpenseActual.toFixed(2)}</TableCell>
                <TableCell className={`text-right font-bold ${variances.totalExpenseVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Math.abs(variances.totalExpenseVariance).toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-bold ${variances.totalExpenseVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {variances.totalExpenseBudget > 0 ? ((variances.totalExpenseVariance / variances.totalExpenseBudget) * 100).toFixed(1) : '0.0'}%
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
        <p>* Favorable variance for revenue = Actual exceeds Budget</p>
        <p>* Favorable variance for expenses = Actual is less than Budget</p>
        <p>* All figures represent year-to-date amounts through the selected month</p>
      </div>

      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drillDownData?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Budgeted</p>
                <p className="text-xl font-bold">${drillDownData?.budgeted?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Actual YTD</p>
                <p className="text-xl font-bold text-blue-600">${drillDownData?.actual?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Variance</p>
                <p className={`text-xl font-bold ${(drillDownData?.variance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Math.abs(drillDownData?.variance || 0).toFixed(2)}
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
                {drillDownData?.transactions?.map(t => (
                  <TableRow key={t.id}>
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
                      ${(t.amount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}