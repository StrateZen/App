import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { motion } from "framer-motion";

export default function ReconciliationForm({ reconciliation, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(reconciliation || {
    period_start: '',
    period_end: '',
    starting_balance: 0,
    ending_balance: 0,
    reconciled: false,
    notes: ''
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-blue-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            {reconciliation ? 'Edit Reconciliation Period' : 'New Reconciliation Period'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="period_start">Period Start Date *</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => handleChange('period_start', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end">Period End Date *</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => handleChange('period_end', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="starting_balance">Starting Balance *</Label>
                <Input
                  id="starting_balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.starting_balance}
                  onChange={(e) => handleChange('starting_balance', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ending_balance">Ending Balance *</Label>
                <Input
                  id="ending_balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.ending_balance}
                  onChange={(e) => handleChange('ending_balance', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this reconciliation period..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Reconciliation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}