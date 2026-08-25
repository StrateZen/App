import React, { useState, useEffect } from "react";
import { useRolePermissions } from "../auth/AccessControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BudgetForm({ budget, flotillas, onSubmit, onCancel }) {
  const currentYear = new Date().getFullYear();
  const { user, loading: userLoading, canPerformAction } = useRolePermissions();
  const canCreate = canPerformAction('Budget', 'create');
  const canEdit = canPerformAction('Budget', 'edit');
  const canApprove = canPerformAction('Budget', 'approve');

  const [formData, setFormData] = useState(budget || {
    flotilla_id: "",
    budget_year: currentYear,
    budget_period: "annual",
    period_start: `${currentYear}-01-01`,
    period_end: `${currentYear}-12-31`,
    income_budget: {
      membership_dues: 0,
      donations: 0,
      fundraising_events: 0,
      grants: 0
    },
    expense_budget: {
      boat_maintenance: 0,
      fuel_costs: 0,
      training_materials: 0,
      communications_equipment: 0,
      safety_equipment: 0,
      meeting_expenses: 0,
      administrative_costs: 0,
      uniforms_insignia: 0,
      public_education: 0,
      vessel_examination_supplies: 0,
      event_costs: 0,
      office_supplies: 0,
      other: 0
    },
    approved: false,
    approved_by: "",
    notes: ""
  });

  useEffect(() => {
    if (!budget && flotillas?.length === 1 && !formData.flotilla_id) {
      setFormData(prev => ({
        ...prev,
        flotilla_id: flotillas[0].id
      }));
    }
  }, [flotillas, budget]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleIncomeBudgetChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      income_budget: {
        ...prev.income_budget,
        [category]: parseFloat(value) || 0
      }
    }));
  };

  const handleExpenseBudgetChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      expense_budget: {
        ...prev.expense_budget,
        [category]: parseFloat(value) || 0
      }
    }));
  };

  if (userLoading || !user) return null;

  if (budget && !canEdit) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">You don't have permission to edit budgets.</p>
      </div>
    );
  }

  if (!budget && !canCreate) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">You don't have permission to create budgets.</p>
      </div>
    );
  }

  const totalIncomeBudget = Object.values(formData.income_budget).reduce((sum, val) => sum + val, 0);
  const totalExpenseBudget = Object.values(formData.expense_budget).reduce((sum, val) => sum + val, 0);
  const netBudget = totalIncomeBudget - totalExpenseBudget;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-amber-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            {budget ? 'Edit Budget' : 'Create New Budget'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-3 gap-6">
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

              <div className="space-y-2">
                <Label htmlFor="budget_year">Fiscal Year *</Label>
                <Input
                  id="budget_year"
                  type="number"
                  value={formData.budget_year}
                  onChange={(e) => handleChange('budget_year', parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_period">Budget Period</Label>
                <Select value={formData.budget_period} onValueChange={(val) => handleChange('budget_period', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="period_start">Period Start *</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => handleChange('period_start', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end">Period End *</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => handleChange('period_end', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Budget Amounts */}
            <Tabs defaultValue="income" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Income Budget</TabsTrigger>
                <TabsTrigger value="expense">Expense Budget</TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(formData.income_budget).map(([category, amount]) => (
                    <div key={category} className="space-y-2">
                      <Label htmlFor={category}>
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <Input
                        id={category}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount === 0 ? '' : amount}
                        onChange={(e) => handleIncomeBudgetChange(category, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">Total Income Budget:</span>
                    <span className="text-2xl font-bold text-emerald-600">${totalIncomeBudget.toFixed(2)}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="expense" className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(formData.expense_budget).map(([category, amount]) => (
                    <div key={category} className="space-y-2">
                      <Label htmlFor={category}>
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <Input
                        id={category}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount === 0 ? '' : amount}
                        onChange={(e) => handleExpenseBudgetChange(category, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">Total Expense Budget:</span>
                    <span className="text-2xl font-bold text-red-600">${totalExpenseBudget.toFixed(2)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Net Budget */}
            <div className={`p-4 rounded-lg ${netBudget >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-slate-900">Net Budget (Surplus/Deficit):</span>
                <span className={`text-3xl font-bold ${netBudget >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ${Math.abs(netBudget).toFixed(2)}
                  {netBudget >= 0 ? ' Surplus' : ' Deficit'}
                </span>
              </div>
            </div>

            {/* Approval */}
            {canApprove && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="approved"
                    checked={formData.approved}
                    onCheckedChange={(checked) => handleChange('approved', checked)}
                  />
                  <Label htmlFor="approved">Budget Approved</Label>
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional budget notes or comments"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
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
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                <Save className="w-4 h-4" />
                {budget ? 'Update' : 'Create'} Budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}