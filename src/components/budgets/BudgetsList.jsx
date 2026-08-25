import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, PiggyBank, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function BudgetsList({ budgets, flotillas, isLoading, onEdit, onDelete }) {
  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `${flotilla.flotilla_number} - ${flotilla.flotilla_name}` : 'Unknown';
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-20" />
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
        <CardTitle className="text-xl font-semibold text-slate-900">
          Budgets ({budgets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <PiggyBank className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Budgets Yet</h3>
            <p className="text-slate-500">Create your first budget to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const totalIncome = Object.values(budget.income_budget || {}).reduce((sum, val) => sum + val, 0);
              const totalExpense = Object.values(budget.expense_budget || {}).reduce((sum, val) => sum + val, 0);
              const netBudget = totalIncome - totalExpense;

              return (
                <div key={budget.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        FY {budget.budget_year}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {getFlotillaName(budget.flotilla_id)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {budget.approved ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <Badge variant={budget.approved ? "default" : "secondary"}>
                        {budget.approved ? "Approved" : "Draft"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Income Budget</span>
                      <span className="font-semibold text-emerald-600">
                        ${formatCurrency(totalIncome)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Expense Budget</span>
                      <span className="font-semibold text-red-600">
                        ${formatCurrency(totalExpense)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-700">Net Budget</span>
                      <span className={`font-bold ${netBudget >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ${formatCurrency(Math.abs(netBudget))}
                      </span>
                    </div>

                    <div className="pt-2 text-xs text-slate-500">
                      <p>{format(new Date(budget.period_start), 'MMM d, yyyy')} - {format(new Date(budget.period_end), 'MMM d, yyyy')}</p>
                      {budget.approved_by && (
                        <p className="mt-1">Approved by: {budget.approved_by}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(budget)}
                      className="flex-1 gap-2 hover:bg-amber-50 hover:border-amber-300"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(budget)}
                      className="gap-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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