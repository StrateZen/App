import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, ArrowLeft } from "lucide-react";
import { RequireAuth, useFlotillaFilter } from "../components/auth/AccessControl";
import BankAccountForm from "../components/bank/BankAccountForm";
import BankAccountCard from "../components/bank/BankAccountCard";
import ReconciliationManager from "../components/bank/ReconciliationManager";

export default function BankReconciliationPage() {
  return (
    <RequireAuth pageName="BankReconciliation">
      <BankReconciliationContent />
    </RequireAuth>
  );
}

function BankReconciliationContent() {
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { filterByFlotilla, canAccessFlotilla, user, loading: userLoading } = useFlotillaFilter();
  const queryClient = useQueryClient();


  const { data: allFlotillas } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const flotillas = user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length > 0
    ? allFlotillas.filter(f => user.flotilla_ids.includes(f.id))
    : allFlotillas;

  const { data: allBankAccounts, isLoading: loadingBanks } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => base44.entities.BankAccount.list(),
    initialData: [],
  });

  const bankAccounts = filterByFlotilla(allBankAccounts);

  const createBankMutation = useMutation({
    mutationFn: (data) => base44.entities.BankAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      setShowBankForm(false);
      setEditingAccount(null);
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BankAccount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      setShowBankForm(false);
      setEditingAccount(null);
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: (id) => base44.entities.BankAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });

  const handleBankSubmit = async (accountData) => {
    if (user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length === 1 && !accountData.flotilla_id) {
      accountData.flotilla_id = user.flotilla_ids[0];
    }
    
    if (editingAccount) {
      updateBankMutation.mutate({ id: editingAccount.id, data: accountData });
    } else {
      createBankMutation.mutate(accountData);
    }
  };

  const handleEdit = (account) => {
    if (!canAccessFlotilla(account.flotilla_id)) {
      alert('You do not have permission to edit this account');
      return;
    }
    setEditingAccount(account);
    setShowBankForm(true);
  };

  const handleDelete = (account) => {
    if (!canAccessFlotilla(account.flotilla_id)) {
      alert('You do not have permission to delete this account');
      return;
    }
    if (window.confirm('Are you sure you want to delete this bank account? This will also delete all associated reconciliations.')) {
      deleteBankMutation.mutate(account.id);
    }
  };

  const handleViewReconciliations = (account) => {
    setSelectedAccount(account);
  };

  if (selectedAccount) {
    return (
      <ReconciliationManager
        bankAccount={selectedAccount}
        flotillas={flotillas}
        onBack={() => setSelectedAccount(null)}
        user={user}
      />
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Bank Accounts</h1>
                <p className="text-slate-600 mt-1">Manage bank accounts and reconciliations</p>
              </div>
            </div>
            <Button
              onClick={() => setShowBankForm(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Bank Account
            </Button>
          </div>
        </div>

        {/* Bank Account Form */}
        {showBankForm && (
          <BankAccountForm
            account={editingAccount}
            flotillas={flotillas}
            onSubmit={handleBankSubmit}
            onCancel={() => {
              setShowBankForm(false);
              setEditingAccount(null);
            }}
            userFlotillaId={user?.flotilla_ids?.length === 1 ? user.flotilla_ids[0] : null}
          />
        )}

        {/* Bank Accounts List */}
        {loadingBanks || userLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading bank accounts...</p>
            </CardContent>
          </Card>
        ) : bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Landmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Bank Accounts</h3>
              <p className="text-slate-600">Add your first bank account to start managing reconciliations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bankAccounts.map(account => (
              <BankAccountCard
                key={account.id}
                account={account}
                flotillas={flotillas}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewReconciliations={handleViewReconciliations}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}