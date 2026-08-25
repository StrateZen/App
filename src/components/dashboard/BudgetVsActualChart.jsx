import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const FLOTILLA_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function BudgetVsActualChart({ transactions, budgets, selectedFlotilla = 'all', flotillas = [] }) {
  const currentYear = new Date().getFullYear();
  const [drillDownData, setDrillDownData] = useState(null);

  const getBudgetVsActualData = () => {
    const filtered = selectedFlotilla === 'all' 
      ? budgets.filter(b => b.budget_year === currentYear)
      : budgets.filter(b => b.budget_year === currentYear && b.flotilla_id === selectedFlotilla);

    if (filtered.length === 0) return [];

    if (selectedFlotilla === 'all') {
      // Build flotilla-specific budget and actuals
      const combinedBudget = {};
      const flotillaData = {};

      filtered.forEach(budget => {
        Object.entries(budget.expense_budget || {}).forEach(([category, amount]) => {
          if (!combinedBudget[category]) {
            combinedBudget[category] = 0;
            flotillaData[category] = {};
          }
          combinedBudget[category] += amount;
          flotillaData[category][`budgeted_${budget.flotilla_id}`] = (flotillaData[category][`budgeted_${budget.flotilla_id}`] || 0) + amount;
        });
      });

      // Calculate actual spending by flotilla and category
      const yearTransactions = transactions.filter(t => 
        new Date(t.transaction_date).getFullYear() === currentYear && t.transaction_type === 'expense'
      );

      yearTransactions.forEach(t => {
        const category = t.category;
        if (!flotillaData[category]) flotillaData[category] = {};
        flotillaData[category][`actual_${t.flotilla_id}`] = (flotillaData[category][`actual_${t.flotilla_id}`] || 0) + (t.amount || 0);
      });

      const categories = Object.keys(combinedBudget);
      return categories.map(category => ({
        category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        budgeted: combinedBudget[category] || 0,
        ...flotillaData[category]
      })).sort((a, b) => b.budgeted - a.budgeted).slice(0, 8);
    } else {
      // Single flotilla - original logic
      const combinedBudget = filtered.reduce((acc, budget) => {
        Object.entries(budget.expense_budget || {}).forEach(([category, amount]) => {
          acc[category] = (acc[category] || 0) + amount;
        });
        return acc;
      }, {});

      const yearTransactions = transactions.filter(t => 
        new Date(t.transaction_date).getFullYear() === currentYear && 
        t.transaction_type === 'expense' &&
        t.flotilla_id === selectedFlotilla
      );

      const actualSpending = {};
      yearTransactions.forEach(t => {
        const category = t.category;
        actualSpending[category] = (actualSpending[category] || 0) + (t.amount || 0);
      });

      const categories = Object.keys(combinedBudget);
      return categories.map(category => ({
        category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        budgeted: combinedBudget[category] || 0,
        actual: actualSpending[category] || 0
      })).sort((a, b) => b.budgeted - a.budgeted).slice(0, 8);
    }
  };

  const data = getBudgetVsActualData();

  const handleBarClick = (data, flotillaId = null, type = null) => {
    const categoryKey = data.category.toLowerCase().replace(/ /g, '_');
    
    let yearTransactions = transactions.filter(t => 
      new Date(t.transaction_date).getFullYear() === currentYear && 
      t.transaction_type === 'expense' &&
      t.category === categoryKey
    );

    // Filter by flotilla if specified
    if (flotillaId) {
      yearTransactions = yearTransactions.filter(t => t.flotilla_id === flotillaId);
    } else if (selectedFlotilla !== 'all') {
      yearTransactions = yearTransactions.filter(t => t.flotilla_id === selectedFlotilla);
    }

    const flotilla = flotillaId ? flotillas.find(f => f.id === flotillaId) : null;
    const budgetedAmount = flotillaId ? (data[`budgeted_${flotillaId}`] || 0) : data.budgeted;
    const actualAmount = flotillaId ? (data[`actual_${flotillaId}`] || 0) : data.actual;

    setDrillDownData({
      category: data.category,
      budgeted: budgetedAmount,
      actual: actualAmount,
      flotilla: flotilla ? `${flotilla.flotilla_number}` : null,
      transactions: yearTransactions
    });
  };

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Budget vs Actual Spending - FY {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No budget data available for {currentYear}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis dataKey="category" type="category" width={120} style={{ fontSize: '11px' }} />
                <Tooltip 
                  formatter={(value) => `$${(value || 0).toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  offset={80}
                  position={{ y: -80 }}
                />
                <Legend />
                
                {selectedFlotilla === 'all' ? (
                  // Stacked bars by flotilla
                  <>
                    {flotillas.map((f, idx) => (
                      <React.Fragment key={f.id}>
                        <Bar 
                          dataKey={`budgeted_${f.id}`}
                          stackId="budgeted"
                          fill={FLOTILLA_COLORS[idx % FLOTILLA_COLORS.length]}
                          name={`${f.flotilla_number} Budget`}
                          radius={[0, 4, 4, 0]}
                          onClick={(data) => handleBarClick(data, f.id, 'budgeted')}
                          cursor="pointer"
                        />
                      </React.Fragment>
                    ))}
                    {flotillas.map((f, idx) => (
                      <React.Fragment key={f.id}>
                        <Bar 
                          dataKey={`actual_${f.id}`}
                          stackId="actual"
                          fill={FLOTILLA_COLORS[idx % FLOTILLA_COLORS.length]}
                          name={`${f.flotilla_number} Actual`}
                          radius={[0, 4, 4, 0]}
                          onClick={(data) => handleBarClick(data, f.id, 'actual')}
                          cursor="pointer"
                          opacity={0.7}
                        />
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  // Single flotilla view
                  <>
                    <Bar 
                      dataKey="budgeted" 
                      fill="#3b82f6" 
                      name="Budgeted" 
                      radius={[0, 8, 8, 0]}
                      onClick={handleBarClick}
                      cursor="pointer"
                    />
                    <Bar 
                      dataKey="actual" 
                      fill="#f59e0b" 
                      name="Actual" 
                      radius={[0, 8, 8, 0]}
                      onClick={handleBarClick}
                      cursor="pointer"
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {drillDownData?.category} - FY {currentYear}
              {drillDownData?.flotilla && ` - Flotilla ${drillDownData.flotilla}`}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Budgeted Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(drillDownData?.budgeted || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Actual Spent</p>
                <p className="text-2xl font-bold text-amber-600">
                  ${(drillDownData?.actual || 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            {drillDownData?.transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor/Payee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDownData?.transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.vendor_payee || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(t.amount || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}