import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequireAuth, useFlotillaFilter, useRolePermissions } from "../components/auth/AccessControl";
import { canManageFinancials } from "../components/auth/RoleConfig";

import TransactionForm from "../components/transactions/TransactionForm";
import TransactionsList from "../components/transactions/TransactionsList";

export default function TransactionsPage() {
  return (
    <RequireAuth pageName="Transactions">
      <TransactionsContent />
    </RequireAuth>
  );
}

function TransactionsContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlotilla, setFilterFlotilla] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const { filterByFlotilla, canAccessFlotilla, user, loading: userLoading } = useFlotillaFilter();
  const { getUserRoles } = useRolePermissions();
  const userRoles = getUserRoles();

  const queryClient = useQueryClient();

  const { data: allFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const flotillas = user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length > 0
    ? allFlotillas.filter(f => user.flotilla_ids.includes(f.id))
    : allFlotillas;

  const { data: allTransactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date'),
    initialData: [],
  });

  const transactions = filterByFlotilla(allTransactions);

  // Check URL parameters for edit mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId && allTransactions) {
      const transaction = allTransactions.find(t => t.id === editId);
      if (transaction && canAccessFlotilla(transaction.flotilla_id)) {
        setEditingTransaction(transaction);
        setShowForm(true);
      }
    }
  }, [allTransactions, canAccessFlotilla]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleSubmit = async (transactionData) => {
    // Auto-assign first flotilla for flotilla_staff if they have exactly one
    if (user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length === 1 && !transactionData.flotilla_id) {
      transactionData.flotilla_id = user.flotilla_ids[0];
    }
    
    // Set initial status to pending for new transactions
    if (!editingTransaction) {
      transactionData.audit_status = 'pending';
    }
    
    // Auto-flag expense transactions without receipts
    if (transactionData.transaction_type === 'expense' && !transactionData.receipt_url) {
      transactionData.audit_status = 'flagged';
      transactionData.audit_notes = 'Automatically flagged: Missing receipt documentation';
    }
    
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: transactionData });
    } else {
      createMutation.mutate(transactionData);
    }
  };

  const handleEdit = (transaction) => {
    if (!canAccessFlotilla(transaction.flotilla_id)) {
      alert('You do not have permission to edit this transaction');
      return;
    }
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transaction) => {
    if (!canAccessFlotilla(transaction.flotilla_id)) {
      alert('You do not have permission to delete this transaction');
      return;
    }
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(transaction.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.vendor_payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.amount?.toString().includes(searchTerm);
    const matchesFlotilla = filterFlotilla === 'all' || t.flotilla_id === filterFlotilla;
    const matchesType = filterType === 'all' || t.transaction_type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesFlotilla && matchesType && matchesCategory;
  });

  const categories = [
    'membership_dues', 'donations', 'fundraising_events', 'grants', 'other_income', 'change_of_watch', 'special_event', 'interest',
    'boat_maintenance', 'fuel_costs', 'training_materials', 'communications_equipment',
    'safety_equipment', 'meeting_expenses', 'administrative_costs', 'uniforms_insignia',
    'public_education', 'vessel_examination_supplies', 'event_costs', 'office_supplies', 
    'awards_gifts_trophies', 'travel', 'meetings_cow', 'color_guard', 'bank_fees', 'marketing', 'other'
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Financial Transactions</h1>
                <p className="text-slate-600 mt-1">Record and manage income and expenses</p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <TransactionForm
            transaction={editingTransaction}
            flotillas={flotillas}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Filters */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterFlotilla} onValueChange={setFilterFlotilla}>
                <SelectTrigger>
                  <SelectValue placeholder="All Flotillas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flotillas</SelectItem>
                  {flotillas.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.flotilla_number} - {f.flotilla_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <TransactionsList
          transactions={filteredTransactions}
          flotillas={flotillas}
          isLoading={isLoading || userLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}