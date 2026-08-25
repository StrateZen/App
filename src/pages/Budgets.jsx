import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, PiggyBank, BarChart3, List } from "lucide-react";
import { RequireAuth, useFlotillaFilter, useRolePermissions } from "../components/auth/AccessControl";
import { canManageFinancials } from "../components/auth/RoleConfig";

import BudgetForm from "../components/budgets/BudgetForm";
import BudgetsList from "../components/budgets/BudgetsList";
import AIBudgetProposal from "../components/budgets/AIBudgetProposal";
import BudgetTracker from "../components/budgets/BudgetTracker";

export default function BudgetsPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <BudgetsContent />
    </RequireAuth>
  );
}

function BudgetsContent() {
  const [showForm, setShowForm] = useState(false);
  const [showAIProposal, setShowAIProposal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const { filterByFlotilla, canAccessFlotilla, user } = useFlotillaFilter();
  const { hasDivisionRole, getUserFlotillaIds } = useRolePermissions();

  const queryClient = useQueryClient();

  const { data: allFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const flotillas = hasDivisionRole()
    ? allFlotillas
    : allFlotillas.filter(f => getUserFlotillaIds().includes(f.id));

  const { data: allBudgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-budget_year'),
    initialData: [],
  });

  const budgets = filterByFlotilla(allBudgets);

  const { data: allTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
    initialData: [],
  });

  const transactions = filterByFlotilla(allTransactions);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setEditingBudget(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setEditingBudget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleSubmit = async (budgetData) => {
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: budgetData });
    } else {
      createMutation.mutate(budgetData);
    }
  };

  const handleEdit = (budget) => {
    if (!canAccessFlotilla(budget.flotilla_id)) {
      alert('You do not have permission to edit this budget');
      return;
    }
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (budget) => {
    if (!canAccessFlotilla(budget.flotilla_id)) {
      alert('You do not have permission to delete this budget');
      return;
    }
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteMutation.mutate(budget.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleProposalGenerated = (budgetData) => {
    setEditingBudget(budgetData);
    setShowAIProposal(false);
    setShowForm(true);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Budget Planning</h1>
                <p className="text-slate-600 mt-1">Create and manage annual budgets for flotillas</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAIProposal(true)}
                variant="outline"
                className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4" />
                AI Budget Proposal
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
                Create Manual Budget
              </Button>
            </div>
          </div>
        </div>

        {/* AI Proposal */}
        {showAIProposal && (
          <AIBudgetProposal
            flotillas={flotillas}
            onProposalGenerated={handleProposalGenerated}
          />
        )}

        {/* Form */}
        {showForm && (
          <BudgetForm
            budget={editingBudget}
            flotillas={flotillas}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Main Content - Tabs */}
        <Card className="shadow-sm border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b border-slate-100">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  Budget List
                </TabsTrigger>
                <TabsTrigger value="tracker" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Budget Tracking
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="list" className="mt-0 p-6">
                <BudgetsList
                  budgets={budgets}
                  flotillas={flotillas}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </TabsContent>
              <TabsContent value="tracker" className="mt-0 p-6">
                <BudgetTracker
                  budgets={budgets}
                  transactions={transactions}
                  flotillas={allFlotillas}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}