import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const FLOTILLA_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function TransactionTrendsChart({ transactions, selectedFlotilla = 'all', flotillas = [] }) {
  const [drillDownData, setDrillDownData] = useState(null);
  
  const getTrendsData = () => {
    const monthlyData = {};
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      monthlyData[monthKey] = { 
        month: format(date, 'MMM'), 
        transactions: 0, 
        totalAmount: 0,
        avgAmount: 0 
      };
      
      // If showing all flotillas, add flotilla-specific data
      if (selectedFlotilla === 'all') {
        flotillas.forEach(f => {
          monthlyData[monthKey][`count_${f.id}`] = 0;
          monthlyData[monthKey][`amount_${f.id}`] = 0;
        });
      }
    }

    const filtered = selectedFlotilla === 'all' 
      ? transactions 
      : transactions.filter(t => t.flotilla_id === selectedFlotilla);

    filtered.forEach(t => {
      const monthKey = format(new Date(t.transaction_date), 'MMM yyyy');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].transactions += 1;
        monthlyData[monthKey].totalAmount += t.amount || 0;
        
        if (selectedFlotilla === 'all') {
          monthlyData[monthKey][`count_${t.flotilla_id}`] = (monthlyData[monthKey][`count_${t.flotilla_id}`] || 0) + 1;
          monthlyData[monthKey][`amount_${t.flotilla_id}`] = (monthlyData[monthKey][`amount_${t.flotilla_id}`] || 0) + (t.amount || 0);
        }
      }
    });

    return Object.values(monthlyData).map(d => ({
      ...d,
      avgAmount: d.transactions > 0 ? d.totalAmount / d.transactions : 0
    }));
  };

  const data = getTrendsData();

  const handlePointClick = (data) => {
    // Find the full month name from the abbreviated one
    const monthIndex = data.activeLabel;
    let targetDate;
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      if (format(date, 'MMM') === monthIndex) {
        targetDate = date;
        break;
      }
    }

    if (!targetDate) return;

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const filtered = selectedFlotilla === 'all' 
      ? transactions 
      : transactions.filter(t => t.flotilla_id === selectedFlotilla);

    const monthTransactions = filtered.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    setDrillDownData({
      month: format(targetDate, 'MMMM yyyy'),
      transactions: monthTransactions
    });
  };

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Transaction Trends (Last 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} onClick={handlePointClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px' }} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name.includes('Count')) return value || 0;
                  return `$${(value || 0).toFixed(2)}`;
                }}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
              />
              <Legend />
              
              {selectedFlotilla === 'all' ? (
                // Multiple lines for flotillas
                <>
                  {flotillas.map((f, idx) => (
                    <Line 
                      key={f.id}
                      yAxisId="left"
                      type="monotone" 
                      dataKey={`count_${f.id}`}
                      stroke={FLOTILLA_COLORS[idx % FLOTILLA_COLORS.length]}
                      strokeWidth={2} 
                      name={`${f.flotilla_number} Count`}
                      dot={{ fill: FLOTILLA_COLORS[idx % FLOTILLA_COLORS.length], r: 3 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                    />
                  ))}
                </>
              ) : (
                // Single flotilla view
                <>
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    name="Transaction Count"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6, cursor: 'pointer' }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgAmount" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    name="Avg Amount"
                    dot={{ fill: '#06b6d4', r: 4 }}
                    activeDot={{ r: 6, cursor: 'pointer' }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              All Transactions - {drillDownData?.month}
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
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDownData?.transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>
                          {t.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
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