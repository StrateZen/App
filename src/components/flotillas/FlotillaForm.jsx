import React, { useState } from "react";
import { useRolePermissions } from "../auth/AccessControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { PhoneInput } from "@/components/ui/phone-input";

export default function FlotillaForm({ flotilla, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(flotilla || {
    flotilla_number: "",
    flotilla_name: "",
    commander_name: "",
    commander_email: "",
    commander_phone: "",
    commander_address: "",
    vice_commander_name: "",
    vice_commander_email: "",
    vice_commander_phone: "",
    vice_commander_address: "",
    fso_fn_name: "",
    fso_fn_email: "",
    fso_fn_phone: "",
    fso_fn_address: "",
    location: "",
    active: true
  });

  const { canPerformAction } = useRolePermissions();

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

  const canCreate = canPerformAction('Flotilla', 'create');
  const canEdit = canPerformAction('Flotilla', 'edit');

  if (flotilla && !canEdit) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">You don't have permission to edit flotillas.</p>
      </div>
    );
  }

  if (!flotilla && !canCreate) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">You don't have permission to create flotillas.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-purple-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            {flotilla ? 'Edit Flotilla' : 'Add New Flotilla'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="flotilla_number">Flotilla Number *</Label>
                <Input
                  id="flotilla_number"
                  placeholder="e.g., 10-1"
                  value={formData.flotilla_number}
                  onChange={(e) => handleChange('flotilla_number', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flotilla_name">Flotilla Name *</Label>
                <Input
                  id="flotilla_name"
                  placeholder="e.g., Tucson"
                  value={formData.flotilla_name}
                  onChange={(e) => handleChange('flotilla_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location/Area Served</Label>
              <Textarea
                id="location"
                placeholder="e.g., Tucson, AZ - Patagonia Lake & Parker Canyon Lake"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                rows={2}
              />
            </div>

            {/* Commander Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Flotilla Commander</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="commander_name">Name</Label>
                  <Input
                    id="commander_name"
                    placeholder="John Doe"
                    value={formData.commander_name}
                    onChange={(e) => handleChange('commander_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commander_email">Email</Label>
                  <Input
                    id="commander_email"
                    type="email"
                    placeholder="commander@uscgaux.net"
                    value={formData.commander_email}
                    onChange={(e) => handleChange('commander_email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commander_phone">Phone</Label>
                  <PhoneInput
                    id="commander_phone"
                    value={formData.commander_phone}
                    onChange={(value) => handleChange('commander_phone', value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="commander_address">Physical Address</Label>
                  <Input
                    id="commander_address"
                    placeholder="123 Main St, City, State ZIP"
                    value={formData.commander_address}
                    onChange={(e) => handleChange('commander_address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Vice Commander Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Flotilla Vice Commander</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vice_commander_name">Name</Label>
                  <Input
                    id="vice_commander_name"
                    placeholder="Jane Smith"
                    value={formData.vice_commander_name}
                    onChange={(e) => handleChange('vice_commander_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vice_commander_email">Email</Label>
                  <Input
                    id="vice_commander_email"
                    type="email"
                    placeholder="vicecommander@uscgaux.net"
                    value={formData.vice_commander_email}
                    onChange={(e) => handleChange('vice_commander_email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vice_commander_phone">Phone</Label>
                  <PhoneInput
                    id="vice_commander_phone"
                    value={formData.vice_commander_phone}
                    onChange={(value) => handleChange('vice_commander_phone', value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vice_commander_address">Physical Address</Label>
                  <Input
                    id="vice_commander_address"
                    placeholder="123 Main St, City, State ZIP"
                    value={formData.vice_commander_address}
                    onChange={(e) => handleChange('vice_commander_address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* FSO-FN Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Flotilla FSO-FN</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fso_fn_name">Name</Label>
                  <Input
                    id="fso_fn_name"
                    placeholder="Jane Smith"
                    value={formData.fso_fn_name}
                    onChange={(e) => handleChange('fso_fn_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fso_fn_email">Email</Label>
                  <Input
                    id="fso_fn_email"
                    type="email"
                    placeholder="fso-fn@uscgaux.net"
                    value={formData.fso_fn_email}
                    onChange={(e) => handleChange('fso_fn_email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fso_fn_phone">Phone</Label>
                  <PhoneInput
                    id="fso_fn_phone"
                    value={formData.fso_fn_phone}
                    onChange={(value) => handleChange('fso_fn_phone', value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fso_fn_address">Physical Address</Label>
                  <Input
                    id="fso_fn_address"
                    placeholder="123 Main St, City, State ZIP"
                    value={formData.fso_fn_address}
                    onChange={(e) => handleChange('fso_fn_address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t border-slate-200 pt-6">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleChange('active', checked)}
              />
              <Label htmlFor="active">Flotilla Active</Label>
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
                {flotilla ? 'Update' : 'Create'} Flotilla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}