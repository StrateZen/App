import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Edit2, Trash2, X, Save, Search } from "lucide-react";
import { RequireAuth } from "../components/auth/AccessControl";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneInput } from "@/components/ui/phone-input";

export default function PayeeVendorsPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <PayeeVendorsContent />
    </RequireAuth>
  );
}

function PayeeVendorsContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingPayeeVendor, setEditingPayeeVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: payeeVendors = [], isLoading } = useQuery({
    queryKey: ['payee-vendors'],
    queryFn: () => base44.entities.PayeeVendor.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PayeeVendor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payee-vendors'] });
      setShowForm(false);
      setEditingPayeeVendor(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PayeeVendor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payee-vendors'] });
      setShowForm(false);
      setEditingPayeeVendor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PayeeVendor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payee-vendors'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingPayeeVendor) {
      updateMutation.mutate({ id: editingPayeeVendor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (payeeVendor) => {
    setEditingPayeeVendor(payeeVendor);
    setShowForm(true);
  };

  const handleDelete = (payeeVendor) => {
    if (window.confirm(`Are you sure you want to delete ${payeeVendor.name}?`)) {
      deleteMutation.mutate(payeeVendor.id);
    }
  };

  const filteredPayeeVendors = payeeVendors.filter(pv =>
    pv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pv.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Payee/Vendor Management</h1>
                <p className="text-slate-600 mt-1">Manage payees and vendors across all flotillas</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingPayeeVendor(null);
                setShowForm(true);
              }}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Add Payee/Vendor
            </Button>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <PayeeVendorForm
              payeeVendor={editingPayeeVendor}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingPayeeVendor(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Search */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">
              All Payees/Vendors ({filteredPayeeVendors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : filteredPayeeVendors.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No payees/vendors found. Add one to get started.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPayeeVendors.map(pv => (
                  <motion.div
                    key={pv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{pv.name}</h3>
                        <div className="mt-2 space-y-1">
                          {pv.email && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Email:</span> {pv.email}
                            </p>
                          )}
                          {pv.phone && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Phone:</span> {pv.phone}
                            </p>
                          )}
                          {pv.address && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Address:</span> {pv.address}
                            </p>
                          )}
                          {pv.notes && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Notes:</span> {pv.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pv)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pv)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayeeVendorForm({ payeeVendor, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(payeeVendor || {
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-purple-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            {payeeVendor ? 'Edit Payee/Vendor' : 'Add New Payee/Vendor'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Company or individual name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, ST 12345"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information"
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
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                {payeeVendor ? 'Update' : 'Add'} Payee/Vendor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}