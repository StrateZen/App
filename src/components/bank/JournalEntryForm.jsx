import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { motion } from "framer-motion";

export default function JournalEntryForm({ flotillas, bankAccounts, onSubmit, onCancel, userFlotillaId, userName }) {
  const [formData, setFormData] = useState({
    flotilla_id: userFlotillaId || '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'adjustment_increase',
    amount: 0,
    category: 'bank_reconciliation',
    description: '',
    notes: '',
    related_bank_account_id: '',
    approved_by: userName || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Bank accounts are now actual bank accounts, not reconciliation periods
  const filteredBankAccounts = bankAccounts;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-purple-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            New Journal Entry
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Create an adjustment entry to reconcile discrepancies
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid gap-6 ${userFlotillaId ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
              {!userFlotillaId && (
                <div className="space-y-2">
                  <Label htmlFor="flotilla_id">Flotilla *</Label>
                  <Select value={formData.flotilla_id} onValueChange={(val) => handleChange('flotilla_id', val)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flotilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {flotillas.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          Flotilla {f.flotilla_number} - {f.flotilla_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="entry_date">Entry Date *</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => handleChange('entry_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry_type">Entry Type *</Label>
                <Select value={formData.entry_type} onValueChange={(val) => handleChange('entry_type', val)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment_increase">Adjustment - Increase</SelectItem>
                    <SelectItem value="adjustment_decrease">Adjustment - Decrease</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => handleChange('category', val)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_reconciliation">Bank Reconciliation</SelectItem>
                    <SelectItem value="error_correction">Error Correction</SelectItem>
                    <SelectItem value="missing_transaction">Missing Transaction</SelectItem>
                    <SelectItem value="duplicate_removal">Duplicate Removal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="related_bank_account_id">Related Bank Account</Label>
              <Select value={formData.related_bank_account_id} onValueChange={(val) => handleChange('related_bank_account_id', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBankAccounts.map(ba => (
                    <SelectItem key={ba.id} value={ba.id}>
                      {ba.account_name} - {ba.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="Brief description of the adjustment"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Detailed Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Explain the reason for this journal entry and any supporting details..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approved_by">Approved By</Label>
              <Input
                id="approved_by"
                placeholder="Name of approver"
                value={formData.approved_by}
                onChange={(e) => handleChange('approved_by', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Create Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}