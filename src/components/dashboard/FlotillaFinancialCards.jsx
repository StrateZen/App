import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Eye, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth } from "date-fns";

export default function FlotillaFinancialCards({ flotillas, transactions, budgets, isLoading }) {
  const getCurrentMonthData = (flotillaId) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const flotillaTransactions = transactions.filter(t => 
      t.flotilla_id === flotillaId &&
      new Date(t.transaction_date) >= monthStart &&
      new Date(t.transaction_date) <= monthEnd
    );

    const income = flotillaTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = flotillaTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const budget = budgets.find(b => 
      b.flotilla_id === flotillaId && 
      b.budget_year === now.getFullYear()
    );

    return { income, expenses, budget, transactionCount: flotillaTransactions.length };
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Flotilla Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-slate-900">Flotilla Financial Overview</CardTitle>
          <Badge variant="outline" className="text-slate-600">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {flotillas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Flotillas Yet</h3>
            <p className="text-slate-500 mb-4">Add flotillas to start tracking their finances.</p>
            <Link to={createPageUrl("Flotillas")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Add First Flotilla
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flotillas.map((flotilla) => {
              const { income, expenses, budget, transactionCount } = getCurrentMonthData(flotilla.id);
              const netIncome = income - expenses;
              const hasActivity = transactionCount > 0;

              return (
                <div key={flotilla.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{flotilla.flotilla_number}</h3>
                      <p className="text-slate-600 text-sm">{flotilla.flotilla_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActivity ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <Badge variant={hasActivity ? "default" : "secondary"} className="text-xs">
                        {transactionCount} txns
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Income</span>
                      <span className="font-semibold text-emerald-600">
                        ${income.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Expenses</span>
                      <span className="font-semibold text-red-600">
                        ${expenses.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Net</span>
                      <span className={`font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ${netIncome.toFixed(2)}
                      </span>
                    </div>

                    {budget && (
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-500">Budget Status</span>
                          <Badge 
                            variant="outline" 
                            className={budget.approved ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}
                          >
                            {budget.approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link to={createPageUrl(`FlotillaDetail?id=${flotilla.id}`)}>
                      <Button variant="outline" size="sm" className="w-full gap-2 hover:bg-blue-50 hover:border-blue-300">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}