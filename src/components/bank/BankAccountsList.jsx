import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function BankAccountsList({ accounts, flotillas, isLoading, onEdit, onDelete, onReconcile }) {
  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `Flotilla ${flotilla.flotilla_number}` : 'Unknown';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading bank accounts...</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Bank Accounts</h3>
          <p className="text-slate-600">Create your first bank account record to start reconciliation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map(account => {
        const difference = account.ending_balance - account.starting_balance;
        
        return (
          <Card key={account.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    {account.account_name}
                    {account.account_number_last4 && (
                      <span className="text-slate-500 font-normal"> (****{account.account_number_last4})</span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    {getFlotillaName(account.flotilla_id)} • {format(new Date(account.period_start), 'MMM d, yyyy')} - {format(new Date(account.period_end), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge className={account.reconciled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {account.reconciled ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Reconciled
                    </>
                  ) : (
                    'Pending'
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Starting Balance</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${account.starting_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ending Balance</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${account.ending_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Difference</p>
                  <p className={`text-xl font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <p className="text-sm font-medium text-slate-900">
                    {account.reconciled && account.reconciled_date 
                      ? `Reconciled on ${format(new Date(account.reconciled_date), 'MMM d, yyyy')}`
                      : 'Not reconciled'}
                  </p>
                </div>
              </div>

              {account.notes && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">{account.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(account)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(account)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => onReconcile(account)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Reconcile
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}