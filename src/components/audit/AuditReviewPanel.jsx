import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AuditReviewPanel({ transactions, flotillas, committeeMembers, user }) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const queryClient = useQueryClient();

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedTransaction(null);
      setReviewNotes('');
      setReviewStatus('');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => base44.entities.Transaction.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedIds([]);
      setBulkStatus('');
    },
  });

  const handleReview = () => {
    if (!selectedTransaction || !reviewStatus) return;

    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      data: {
        audit_status: reviewStatus,
        audit_reviewed_by: user?.full_name || user?.email,
        audit_review_date: new Date().toISOString().split('T')[0],
        audit_notes: reviewNotes
      }
    });
  };

  const openReviewDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setReviewStatus(transaction.audit_status || 'pending');
    setReviewNotes(transaction.audit_notes || '');
  };

  const handleBulkStatusChange = () => {
    if (selectedIds.length === 0 || !bulkStatus) return;
    
    bulkUpdateMutation.mutate({
      ids: selectedIds,
      data: {
        audit_status: bulkStatus,
        audit_reviewed_by: user?.full_name || user?.email,
        audit_review_date: new Date().toISOString().split('T')[0],
        audit_notes: `Bulk updated to ${bulkStatus}`
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isCommitteeMember = committeeMembers.some(m => 
    m.member_email === user?.email && m.active !== false
  );
  
  const isChair = committeeMembers.some(m => 
    m.member_email === user?.email && m.role === 'chair' && m.active !== false
  );

  const canBulkEdit = isChair || user?.position === 'Division Commander' || user?.access_level === 'super_admin';
  
  const canEditTransactions = user?.access_level === 'super_admin' || user?.access_level === 'division_staff';

  const filteredTransactions = transactions.filter(t => {
    if (filterStatus === 'all') return true;
    return (t.audit_status || 'pending') === filterStatus;
  });

  const flaggedTransactions = transactions.filter(t => t.audit_status === 'flagged');

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
      reviewed: { label: 'Reviewed', className: 'bg-blue-100 text-blue-700' },
      flagged: { label: 'Flagged', className: 'bg-red-100 text-red-700' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Flagged Transactions Alert */}
      {flaggedTransactions.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-lg mb-2">
                {flaggedTransactions.length} Transaction{flaggedTransactions.length > 1 ? 's' : ''} Requiring Attention
              </h3>
              <div className="space-y-2">
                {flaggedTransactions.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{t.description}</p>
                      <p className="text-sm text-red-700 mt-1">
                        <span className="font-medium">Reason:</span> {t.audit_notes || 'No reason provided'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(t.transaction_date), 'MMM d, yyyy')} • ${t.amount?.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openReviewDialog(t)}
                      className="bg-red-600 hover:bg-red-700 ml-3"
                    >
                      Review Now
                    </Button>
                  </div>
                ))}
                {flaggedTransactions.length > 3 && (
                  <p className="text-sm text-red-700 mt-2">
                    + {flaggedTransactions.length - 3} more flagged transaction{flaggedTransactions.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Notice */}
      {!isCommitteeMember && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              You are not currently a committee member. Bulk actions are only available to committee chairs.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {canBulkEdit && selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedIds.length} transaction(s) selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Change status to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkStatusChange}
                disabled={!bulkStatus || bulkUpdateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bulkUpdateMutation.isPending ? 'Updating...' : 'Apply'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">Filter by Status:</label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">
          {filteredTransactions.length} transaction(s)
        </span>
      </div>

      {/* Transactions Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {canBulkEdit && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </TableHead>
              )}
              <TableHead>Date</TableHead>
              <TableHead>Flotilla</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flag Reason</TableHead>
              <TableHead>Reviewed By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canBulkEdit ? 10 : 9} className="text-center text-slate-500 py-8">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map(transaction => {
                const flotilla = flotillas.find(f => f.id === transaction.flotilla_id);
                return (
                  <TableRow key={transaction.id} className={canEditTransactions ? "hover:bg-slate-50" : ""}>
                    {canBulkEdit && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(transaction.id)}
                          onChange={() => toggleSelect(transaction.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {canEditTransactions ? (
                        <Link 
                          to={`${createPageUrl('Transactions')}?edit=${transaction.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                        </Link>
                      ) : (
                        <span>{format(new Date(transaction.transaction_date), 'MMM d, yyyy')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flotilla?.flotilla_number || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.transaction_type === 'income' ? 'default' : 'destructive'}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${transaction.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.audit_status || 'pending')}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {transaction.audit_status === 'flagged' && transaction.audit_notes ? (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-red-700">{transaction.audit_notes}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {transaction.audit_reviewed_by || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openReviewDialog(transaction)}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Review</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6 mt-4">
              {/* Transaction Details */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium">{format(new Date(selectedTransaction.transaction_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="font-medium text-lg">${selectedTransaction.amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <Badge variant={selectedTransaction.transaction_type === 'income' ? 'default' : 'destructive'}>
                      {selectedTransaction.transaction_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="font-medium">{selectedTransaction.category?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-500">Description</p>
                    <p className="font-medium">{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Vendor/Payee</p>
                    <p className="font-medium">{selectedTransaction.vendor_payee || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Approved By</p>
                    <p className="font-medium">{selectedTransaction.approved_by || 'Not approved'}</p>
                  </div>
                  {selectedTransaction.receipt_url && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Receipt</p>
                      <a 
                        href={selectedTransaction.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        View Receipt <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Flag Alert if Currently Flagged */}
              {selectedTransaction.audit_status === 'flagged' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">This transaction is flagged</p>
                      <p className="text-sm text-red-700">{selectedTransaction.audit_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Status */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Audit Status
                </label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed (No Issues)</SelectItem>
                    <SelectItem value="flagged">Flagged (Requires Attention)</SelectItem>
                    <SelectItem value="approved">Approved by Committee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Review Notes */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Audit Notes
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this transaction review..."
                  rows={4}
                />
              </div>

              {/* Previous Review Info */}
              {selectedTransaction.audit_reviewed_by && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">Previous Review</p>
                  <p className="text-sm text-blue-700">
                    Reviewed by {selectedTransaction.audit_reviewed_by} on {selectedTransaction.audit_review_date ? format(new Date(selectedTransaction.audit_review_date), 'MMM d, yyyy') : 'Unknown'}
                  </p>
                  {selectedTransaction.audit_notes && (
                    <p className="text-sm text-blue-600 mt-2">{selectedTransaction.audit_notes}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleReview}
                  disabled={!reviewStatus || updateTransactionMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {updateTransactionMutation.isPending ? 'Saving...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}