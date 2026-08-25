import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const FLOTILLA_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function MonthlyIncomeExpenseChart({ transactions, flotillas, selectedFlotilla = 'all' }) {
  const [drillDownData, setDrillDownData] = useState(null);
  
  const getMonthlyData = () => {
    const monthlyData = {};
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      
      // If showing all flotillas, add flotilla-specific data
      if (selectedFlotilla === 'all') {
        flotillas.forEach(f => {
          monthlyData[monthKey][`income_${f.id}`] = 0;
          monthlyData[monthKey][`expenses_${f.id}`] = 0;
        });
      }
    }

    const filtered = selectedFlotilla === 'all' 
      ? transactions 
      : transactions.filter(t => t.flotilla_id === selectedFlotilla);

    filtered.forEach(t => {
      const monthKey = format(new Date(t.transaction_date), 'MMM yyyy');
      if (monthlyData[monthKey]) {
        if (selectedFlotilla === 'all') {
          // Track by flotilla
          if (t.transaction_type === 'income') {
            monthlyData[monthKey].income += t.amount || 0;
            monthlyData[monthKey][`income_${t.flotilla_id}`] = (monthlyData[monthKey][`income_${t.flotilla_id}`] || 0) + (t.amount || 0);
          } else {
            monthlyData[monthKey].expenses += t.amount || 0;
            monthlyData[monthKey][`expenses_${t.flotilla_id}`] = (monthlyData[monthKey][`expenses_${t.flotilla_id}`] || 0) + (t.amount || 0);
          }
        } else {
          // Single flotilla view
          if (t.transaction_type === 'income') {
            monthlyData[monthKey].income += t.amount || 0;
          } else {
            monthlyData[monthKey].expenses += t.amount || 0;
          }
        }
      }
    });

    return Object.values(monthlyData);
  };

  const data = getMonthlyData();
  const flotillaName = selectedFlotilla === 'all' 
    ? 'All Flotillas' 
    : flotillas.find(f => f.id === selectedFlotilla)?.flotilla_name || 'Flotilla';

  const handleBarClick = (data, type, flotillaId = null) => {
    const monthDate = new Date(data.month + ' 01');
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    let filtered = selectedFlotilla === 'all' 
      ? transactions 
      : transactions.filter(t => t.flotilla_id === selectedFlotilla);

    // If flotilla was clicked in stacked view, filter by that flotilla
    if (flotillaId) {
      filtered = filtered.filter(t => t.flotilla_id === flotillaId);
    }

    const monthTransactions = filtered.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= monthStart && tDate <= monthEnd && t.transaction_type === type;
    });

    const flotilla = flotillaId ? flotillas.find(f => f.id === flotillaId) : null;

    setDrillDownData({
      month: data.month,
      type: type === 'income' ? 'Income' : 'Expenses',
      flotilla: flotilla ? `${flotilla.flotilla_number}` : null,
      transactions: monthTransactions
    });
  };

  return (
    <div>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Monthly Income vs Expenses - {flotillaName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip 
                formatter={(value) => `$${(value || 0).toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                wrapperStyle={{ pointerEvents: 'none' }}
                offset={100}
              />
              <Legend />
              
              {selectedFlotilla === 'all' ? (
                // Stacked bars by flotilla
                <>
                  {flotillas.map((f, idx) => (
                    <React.Fragment key={f.id}>
                      <Bar 
                        dataKey={`income_${f.id}`}
                        stackId="income"
                        fill={FLOTILLA_COLORS[idx % FLOTILLA_COLORS.length]}
                        name={`${f.flotilla_number} Income`}
                        onClick={(data) => handleBarClick(data, 'income', f.id)}
                        cursor="pointer"
                      />
                    </React.Fragment>
                  ))}
                  {flotillas.map((f, idx) => (
                    <React.Fragment key={f.id}>
                      <Bar 
                        dataKey={`expenses_${f.id}`}
                        stackId="expenses"
                        fill={FLOTILLA_COLORS[idx % FLOTILLA_COLORS.length]}
                        name={`${f.flotilla_number} Expenses`}
                        onClick={(data) => handleBarClick(data, 'expense', f.id)}
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
                    dataKey="income" 
                    fill="#10b981" 
                    name="Income" 
                    radius={[8, 8, 0, 0]}
                    onClick={(data) => handleBarClick(data, 'income')}
                    cursor="pointer"
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="#ef4444" 
                    name="Expenses" 
                    radius={[8, 8, 0, 0]}
                    onClick={(data) => handleBarClick(data, 'expense')}
                    cursor="pointer"
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {drillDownData?.type} Transactions - {drillDownData?.month}
              {drillDownData?.flotilla && ` - Flotilla ${drillDownData.flotilla}`}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {drillDownData?.transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor/Payee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDownData?.transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.vendor_payee || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(t.amount || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold">
                  ${(drillDownData?.transactions.reduce((sum, t) => sum + (t.amount || 0), 0) || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}