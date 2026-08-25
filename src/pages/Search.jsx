import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, DollarSign, PiggyBank, User, Users, ArrowRight } from "lucide-react";
import { RequireAuth, useFlotillaFilter } from "../components/auth/AccessControl";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function SearchPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <SearchContent />
    </RequireAuth>
  );
}

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { filterByFlotilla, user } = useFlotillaFilter();

  const { data: allTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date'),
    initialData: [],
  });

  const { data: allBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-budget_year'),
    initialData: [],
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: allFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  // Apply access control filters
  const transactions = filterByFlotilla(allTransactions);
  const budgets = filterByFlotilla(allBudgets);
  const users = user?.access_level === 'flotilla_staff' && user?.flotilla_id
    ? allUsers.filter(u => u.flotilla_id === user.flotilla_id)
    : allUsers;
  const flotillas = user?.access_level === 'flotilla_staff' && user?.flotilla_id
    ? allFlotillas.filter(f => f.id === user.flotilla_id)
    : allFlotillas;

  // Search logic
  const query = searchQuery.toLowerCase().trim();
  
  const searchTransactions = () => {
    if (!query) return [];
    const amountQuery = parseFloat(query);
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(query) ||
      t.vendor_payee?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query) ||
      t.budget_item?.toLowerCase().includes(query) ||
      t.approved_by?.toLowerCase().includes(query) ||
      t.notes?.toLowerCase().includes(query) ||
      (t.amount && !isNaN(amountQuery) && (
        t.amount === amountQuery ||
        t.amount.toString().includes(query)
      ))
    ).slice(0, 10);
  };

  const searchBudgets = () => {
    if (!query) return [];
    return budgets.filter(b =>
      b.budget_year?.toString().includes(query) ||
      b.approved_by?.toLowerCase().includes(query) ||
      b.notes?.toLowerCase().includes(query) ||
      flotillas.find(f => f.id === b.flotilla_id)?.flotilla_number?.toLowerCase().includes(query) ||
      flotillas.find(f => f.id === b.flotilla_id)?.flotilla_name?.toLowerCase().includes(query)
    ).slice(0, 10);
  };

  const searchUsers = () => {
    if (!query) return [];
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    ).slice(0, 10);
  };

  const searchFlotillas = () => {
    if (!query) return [];
    return flotillas.filter(f =>
      f.flotilla_number?.toLowerCase().includes(query) ||
      f.flotilla_name?.toLowerCase().includes(query) ||
      f.location?.toLowerCase().includes(query) ||
      f.meeting_location?.toLowerCase().includes(query) ||
      f.meeting_address?.toLowerCase().includes(query) ||
      f.commander_name?.toLowerCase().includes(query) ||
      f.commander_email?.toLowerCase().includes(query) ||
      f.vice_commander_name?.toLowerCase().includes(query) ||
      f.fso_fn_name?.toLowerCase().includes(query)
    ).slice(0, 10);
  };

  const transactionResults = searchTransactions();
  const budgetResults = searchBudgets();
  const userResults = searchUsers();
  const flotillaResults = searchFlotillas();

  const totalResults = transactionResults.length + budgetResults.length + userResults.length + flotillaResults.length;

  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `${flotilla.flotilla_number}` : 'Unknown';
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <SearchIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Search</h1>
              <p className="text-slate-600 mt-1">Search across transactions, budgets, users, and flotillas</p>
            </div>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by description, name, email, flotilla number, year, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {query && (
            <p className="mt-4 text-sm text-slate-600">
              Found <span className="font-semibold text-slate-900">{totalResults}</span> results for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Results */}
        {query && totalResults === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Results Found</h3>
              <p className="text-slate-500">Try adjusting your search terms</p>
            </CardContent>
          </Card>
        )}

        {/* Transactions Results */}
        {transactionResults.length > 0 && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-emerald-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Transactions ({transactionResults.length})
                </CardTitle>
                <Link to={createPageUrl("Transactions")}>
                  <Button variant="outline" size="sm" className="gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {transactionResults.map((t) => (
                  <Link key={t.id} to={createPageUrl("Transactions")} className="block border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{t.description}</h4>
                        <p className="text-sm text-slate-600 mt-1">{t.vendor_payee || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${t.transaction_type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.transaction_type === 'income' ? '+' : '-'}${t.amount?.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{getFlotillaName(t.flotilla_id)}</Badge>
                      <Badge variant={t.transaction_type === 'income' ? 'default' : 'secondary'}>
                        {t.transaction_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {t.category?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budgets Results */}
        {budgetResults.length > 0 && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-amber-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-amber-600" />
                  Budgets ({budgetResults.length})
                </CardTitle>
                <Link to={createPageUrl("Budgets")}>
                  <Button variant="outline" size="sm" className="gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {budgetResults.map((b) => {
                  const totalIncome = Object.values(b.income_budget || {}).reduce((sum, val) => sum + val, 0);
                  const totalExpense = Object.values(b.expense_budget || {}).reduce((sum, val) => sum + val, 0);
                  return (
                    <Link key={b.id} to={createPageUrl("Budgets")} className="block border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900">FY {b.budget_year}</h4>
                          <p className="text-sm text-slate-600 mt-1">
                            {flotillas.find(f => f.id === b.flotilla_id)?.flotilla_number} - {flotillas.find(f => f.id === b.flotilla_id)?.flotilla_name}
                          </p>
                        </div>
                        <Badge variant={b.approved ? "default" : "secondary"}>
                          {b.approved ? "Approved" : "Draft"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-600">Income Budget</p>
                          <p className="text-lg font-semibold text-emerald-600">${totalIncome.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Expense Budget</p>
                          <p className="text-lg font-semibold text-red-600">${totalExpense.toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Results */}
        {userResults.length > 0 && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Users ({userResults.length})
                </CardTitle>
                <Link to={createPageUrl("UserSettings")}>
                  <Button variant="outline" size="sm" className="gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {userResults.map((u) => (
                  <Link key={u.id} to={createPageUrl("UserManagement")} className="block border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-900">{u.full_name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{u.email}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant="outline" className="capitalize">
                          {u.access_level?.replace('_', ' ')}
                        </Badge>
                        {u.flotilla_id && (
                          <Badge variant="secondary">
                            {getFlotillaName(u.flotilla_id)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flotillas Results */}
        {flotillaResults.length > 0 && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-purple-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Flotillas ({flotillaResults.length})
                </CardTitle>
                <Link to={createPageUrl("Flotillas")}>
                  <Button variant="outline" size="sm" className="gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {flotillaResults.map((f) => (
                  <Link key={f.id} to={createPageUrl("FlotillaDashboard")} className="block border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-900">{f.flotilla_number} - {f.flotilla_name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{f.location}</p>
                        <p className="text-sm text-slate-600 mt-2">
                          <span className="font-medium">Commander:</span> {f.commander_name || 'N/A'}
                        </p>
                      </div>
                      <Badge variant={f.active ? "default" : "secondary"}>
                        {f.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}