import React, { useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AIFinancialInsights from "./AIFinancialInsights";

export default function BalanceSheet({ transactions, flotillaName, reportMonth, budgets = [] }) {
  const [drillDownData, setDrillDownData] = useState(null);
  const calculateBalances = () => {
    const totalIncome = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const cashOnHand = totalIncome - totalExpenses;

    return {
      assets: {
        cash: cashOnHand,
        total: cashOnHand
      },
      liabilities: {
        total: 0
      },
      equity: {
        retainedEarnings: cashOnHand,
        total: cashOnHand
      }
    };
  };

  const balances = calculateBalances();
  const [year, month] = reportMonth.split('-');
  const reportDate = new Date(parseInt(year), parseInt(month) - 1);

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <AIFinancialInsights
        reportType="balance-sheet"
        transactions={transactions}
        budgets={budgets}
        flotillaName={flotillaName}
        reportMonth={reportMonth}
      />

      <div className="text-center border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900">Balance Sheet</h2>
        <p className="text-lg font-semibold text-blue-600 mt-2">{flotillaName}</p>
        <p className="text-slate-600 mt-1">
          As of {format(reportDate, 'MMMM d, yyyy')}
        </p>
        <Badge variant="outline" className="mt-2">Cash Basis</Badge>
      </div>

      <div className="space-y-8">
        {/* Assets */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-blue-50 p-3 rounded-lg">ASSETS</h3>
          <Table>
            <TableBody>
              <TableRow 
                className="cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => setDrillDownData({ title: 'Cash on Hand - All Transactions', transactions })}
              >
                <TableCell className="font-medium pl-8">Cash on Hand</TableCell>
                <TableCell className="text-right font-medium">
                  ${balances.assets.cash.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="font-bold">Total Assets</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${balances.assets.total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Liabilities */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-red-50 p-3 rounded-lg">LIABILITIES</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium pl-8 text-slate-500">No Outstanding Liabilities</TableCell>
                <TableCell className="text-right font-medium">$0.00</TableCell>
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="font-bold">Total Liabilities</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${balances.liabilities.total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Equity */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-emerald-50 p-3 rounded-lg">EQUITY</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium pl-8">Retained Earnings (Net Assets)</TableCell>
                <TableCell className="text-right font-medium">
                  ${balances.equity.retainedEarnings.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="font-bold">Total Equity</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${balances.equity.total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Balance Check */}
        <div className="border-t-4 border-blue-600 pt-4">
          <Table>
            <TableBody>
              <TableRow className="bg-blue-50">
                <TableCell className="font-bold text-lg">TOTAL LIABILITIES & EQUITY</TableCell>
                <TableCell className="text-right font-bold text-xl text-blue-600">
                  ${(balances.liabilities.total + balances.equity.total).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
        <p>* This balance sheet is prepared on a cash basis</p>
        <p>* Cash on Hand represents total income received less total expenses paid through {format(reportDate, 'MMMM d, yyyy')}</p>
      </div>

      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drillDownData?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
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