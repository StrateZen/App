import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function FlotillaBreakdownReport({ transactions, flotillas, selectedMonth, allFlotillas }) {
  // For this report, we should show ALL flotillas regardless of filter
  const displayFlotillas = allFlotillas || flotillas;
  
  // Group transactions by flotilla
  const flotillaGroups = displayFlotillas.map(flotilla => {
    const flotillaTransactions = transactions.filter(t => t.flotilla_id === flotilla.id);
    
    const totalIncome = flotillaTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalExpenses = flotillaTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const netIncome = totalIncome - totalExpenses;

    return {
      flotilla,
      transactions: flotillaTransactions,
      totalIncome,
      totalExpenses,
      netIncome,
      transactionCount: flotillaTransactions.length
    };
  }).filter(group => group.transactionCount > 0);

  // Calculate division totals
  const divisionTotalIncome = flotillaGroups.reduce((sum, g) => sum + g.totalIncome, 0);
  const divisionTotalExpenses = flotillaGroups.reduce((sum, g) => sum + g.totalExpenses, 0);
  const divisionNetIncome = divisionTotalIncome - divisionTotalExpenses;
  const divisionTransactionCount = flotillaGroups.reduce((sum, g) => sum + g.transactionCount, 0);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-900">
            Division 10 - Flotilla Financial Breakdown
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Detailed breakdown by flotilla with subtotals
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {flotillaGroups.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No transactions found for the selected period
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {flotillaGroups.map((group, index) => (
                <div key={group.flotilla.id} className="p-6">
                  {/* Flotilla Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {group.flotilla.flotilla_number}
                      </Badge>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {group.flotilla.flotilla_name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {group.transactionCount} transactions
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flotilla Transactions Table */}
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
                      {group.transactions.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm">
                            {new Date(t.transaction_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{t.description}</TableCell>
                          <TableCell className="text-sm">
                            {t.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableCell>
                          <TableCell>
                            <Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>
                              {t.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(t.amount || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Flotilla Subtotals */}
                  <div className="mt-4 bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Total Income</p>
                        <p className="text-lg font-bold text-green-600">
                          ${group.totalIncome.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Total Expenses</p>
                        <p className="text-lg font-bold text-red-600">
                          ${group.totalExpenses.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Net Income</p>
                        <p className={`text-lg font-bold ${
                          group.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          ${group.netIncome.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Transactions</p>
                        <p className="text-lg font-bold text-slate-900">
                          {group.transactionCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Division 10 Grand Totals */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Division 10 - Grand Totals
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-white">
                      ${divisionTotalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-white">
                      ${divisionTotalExpenses.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Net Income</p>
                    <p className="text-2xl font-bold text-white">
                      ${divisionNetIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">
                      {divisionTransactionCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}