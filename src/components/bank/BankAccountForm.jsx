import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { PhoneInput } from "@/components/ui/phone-input";

export default function BankAccountForm({ account, flotillas, onSubmit, onCancel, userFlotillaId }) {
  const [formData, setFormData] = useState(account || {
    flotilla_id: userFlotillaId || '',
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_branch: '',
    bank_address: '',
    bank_phone: '',
    bank_email: '',
    primary_signer: '',
    secondary_signer: '',
    additional_signers: '',
    active: true,
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
            {account ? 'Edit Bank Account' : 'New Bank Account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Flotilla Selection */}
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

            {/* Account Information */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name *</Label>
                  <Input
                    id="account_name"
                    placeholder="e.g., Operating Account"
                    value={formData.account_name}
                    onChange={(e) => handleChange('account_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    placeholder="Full account number"
                    value={formData.account_number}
                    onChange={(e) => handleChange('account_number', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Bank Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name *</Label>
                  <Input
                    id="bank_name"
                    placeholder="e.g., First National Bank"
                    value={formData.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_branch">Branch Name</Label>
                  <Input
                    id="bank_branch"
                    placeholder="e.g., Downtown Branch"
                    value={formData.bank_branch}
                    onChange={(e) => handleChange('bank_branch', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bank_address">Branch Address</Label>
                  <Input
                    id="bank_address"
                    placeholder="123 Main St, City, State ZIP"
                    value={formData.bank_address}
                    onChange={(e) => handleChange('bank_address', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_phone">Bank Phone</Label>
                  <PhoneInput
                    id="bank_phone"
                    value={formData.bank_phone}
                    onChange={(value) => handleChange('bank_phone', value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_email">Bank Email</Label>
                  <Input
                    id="bank_email"
                    type="email"
                    placeholder="branch@bank.com"
                    value={formData.bank_email}
                    onChange={(e) => handleChange('bank_email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Authorized Signers */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Authorized Signers</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary_signer">Primary Signer</Label>
                  <Input
                    id="primary_signer"
                    placeholder="Full name"
                    value={formData.primary_signer}
                    onChange={(e) => handleChange('primary_signer', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_signer">Secondary Signer</Label>
                  <Input
                    id="secondary_signer"
                    placeholder="Full name"
                    value={formData.secondary_signer}
                    onChange={(e) => handleChange('secondary_signer', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="additional_signers">Additional Signers</Label>
                  <Input
                    id="additional_signers"
                    placeholder="Comma-separated names"
                    value={formData.additional_signers}
                    onChange={(e) => handleChange('additional_signers', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this account..."
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
                Save Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}