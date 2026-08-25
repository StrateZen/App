import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { format } from "date-fns";
import AIReconciliationAssistant from "./AIReconciliationAssistant";

export default function ReconciliationView({ account, bankAccount, transactions, journalEntries, flotillas, onClose, onUpdate, onCreateJournal }) {
  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `Flotilla ${flotilla.flotilla_number}` : 'Unknown';
  };

  const periodTransactions = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    const start = new Date(account.period_start);
    const end = new Date(account.period_end);
    return tDate >= start && tDate <= end;
  });

  const periodJournalEntries = journalEntries.filter(je => {
    const jeDate = new Date(je.entry_date);
    const start = new Date(account.period_start);
    const end = new Date(account.period_end);
    return jeDate >= start && jeDate <= end;
  });

  const totalIncome = periodTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = periodTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAdjustments = periodJournalEntries.reduce((sum, je) => {
    if (je.entry_type === 'adjustment_increase') return sum + je.amount;
    if (je.entry_type === 'adjustment_decrease') return sum - je.amount;
    return sum;
  }, 0);

  const calculatedEndingBalance = account.starting_balance + totalIncome - totalExpenses + totalAdjustments;
  const variance = account.ending_balance - calculatedEndingBalance;
  const isReconciled = Math.abs(variance) < 0.01;

  const handleMarkReconciled = () => {
    if (window.confirm('Mark this account as reconciled?')) {
      onUpdate({
        ...account,
        reconciled: true,
        reconciled_date: new Date().toISOString().split('T')[0],
        reconciled_by: 'Current User'
      });
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant */}
      <AIReconciliationAssistant
        bankAccount={bankAccount}
        periodStart={account.period_start}
        periodEnd={account.period_end}
        transactions={periodTransactions}
        onCreateJournal={onCreateJournal}
      />

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Reconciliation Period
              </CardTitle>
              <p className="text-slate-600 mt-1">
                {format(new Date(account.period_start), 'MMM d, yyyy')} - {format(new Date(account.period_end), 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {bankAccount.account_name} • {bankAccount.bank_name}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-2">Starting Balance</p>
            <p className="text-2xl font-bold text-slate-900">
              ${account.starting_balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-2">Total Income</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              ${totalIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-2">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              ${totalExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-2">Adjustments</p>
            <p className={`text-2xl font-bold ${totalAdjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalAdjustments >= 0 ? '+' : ''}${totalAdjustments.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={isReconciled ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {isReconciled ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span className="text-green-900">Reconciliation Complete</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <span className="text-amber-900">Reconciliation Variance Detected</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Bank Ending Balance</p>
              <p className="text-xl font-bold text-slate-900">
                ${account.ending_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Calculated Balance</p>
              <p className="text-xl font-bold text-slate-900">
                ${calculatedEndingBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Variance</p>
              <p className={`text-xl font-bold ${Math.abs(variance) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(variance).toFixed(2)}
              </p>
            </div>
          </div>

          {isReconciled ? (
            <div className="bg-white rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✓ The calculated balance matches the bank statement. This period can be marked as reconciled.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4">
              <p className="text-amber-800 font-medium mb-2">
                ⚠ There is a variance of ${Math.abs(variance).toFixed(2)}. Consider creating a journal entry to account for this discrepancy.
              </p>
              <p className="text-sm text-slate-600 mb-3">
                Review transactions and journal entries for the period, or create an adjustment entry to resolve the difference.
              </p>
              {onCreateJournal && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCreateJournal}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Journal Entry
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleMarkReconciled}
              disabled={account.reconciled}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {account.reconciled ? 'Already Reconciled' : 'Mark as Reconciled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">Transactions ({periodTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-96 overflow-y-auto">
            {periodTransactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions in this period</p>
            ) : (
              <div className="space-y-2">
                {periodTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{t.description}</p>
                      <p className="text-xs text-slate-500">{format(new Date(t.transaction_date), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge className={t.transaction_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {t.transaction_type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">Journal Entries ({periodJournalEntries.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-96 overflow-y-auto">
            {periodJournalEntries.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No journal entries in this period</p>
            ) : (
              <div className="space-y-2">
                {periodJournalEntries.map(je => (
                  <div key={je.id} className="flex justify-between items-start p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{je.description}</p>
                      <p className="text-xs text-slate-500">{format(new Date(je.entry_date), 'MMM d, yyyy')} • {je.category.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {je.entry_type === 'adjustment_increase' ? '+' : '-'}${je.amount.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}