import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function BudgetTracker({ budgets, transactions, flotillas }) {
  const [selectedFlotilla, setSelectedFlotilla] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter budgets by selected flotilla and year
  const filteredBudgets = budgets.filter(b => {
    const matchesFlotilla = selectedFlotilla === 'all' || b.flotilla_id === selectedFlotilla;
    const matchesYear = b.budget_year === selectedYear;
    return matchesFlotilla && matchesYear;
  });

  // Get unique years from budgets
  const years = [...new Set(budgets.map(b => b.budget_year))].sort((a, b) => b - a);

  // Calculate actuals from transactions
  const calculateActuals = (flotillaId, year) => {
    const flotillaTransactions = transactions.filter(t => {
      const txDate = new Date(t.transaction_date);
      const matchesFlotilla = selectedFlotilla === 'all' ? true : t.flotilla_id === flotillaId;
      const matchesYear = txDate.getFullYear() === year;
      return matchesFlotilla && matchesYear;
    });

    const income = {};
    const expenses = {};

    flotillaTransactions.forEach(t => {
      if (t.transaction_type === 'income') {
        income[t.category] = (income[t.category] || 0) + t.amount;
      } else {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      }
    });

    return { income, expenses };
  };

  const categoryDisplayNames = {
    membership_dues: 'Membership Dues',
    donations: 'Donations',
    fundraising_events: 'Fundraising Events',
    grants: 'Grants',
    boat_maintenance: 'Boat Maintenance',
    fuel_costs: 'Fuel Costs',
    training_materials: 'Training Materials',
    communications_equipment: 'Communications Equipment',
    safety_equipment: 'Safety Equipment',
    meeting_expenses: 'Meeting Expenses',
    administrative_costs: 'Administrative Costs',
    uniforms_insignia: 'Uniforms & Insignia',
    public_education: 'Public Education',
    vessel_examination_supplies: 'Vessel Examination Supplies',
    event_costs: 'Event Costs',
    office_supplies: 'Office Supplies',
    other: 'Other'
  };

  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `${flotilla.flotilla_number} - ${flotilla.flotilla_name}` : 'Unknown';
  };

  const renderCategoryRow = (category, budgeted, actual, type) => {
    const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    const isOverBudget = actual > budgeted && budgeted > 0;
    const remaining = budgeted - actual;

    return (
      <div key={category} className={`p-4 rounded-lg border ${isOverBudget ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">
                {categoryDisplayNames[category] || category.replace(/_/g, ' ')}
              </h4>
              {isOverBudget && (
                <Badge className="bg-red-500 text-white text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">
              ${actual.toFixed(2)} / ${budgeted.toFixed(2)}
            </p>
            <p className={`text-xs font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
            </p>
          </div>
        </div>
        
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 ${isOverBudget ? 'bg-red-200' : ''}`}
        />
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-500">
            {percentage.toFixed(1)}% used
          </span>
          {isOverBudget && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {(percentage - 100).toFixed(1)}% over
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">Budget Tracking</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
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
                  <SelectItem value="all">All Flotillas</SelectItem>
                  {flotillas.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.flotilla_number} - {f.flotilla_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Fiscal Year
              </label>
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      FY {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Details */}
      {filteredBudgets.length === 0 ? (
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Budget Found</h3>
            <p className="text-slate-500">Create a budget for {selectedFlotilla === 'all' ? 'flotillas' : 'this flotilla'} in FY {selectedYear}.</p>
          </CardContent>
        </Card>
      ) : (
        filteredBudgets.map(budget => {
          const actuals = calculateActuals(budget.flotilla_id, budget.budget_year);
          
          const totalIncomeBudget = Object.values(budget.income_budget || {}).reduce((sum, val) => sum + val, 0);
          const totalIncomeActual = Object.values(actuals.income).reduce((sum, val) => sum + val, 0);
          
          const totalExpenseBudget = Object.values(budget.expense_budget || {}).reduce((sum, val) => sum + val, 0);
          const totalExpenseActual = Object.values(actuals.expenses).reduce((sum, val) => sum + val, 0);
          
          const netBudget = totalIncomeBudget - totalExpenseBudget;
          const netActual = totalIncomeActual - totalExpenseActual;
          
          const overBudgetCategories = Object.keys(budget.expense_budget || {}).filter(cat => {
            const budgeted = budget.expense_budget[cat] || 0;
            const actual = actuals.expenses[cat] || 0;
            return actual > budgeted && budgeted > 0;
          });

          return (
            <Card key={budget.id} className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-900">
                      {getFlotillaName(budget.flotilla_id)} - FY {budget.budget_year}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {format(new Date(budget.period_start), 'MMM d, yyyy')} - {format(new Date(budget.period_end), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {overBudgetCategories.length > 0 && (
                    <Badge className="bg-red-500 text-white">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {overBudgetCategories.length} Over Budget
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-emerald-700 font-medium mb-1">Total Income</p>
                          <p className="text-2xl font-bold text-emerald-900">${totalIncomeActual.toFixed(2)}</p>
                          <p className="text-xs text-emerald-600">Budget: ${totalIncomeBudget.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-red-700 font-medium mb-1">Total Expenses</p>
                          <p className="text-2xl font-bold text-red-900">${totalExpenseActual.toFixed(2)}</p>
                          <p className="text-xs text-red-600">Budget: ${totalExpenseBudget.toFixed(2)}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-700 font-medium mb-1">Net Position</p>
                          <p className={`text-2xl font-bold ${netActual >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                            ${Math.abs(netActual).toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-600">Budget: ${Math.abs(netBudget).toFixed(2)}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Income Categories */}
                {Object.keys(budget.income_budget || {}).some(cat => budget.income_budget[cat] > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Income Categories
                    </h3>
                    <div className="grid gap-4">
                      {Object.keys(budget.income_budget || {})
                        .filter(cat => budget.income_budget[cat] > 0)
                        .map(cat => renderCategoryRow(
                          cat,
                          budget.income_budget[cat],
                          actuals.income[cat] || 0,
                          'income'
                        ))}
                    </div>
                  </div>
                )}

                {/* Expense Categories */}
                {Object.keys(budget.expense_budget || {}).some(cat => budget.expense_budget[cat] > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      Expense Categories
                    </h3>
                    <div className="grid gap-4">
                      {Object.keys(budget.expense_budget || {})
                        .filter(cat => budget.expense_budget[cat] > 0)
                        .sort((a, b) => {
                          // Sort over-budget items first
                          const aOver = (actuals.expenses[a] || 0) > budget.expense_budget[a];
                          const bOver = (actuals.expenses[b] || 0) > budget.expense_budget[b];
                          if (aOver && !bOver) return -1;
                          if (!aOver && bOver) return 1;
                          return 0;
                        })
                        .map(cat => renderCategoryRow(
                          cat,
                          budget.expense_budget[cat],
                          actuals.expenses[cat] || 0,
                          'expense'
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}