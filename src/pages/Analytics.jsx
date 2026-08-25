import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TrendingUp, DollarSign, PieChart as PieChartIcon, Percent, Activity, CalendarIcon } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { RequireAuth, useFlotillaFilter } from "../components/auth/AccessControl";

export default function AnalyticsPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <AnalyticsContent />
    </RequireAuth>
  );
}

function AnalyticsContent() {
  const { filterByFlotilla, user } = useFlotillaFilter();
  const [selectedFlotilla, setSelectedFlotilla] = useState('all');
  const [startDate, setStartDate] = useState(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());

  const { data: allFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const flotillas = user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length > 0
    ? allFlotillas.filter(f => user.flotilla_ids.includes(f.id))
    : allFlotillas;

  const { data: allTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date'),
    initialData: [],
  });

  const transactions = filterByFlotilla(allTransactions);

  useEffect(() => {
    if (user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length === 1) {
      setSelectedFlotilla(user.flotilla_ids[0]);
    }
  }, [user]);

  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    if (selectedFlotilla !== 'all') {
      filtered = filtered.filter(t => t.flotilla_id === selectedFlotilla);
    }

    filtered = filtered.filter(t => {
      const tDate = new Date(t.transaction_date);
      return tDate >= startDate && tDate <= endDate;
    });

    return filtered;
  };

  const getMonthlyTrends = () => {
    const filtered = getFilteredTransactions();
    const monthlyData = {};

    filtered.forEach(t => {
      const monthKey = format(new Date(t.transaction_date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }
      
      if (t.transaction_type === 'income') {
        monthlyData[monthKey].income += t.amount || 0;
      } else {
        monthlyData[monthKey].expenses += t.amount || 0;
      }
    });

    return Object.values(monthlyData).reverse();
  };

  const getCategoryBreakdown = () => {
    const filtered = getFilteredTransactions();
    const categories = {};

    filtered.forEach(t => {
      const cat = t.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat] += t.amount || 0;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getIncomeVsExpenses = () => {
    const filtered = getFilteredTransactions();
    const income = filtered.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = filtered.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

    return [
      { name: 'Income', value: income, fill: '#10b981' },
      { name: 'Expenses', value: expenses, fill: '#ef4444' }
    ];
  };

  const getFinancialRatios = () => {
    const filtered = getFilteredTransactions();
    const income = filtered.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = filtered.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const netIncome = income - expenses;
    
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
    const savingsRate = income > 0 ? (netIncome / income) * 100 : 0;
    const monthsDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
    const burnRate = filtered.length > 0 ? expenses / monthsDiff : 0;
    const avgTransactionSize = filtered.length > 0 ? (income + expenses) / filtered.length : 0;

    return {
      income,
      expenses,
      netIncome,
      expenseRatio,
      savingsRate,
      burnRate,
      avgTransactionSize,
      transactionCount: filtered.length
    };
  };

  const getExpenseBreakdown = () => {
    const filtered = getFilteredTransactions().filter(t => t.transaction_type === 'expense');
    const categories = {};

    filtered.forEach(t => {
      const cat = t.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat] += t.amount || 0;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getIncomeBreakdown = () => {
    const filtered = getFilteredTransactions().filter(t => t.transaction_type === 'income');
    const categories = {};

    filtered.forEach(t => {
      const cat = t.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat] += t.amount || 0;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const selectedFlotillaData = flotillas.find(f => f.id === selectedFlotilla);
  const flotillaName = selectedFlotilla === 'all' 
    ? 'All Flotillas' 
    : selectedFlotillaData?.flotilla_name;

  const ratios = getFinancialRatios();
  const expenseBreakdown = getExpenseBreakdown();
  const incomeBreakdown = getIncomeBreakdown();

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {selectedFlotilla === 'all' 
                  ? 'Division Financial Analytics'
                  : `Flotilla ${selectedFlotillaData?.flotilla_number} ${selectedFlotillaData?.flotilla_name || ''}`
                }
              </h1>
              <p className="text-slate-600 mt-1">Visual insights and spending patterns</p>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="grid md:grid-cols-3 gap-4">
            {(user?.access_level !== 'flotilla_staff') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Flotilla</label>
                <Select value={selectedFlotilla} onValueChange={setSelectedFlotilla}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flotillas (Division Level)</SelectItem>
                    {flotillas.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.flotilla_number} - {f.flotilla_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Net Income</p>
                  <CardTitle className={`text-2xl font-bold mt-1 ${ratios.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${ratios.netIncome.toFixed(2)}
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-blue-100">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Expense Ratio</p>
                  <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
                    {ratios.expenseRatio.toFixed(1)}%
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-purple-100">
                  <Percent className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Expenses / Income</p>
            </CardHeader>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Savings Rate</p>
                  <CardTitle className={`text-2xl font-bold mt-1 ${ratios.savingsRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {ratios.savingsRate.toFixed(1)}%
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-emerald-100">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Net Income / Income</p>
            </CardHeader>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Monthly Burn</p>
                  <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
                    ${ratios.burnRate.toFixed(0)}
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-orange-100">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Avg. Monthly Expenses</p>
            </CardHeader>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600">${ratios.income.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${ratios.expenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg. Transaction</p>
                <p className="text-2xl font-bold text-slate-900">${ratios.avgTransactionSize.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{ratios.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Monthly Income vs Expenses - {flotillaName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMonthlyTrends()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Expense Breakdown */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Income Breakdown */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Income Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown Tables */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-900">Top Expense Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-700">Category</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Amount</th>
                      <th className="text-right p-4 font-semibold text-slate-700">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseBreakdown.map((cat, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="p-4 text-slate-900">{cat.name}</td>
                        <td className="p-4 text-right font-semibold text-red-600">${cat.value.toFixed(2)}</td>
                        <td className="p-4 text-right text-slate-600">
                          {((cat.value / ratios.expenses) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-900">Income Sources Detail</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-700">Source</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Amount</th>
                      <th className="text-right p-4 font-semibold text-slate-700">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeBreakdown.map((cat, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="p-4 text-slate-900">{cat.name}</td>
                        <td className="p-4 text-right font-semibold text-emerald-600">${cat.value.toFixed(2)}</td>
                        <td className="p-4 text-right text-slate-600">
                          {((cat.value / ratios.income) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}