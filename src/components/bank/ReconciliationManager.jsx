import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Building2, Upload } from "lucide-react";
import ReconciliationForm from "./ReconciliationForm";
import ReconciliationsList from "./ReconciliationsList";
import JournalEntryForm from "./JournalEntryForm";
import ReconciliationView from "./ReconciliationView";
import AutoReconciliation from "./AutoReconciliation";
import CSVBatchImport from "./CSVBatchImport";

export default function ReconciliationManager({ bankAccount, flotillas, onBack, user }) {
  const [showReconForm, setShowReconForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showAutoRecon, setShowAutoRecon] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingRecon, setEditingRecon] = useState(null);
  const [selectedRecon, setSelectedRecon] = useState(null);

  const queryClient = useQueryClient();

  const { data: reconciliations, isLoading } = useQuery({
    queryKey: ['reconciliations', bankAccount.id],
    queryFn: () => base44.entities.Reconciliation.filter({ bank_account_id: bankAccount.id }, '-period_end'),
    initialData: [],
  });

  const { data: allTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date'),
    initialData: [],
  });

  const { data: allJournalEntries } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: () => base44.entities.JournalEntry.list('-entry_date'),
    initialData: [],
  });

  const flotilla = flotillas.find(f => f.id === bankAccount.flotilla_id);
  const flotillaTransactions = allTransactions.filter(t => t.flotilla_id === bankAccount.flotilla_id);
  const flotillaJournalEntries = allJournalEntries.filter(je => je.flotilla_id === bankAccount.flotilla_id);

  const createReconMutation = useMutation({
    mutationFn: (data) => base44.entities.Reconciliation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      setShowReconForm(false);
      setEditingRecon(null);
    },
  });

  const updateReconMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reconciliation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      setShowReconForm(false);
      setEditingRecon(null);
      setSelectedRecon(null);
    },
  });

  const deleteReconMutation = useMutation({
    mutationFn: (id) => base44.entities.Reconciliation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
  });

  const createJournalMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setShowJournalForm(false);
    },
  });

  const handleReconSubmit = (reconData) => {
    reconData.bank_account_id = bankAccount.id;
    
    if (editingRecon) {
      updateReconMutation.mutate({ id: editingRecon.id, data: reconData });
    } else {
      createReconMutation.mutate(reconData);
    }
  };

  const handleJournalSubmit = (journalData) => {
    journalData.flotilla_id = bankAccount.flotilla_id;
    journalData.related_bank_account_id = selectedRecon?.id;
    
    createJournalMutation.mutate(journalData);
  };

  const handleEdit = (recon) => {
    setEditingRecon(recon);
    setShowReconForm(true);
  };

  const handleDelete = (recon) => {
    if (window.confirm('Are you sure you want to delete this reconciliation?')) {
      deleteReconMutation.mutate(recon.id);
    }
  };

  const handleViewDetails = (recon) => {
    setSelectedRecon(recon);
  };

  if (selectedRecon) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <ReconciliationView
            account={selectedRecon}
            bankAccount={bankAccount}
            transactions={flotillaTransactions}
            journalEntries={flotillaJournalEntries}
            flotillas={flotillas}
            onClose={() => setSelectedRecon(null)}
            onUpdate={(data) => updateReconMutation.mutate({ id: selectedRecon.id, data })}
            onCreateJournal={() => setShowJournalForm(true)}
          />
          
          {showJournalForm && (
            <div className="mt-6">
              <JournalEntryForm
                flotillas={flotillas}
                bankAccounts={[bankAccount]}
                onSubmit={handleJournalSubmit}
                onCancel={() => setShowJournalForm(false)}
                userFlotillaId={bankAccount.flotilla_id}
                userName={user?.full_name}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Card className="border-blue-200 bg-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {bankAccount.account_name}
                  </CardTitle>
                </div>
                <p className="text-slate-600">
                  {bankAccount.bank_name} • Account: {bankAccount.account_number}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {flotilla ? `Flotilla ${flotilla.flotilla_number} - ${flotilla.flotilla_name}` : ''}
                </p>
              </div>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Accounts
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => setShowCSVImport(v => !v)}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => setShowAutoRecon(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Auto Reconciliation
          </Button>
          <Button
            onClick={() => setShowReconForm(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Manual Reconciliation
          </Button>
        </div>

        {/* CSV Batch Import */}
        {showCSVImport && (
          <CSVBatchImport
            transactions={flotillaTransactions}
            onClose={() => setShowCSVImport(false)}
          />
        )}

        {/* Auto Reconciliation */}
        {showAutoRecon && (
          <AutoReconciliation
            account={bankAccount}
            onComplete={() => {
              setShowAutoRecon(false);
              queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
            }}
          />
        )}

        {/* Reconciliation Form */}
        {showReconForm && (
          <ReconciliationForm
            reconciliation={editingRecon}
            onSubmit={handleReconSubmit}
            onCancel={() => {
              setShowReconForm(false);
              setEditingRecon(null);
            }}
          />
        )}

        {/* Reconciliations List */}
        <ReconciliationsList
          reconciliations={reconciliations}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
}