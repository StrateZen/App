import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PiggyBank, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfYear, endOfYear } from "date-fns";

export default function BudgetOverview({ budgets, transactions, isLoading }) {
  const getBudgetProgress = (budget) => {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    // Get transactions for this budget's year and flotilla
    const budgetTransactions = transactions.filter(t => 
      t.flotilla_id === budget.flotilla_id &&
      new Date(t.transaction_date) >= yearStart &&
      new Date(t.transaction_date) <= yearEnd
    );

    // Calculate actual expenses by category
    const actualExpenses = {};
    budgetTransactions
      .filter(t => t.transaction_type === 'expense')
      .forEach(t => {
        actualExpenses[t.category] = (actualExpenses[t.category] || 0) + (t.amount || 0);
      });

    // Calculate budget vs actual for each category
    const budgetItems = [];
    const expenseBudget = budget.expense_budget || {};
    
    Object.keys(expenseBudget).forEach(category => {
      const budgetAmount = expenseBudget[category] || 0;
      const actualAmount = actualExpenses[category] || 0;
      const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;
      
      if (budgetAmount > 0) {
        budgetItems.push({
          category,
          budgetAmount,
          actualAmount,
          percentage,
          overBudget: percentage > 100
        });
      }
    });

    return budgetItems.sort((a, b) => b.percentage - a.percentage);
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Budget Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentYearBudgets = budgets.filter(b => b.budget_year === new Date().getFullYear());
  
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-slate-900">Budget Performance</CardTitle>
          <Link to={createPageUrl("Budgets")}>
            <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-50 hover:border-blue-300">
              <PiggyBank className="w-4 h-4" />
              Manage Budgets
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {currentYearBudgets.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <PiggyBank className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Budgets for {new Date().getFullYear()}</h3>
            <p className="text-slate-500 mb-4">Create budgets for your flotillas to track performance.</p>
            <Link to={createPageUrl("Budgets")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create First Budget
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {currentYearBudgets.slice(0, 3).map((budget) => {
              const budgetItems = getBudgetProgress(budget);
              const topCategories = budgetItems.slice(0, 3);
              
              return (
                <div key={budget.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">Budget Performance</h4>
                      <p className="text-sm text-slate-600">
                        Year {budget.budget_year} • Top spending categories
                      </p>
                    </div>
                    <Badge 
                      variant={budget.approved ? "default" : "secondary"}
                      className={budget.approved ? "bg-emerald-100 text-emerald-700" : ""}
                    >
                      {budget.approved ? "Approved" : "Draft"}
                    </Badge>
                  </div>
                  
                  {topCategories.length === 0 ? (
                    <p className="text-slate-500 text-sm">No spending activity yet</p>
                  ) : (
                    <div className="space-y-3">
                      {topCategories.map((item) => (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {item.category.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.overBudget && (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              <span className="text-sm text-slate-600">
                                ${item.actualAmount.toFixed(0)} / ${item.budgetAmount.toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(item.percentage, 100)} 
                            className={`h-2 ${item.overBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                          />
                          <div className="flex justify-between items-center">
                            <span className={`text-xs ${item.overBudget ? 'text-red-600' : 'text-slate-500'}`}>
                              {item.percentage.toFixed(1)}% of budget used
                            </span>
                            {item.overBudget && (
                              <Badge variant="destructive" className="text-xs">
                                Over Budget
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}