import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ReconciliationsList({ reconciliations, isLoading, onEdit, onDelete, onViewDetails }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading reconciliations...</p>
        </CardContent>
      </Card>
    );
  }

  if (reconciliations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reconciliation Periods</h3>
          <p className="text-slate-600">Create your first reconciliation period to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reconciliations.map(recon => {
        const difference = recon.ending_balance - recon.starting_balance;
        
        return (
          <Card key={recon.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    {format(new Date(recon.period_start), 'MMM d, yyyy')} - {format(new Date(recon.period_end), 'MMM d, yyyy')}
                  </CardTitle>
                  {recon.reconciled && recon.reconciled_date && (
                    <p className="text-sm text-slate-600 mt-1">
                      Reconciled on {format(new Date(recon.reconciled_date), 'MMM d, yyyy')}
                      {recon.reconciled_by && ` by ${recon.reconciled_by}`}
                    </p>
                  )}
                </div>
                <Badge className={recon.reconciled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {recon.reconciled ? (
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
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Starting Balance</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${recon.starting_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ending Balance</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${recon.ending_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Difference</p>
                  <p className={`text-xl font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}${difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {recon.notes && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">{recon.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(recon)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(recon)}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => onViewDetails(recon)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}