import React, { useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AIFinancialInsights from "./AIFinancialInsights";

export default function ProfitLossStatement({ transactions, flotillaName, reportMonth, budgets = [] }) {
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

  const calculateProfitLoss = () => {
    const incomeByCategory = {};
    transactions
      .filter(t => t.transaction_type === 'income')
      .forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + (t.amount || 0);
      });

    const expensesByCategory = {};
    transactions
      .filter(t => t.transaction_type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + (t.amount || 0);
      });

    const totalIncome = Object.values(incomeByCategory).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      income: incomeByCategory,
      expenses: expensesByCategory,
      totalIncome,
      totalExpenses,
      netIncome
    };
  };

  const pl = calculateProfitLoss();
  const [year, month] = reportMonth.split('-');
  const reportDate = new Date(parseInt(year), parseInt(month) - 1);

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <AIFinancialInsights
        reportType="profit-loss"
        transactions={transactions}
        budgets={budgets}
        flotillaName={flotillaName}
        reportMonth={reportMonth}
      />

      <div className="text-center border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900">Profit & Loss Statement</h2>
        <p className="text-sm text-slate-500">(Statement of Activities)</p>
        <p className="text-lg font-semibold text-blue-600 mt-2">{flotillaName}</p>
        <p className="text-slate-600 mt-1">
          For the Month Ended {format(reportDate, 'MMMM d, yyyy')}
        </p>
        <Badge variant="outline" className="mt-2">Cash Basis</Badge>
      </div>

      <div className="space-y-8">
        {/* Income */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-emerald-50 p-3 rounded-lg">REVENUE</h3>
          <Table>
            <TableBody>
              {Object.entries(pl.income).length > 0 ? (
                Object.entries(pl.income).map(([category, amount]) => (
                  <TableRow 
                    key={category}
                    className="cursor-pointer hover:bg-emerald-50 transition-colors"
                    onClick={() => setDrillDownData({ 
                      title: `${categoryDisplayNames[category] || category} - Income Transactions`,
                      transactions: transactions.filter(t => t.transaction_type === 'income' && t.category === category)
                    })}
                  >
                    <TableCell className="font-medium pl-8">
                      {categoryDisplayNames[category] || category}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                      {((amount / pl.totalIncome) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="pl-8 text-slate-500">No revenue this period</TableCell>
                  <TableCell className="text-right text-slate-500">$0.00</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              <TableRow className="bg-emerald-50 border-t-2 border-emerald-200">
                <TableCell className="font-bold">Total Revenue</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${pl.totalIncome.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Expenses */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 bg-red-50 p-3 rounded-lg">EXPENSES</h3>
          <Table>
            <TableBody>
              {Object.entries(pl.expenses).length > 0 ? (
                Object.entries(pl.expenses).map(([category, amount]) => (
                  <TableRow 
                    key={category}
                    className="cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => setDrillDownData({ 
                      title: `${categoryDisplayNames[category] || category} - Expense Transactions`,
                      transactions: transactions.filter(t => t.transaction_type === 'expense' && t.category === category)
                    })}
                  >
                    <TableCell className="font-medium pl-8">
                      {categoryDisplayNames[category] || category}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                      {pl.totalIncome > 0 ? ((amount / pl.totalIncome) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="pl-8 text-slate-500">No expenses this period</TableCell>
                  <TableCell className="text-right text-slate-500">$0.00</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              <TableRow className="bg-red-50 border-t-2 border-red-200">
                <TableCell className="font-bold">Total Expenses</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${pl.totalExpenses.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {pl.totalIncome > 0 ? ((pl.totalExpenses / pl.totalIncome) * 100).toFixed(1) : '0.0'}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Net Income */}
        <div className="border-t-4 border-blue-600 pt-4">
          <Table>
            <TableBody>
              <TableRow className={`${pl.netIncome >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <TableCell className="font-bold text-lg">
                  NET {pl.netIncome >= 0 ? 'SURPLUS' : 'DEFICIT'}
                </TableCell>
                <TableCell className={`text-right font-bold text-xl ${pl.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Math.abs(pl.netIncome).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {pl.totalIncome > 0 ? ((pl.netIncome / pl.totalIncome) * 100).toFixed(1) : '0.0'}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
        <p>* This profit & loss statement shows all revenue and expenses for the period</p>
        <p>* Percentages are calculated as a percentage of total revenue</p>
        <p>* Net surplus/(deficit) represents the change in net assets for the period</p>
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