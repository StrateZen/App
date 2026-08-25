import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useRolePermissions } from "../auth/AccessControl";

export default function TransactionForm({ transaction, flotillas, onSubmit, onCancel }) {
  const { user, loading: userLoading, canPerformAction } = useRolePermissions();
  const canCreate = canPerformAction('Transaction', 'create');
  const canEdit = canPerformAction('Transaction', 'edit');
  const canApprove = canPerformAction('Transaction', 'approve');

  const [formData, setFormData] = useState(transaction || {
    flotilla_id: "",
    transaction_type: "expense",
    category: "",
    description: "",
    amount: "",
    transaction_date: new Date().toISOString().split('T')[0],
    method: "check",
    check_number: "",
    authorization: "routine",
    vendor_payee: "",
    vendor_email: "",
    vendor_address: "",
    receipt_url: "",
    approved_by: "",
    audit_status: "pending",
    notes: ""
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isNewPayeeVendor, setIsNewPayeeVendor] = useState(false);
  const [allPayeeVendors, setAllPayeeVendors] = useState([]);

  useEffect(() => {
    loadPayeeVendors();
  }, []);

  const loadPayeeVendors = async () => {
    const pvs = await base44.entities.PayeeVendor.list('name');
    setAllPayeeVendors(pvs);
  };

  useEffect(() => {
    if (!transaction && user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length === 1) {
      setFormData(prev => ({
        ...prev,
        flotilla_id: user.flotilla_ids[0]
      }));
    }
  }, [user, transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that either email or address is provided for expenses only
    if (formData.transaction_type === 'expense' && !formData.vendor_email && !formData.vendor_address) {
      alert('Please provide either an email or address for the vendor/payee');
      return;
    }
    
    // Validate check number if payment method is check
    if (formData.method === 'check' && !formData.check_number) {
      alert('Please provide a check number');
      return;
    }
    
    // If this is a new payee/vendor for an expense, create it in the database
    if (formData.transaction_type === 'expense' && isNewPayeeVendor && formData.vendor_payee) {
      const existingPayeeVendor = allPayeeVendors.find(pv => pv.name === formData.vendor_payee);
      if (!existingPayeeVendor) {
        await base44.entities.PayeeVendor.create({
          name: formData.vendor_payee,
          email: formData.vendor_email || undefined,
          address: formData.vendor_address || undefined
        });
        await loadPayeeVendors(); // Refresh the list
      }
    }
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('receipt_url', file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  // Get categories dynamically from Budget schema
  const getCategoriesFromBudget = () => {
    const incomeCategories = [
      { value: 'member_dues', label: 'Member Dues' },
      { value: 'flotilla_dues', label: 'Flotilla Dues' },
      { value: 'division_dues', label: 'Division Dues' },
      { value: 'district_dues', label: 'District Dues' },
      { value: 'national_dues', label: 'National Dues' },
      { value: 'donations', label: 'Donations' },
      { value: 'fundraising_events', label: 'Fundraising Events' },
      { value: 'grants', label: 'Grants' },
      { value: 'events', label: 'Events' },
      { value: '4th_cornerstone_events', label: '4th Cornerstone — Events' },
      { value: 'refunds_reimbursements', label: 'Refunds/Reimbursements' },
      { value: 'course_fees', label: 'Course Fees' }
    ].sort((a, b) => a.label.localeCompare(b.label));

    const expenseCategories = [
      { value: 'boat_maintenance', label: 'Boat Maintenance' },
      { value: 'fuel_costs', label: 'Fuel Costs' },
      { value: 'training_materials', label: 'Training Materials' },
      { value: 'communications_equipment', label: 'Communications Equipment' },
      { value: 'safety_equipment', label: 'Safety Equipment' },
      { value: 'meeting_expenses', label: 'Meeting Expenses' },
      { value: 'administrative_costs', label: 'Administrative Costs' },
      { value: 'uniforms_insignia', label: 'Uniforms & Insignia' },
      { value: 'public_education', label: 'Public Education' },
      { value: 'public_education_materials', label: 'Public Education Materials' },
      { value: 'vessel_examination_supplies', label: 'Vessel Examination Supplies' },
      { value: 'vessel_exams', label: 'Vessel Exams' },
      { value: 'event_costs', label: 'Event Costs' },
      { value: 'office_supplies', label: 'Office Supplies' },
      { value: 'course_fees_owed', label: 'Course Fees Owed' },
      { value: 'division_dues', label: 'Division Dues' },
      { value: 'district_dues', label: 'District Dues' },
      { value: 'national_dues', label: 'National Dues' },
      { value: 'budget', label: 'Budget' },
      { value: 'awards_trophies', label: 'Awards/Trophies' },
      { value: 'other', label: 'Other' }
    ].sort((a, b) => a.label.localeCompare(b.label));

    return {
      income: incomeCategories,
      expense: expenseCategories
    };
  };

  const categories = getCategoriesFromBudget();

  if (userLoading || !user) return null;

  if (transaction && !canEdit) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">You don't have permission to edit transactions.</p>
      </div>
    );
  }

  if (!transaction && !canCreate) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">You don't have permission to create transactions.</p>
      </div>
    );
  }

  const handlePayeeVendorChange = (value) => {
    if (value === '__new__') {
      setIsNewPayeeVendor(true);
      handleChange('vendor_payee', '');
      handleChange('vendor_email', '');
      handleChange('vendor_address', '');
    } else {
      setIsNewPayeeVendor(false);
      handleChange('vendor_payee', value);
      
      // Auto-fill email and address from PayeeVendor entity
      const payeeVendor = allPayeeVendors.find(pv => pv.name === value);
      if (payeeVendor) {
        if (payeeVendor.email) handleChange('vendor_email', payeeVendor.email);
        if (payeeVendor.address) handleChange('vendor_address', payeeVendor.address);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-emerald-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {(user?.access_level === 'super_admin' || user?.access_level === 'division_staff' || (user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length > 1)) && (
                <div className="space-y-2">
                  <Label htmlFor="flotilla_id">Flotilla *</Label>
                  <Select value={formData.flotilla_id} onValueChange={(val) => handleChange('flotilla_id', val)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flotilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {flotillas.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.flotilla_number} - {f.flotilla_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="transaction_type">Type *</Label>
                <Select 
                  value={formData.transaction_type} 
                  onValueChange={(val) => {
                    handleChange('transaction_type', val);
                    handleChange('category', '');
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => handleChange('category', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[formData.transaction_type].map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_date">Date *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleChange('transaction_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_payee">
                  {formData.transaction_type === 'income' ? 'Source Description *' : 'Payee/Vendor *'}
                </Label>
                {formData.transaction_type === 'expense' && !isNewPayeeVendor ? (
                  <Select value={formData.vendor_payee} onValueChange={handlePayeeVendorChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or add new payee/vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__">+ Add New Payee/Vendor</SelectItem>
                      {allPayeeVendors.map(pv => (
                        <SelectItem key={pv.id} value={pv.name}>
                          {pv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : formData.transaction_type === 'expense' && isNewPayeeVendor ? (
                  <div className="space-y-2">
                    <Input
                      id="vendor_payee"
                      placeholder="Enter new payee/vendor name"
                      value={formData.vendor_payee}
                      onChange={(e) => handleChange('vendor_payee', e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsNewPayeeVendor(false);
                        handleChange('vendor_payee', '');
                      }}
                    >
                      Cancel - Select Existing
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="vendor_payee"
                    placeholder="Enter income source description"
                    value={formData.vendor_payee}
                    onChange={(e) => handleChange('vendor_payee', e.target.value)}
                    required
                  />
                )}
              </div>
            </div>

            {formData.transaction_type === 'expense' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vendor_email">Payee/Vendor Email {!formData.vendor_address && '*'}</Label>
                  <Input
                    id="vendor_email"
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.vendor_email}
                    onChange={(e) => handleChange('vendor_email', e.target.value)}
                    required={!formData.vendor_address}
                  />
                  <p className="text-xs text-slate-500">Email OR Address required</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_address">Payee/Vendor Address {!formData.vendor_email && '*'}</Label>
                  <Input
                    id="vendor_address"
                    placeholder="123 Main St, City, ST 12345"
                    value={formData.vendor_address}
                    onChange={(e) => handleChange('vendor_address', e.target.value)}
                    required={!formData.vendor_email}
                  />
                  <p className="text-xs text-slate-500">Email OR Address required</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the transaction"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={formData.method} onValueChange={(val) => handleChange('method', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.method === 'check' && (
                <div className="space-y-2">
                  <Label htmlFor="check_number">Check Number *</Label>
                  <Input
                    id="check_number"
                    placeholder="Enter check number"
                    value={formData.check_number}
                    onChange={(e) => handleChange('check_number', e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="authorization">Authorization</Label>
                <Select value={formData.authorization} onValueChange={(val) => handleChange('authorization', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authorization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canApprove && (
                <div className="space-y-2">
                  <Label htmlFor="approved_by">Approved By</Label>
                  <Select value={formData.approved_by} onValueChange={(val) => handleChange('approved_by', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flotilla Commander">Flotilla Commander</SelectItem>
                      <SelectItem value="Vice Flotilla Commander">Vice Flotilla Commander</SelectItem>
                      <SelectItem value="Division Commander">Division Commander</SelectItem>
                      <SelectItem value="Vice Division Commander">Vice Division Commander</SelectItem>
                      <SelectItem value="SO-FN">SO-FN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt/Documentation</Label>
              <div className="flex gap-3">
                <Input
                  id="receipt"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {formData.receipt_url && (
                  <a href={formData.receipt_url} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" size="sm">
                      View Receipt
                    </Button>
                  </a>
                )}
              </div>
              {isUploading && <p className="text-sm text-slate-500">Uploading...</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4" />
                {transaction ? 'Update' : 'Create'} Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}