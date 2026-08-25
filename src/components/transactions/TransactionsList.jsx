import React from "react";
import { useRolePermissions } from "../auth/AccessControl";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ExternalLink, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categoryDisplayNames = {
  membership_dues: "Membership Dues",
  donations: "Donations",
  fundraising_events: "Fundraising Events",
  grants: "Grants",
  boat_maintenance: "Boat Maintenance",
  fuel_costs: "Fuel Costs",
  training_materials: "Training Materials",
  communications_equipment: "Communications Equipment",
  safety_equipment: "Safety Equipment",
  meeting_expenses: "Meeting Expenses",
  administrative_costs: "Administrative Costs",
  uniforms_insignia: "Uniforms & Insignia",
  public_education: "Public Education",
  vessel_examination_supplies: "Vessel Examination Supplies",
  event_costs: "Event Costs",
  office_supplies: "Office Supplies",
  other: "Other"
};

export default function TransactionsList({ transactions, flotillas, isLoading, onEdit, onDelete }) {
  const { canPerformAction } = useRolePermissions();
  const canEdit = canPerformAction('Transaction', 'edit');
  const canDelete = canPerformAction('Transaction', 'delete');

  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `${flotilla.flotilla_number}` : 'Unknown';
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Transactions ({transactions.length})
          </CardTitle>
          <div className="text-sm text-slate-600">
            Total: $
            {transactions.reduce((sum, t) => {
              return t.transaction_type === 'income' 
                ? sum + (t.amount || 0) 
                : sum - (t.amount || 0);
            }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Transactions Found</h3>
            <p className="text-slate-500">Add your first transaction to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Flotilla</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor/Payee</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFlotillaName(transaction.flotilla_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.transaction_type === 'income' ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">Income</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 font-medium">Expense</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {categoryDisplayNames[transaction.category] || transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.vendor_payee || '-'}</TableCell>
                    <TableCell className={`text-right font-semibold ${
                      transaction.transaction_type === 'income' 
                        ? 'text-emerald-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      ${formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {transaction.receipt_url && (
                          <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onEdit(transaction)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => onDelete(transaction)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}