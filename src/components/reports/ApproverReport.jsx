import React, { useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ApproverReport({ transactions, flotillaName, reportMonth }) {
  const [drillDownData, setDrillDownData] = useState(null);

  const calculateByApprover = () => {
    const approverData = {};

    transactions.forEach(t => {
      const approver = t.approved_by || 'Not Approved';
      
      if (!approverData[approver]) {
        approverData[approver] = {
          income: 0,
          expense: 0,
          transactions: []
        };
      }

      approverData[approver].transactions.push(t);
      
      if (t.transaction_type === 'income') {
        approverData[approver].income += (t.amount || 0);
      } else if (t.transaction_type === 'expense') {
        approverData[approver].expense += (t.amount || 0);
      }
    });

    return approverData;
  };

  const approverData = calculateByApprover();
  const [year, month] = reportMonth.split('-');
  const reportDate = new Date(parseInt(year), parseInt(month) - 1);

  const totalIncome = Object.values(approverData).reduce((sum, data) => sum + data.income, 0);
  const totalExpenses = Object.values(approverData).reduce((sum, data) => sum + data.expense, 0);
  const netTotal = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900">Income & Expenses by Approver</h2>
        <p className="text-lg font-semibold text-blue-600 mt-2">{flotillaName}</p>
        <p className="text-slate-600 mt-1">
          For the Month Ended {format(reportDate, 'MMMM d, yyyy')}
        </p>
        <Badge variant="outline" className="mt-2">Approval Analysis</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-1">Net Total</p>
          <p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            ${netTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Approver Breakdown Table */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 bg-slate-50 p-3 rounded-lg">
          BREAKDOWN BY APPROVER
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Approver</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-center">Transaction Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(approverData).length > 0 ? (
              Object.entries(approverData)
                .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
                .map(([approver, data]) => {
                  const net = data.income - data.expense;
                  return (
                    <TableRow 
                      key={approver}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setDrillDownData({ 
                        title: `${approver} - All Transactions`,
                        approver,
                        transactions: data.transactions,
                        income: data.income,
                        expense: data.expense,
                        net
                      })}
                    >
                      <TableCell className="font-medium">
                        {approver}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ${data.income.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        ${data.expense.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ${net.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{data.transactions.length}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
            <TableRow className="bg-slate-100 border-t-2 border-slate-300 font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right text-green-600">
                ${totalIncome.toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                ${totalExpenses.toFixed(2)}
              </TableCell>
              <TableCell className={`text-right ${netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ${netTotal.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{transactions.length}</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
        <p>* This report shows all income and expenses grouped by the approving person</p>
        <p>* "Not Approved" includes transactions that have not yet been approved</p>
        <p>* Click on any row to see detailed transactions</p>
      </div>

      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drillDownData?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Total Income</p>
                <p className="text-xl font-bold text-green-600">${drillDownData?.income?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">${drillDownData?.expense?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Net</p>
                <p className={`text-xl font-bold ${(drillDownData?.net || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ${drillDownData?.net?.toFixed(2)}
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