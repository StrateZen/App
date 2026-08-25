import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { RequireAuth } from "../components/auth/AccessControl";
import { PhoneInput } from "@/components/ui/phone-input";

export default function DivisionSettingsPage() {
  return (
    <RequireAuth requiredLevel="division_staff">
      <DivisionSettingsContent />
    </RequireAuth>
  );
}

function DivisionSettingsContent() {
  const queryClient = useQueryClient();

  const { data: divisions, isLoading } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => base44.entities.Division.list(),
    initialData: [],
  });

  const division = divisions[0];

  const [formData, setFormData] = useState(division || {
    division_number: "Division 10",
    logo_url: "",
    commander_name: "",
    commander_email: "",
    commander_phone: "",
    commander_address: "",
    vice_commander_name: "",
    vice_commander_email: "",
    vice_commander_phone: "",
    vice_commander_address: "",
    so_fn_name: "",
    so_fn_email: "",
    so_fn_phone: "",
    so_fn_address: ""
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  React.useEffect(() => {
    if (division) {
      setFormData(division);
    }
  }, [division]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Division.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Division.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (division) {
      updateMutation.mutate({ id: division.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('logo_url', file_url);
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
    setIsUploadingLogo(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              {formData.logo_url ? (
                <img 
                  src={formData.logo_url} 
                  alt="Division Logo" 
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Building2 className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Division Settings</h1>
              <p className="text-slate-600 mt-1">Manage Division 10 leadership contact information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-blue-50">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Division Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Division Logo</Label>
                    <div className="flex gap-4 items-center">
                      {formData.logo_url && (
                        <div className="w-20 h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <img 
                            src={formData.logo_url} 
                            alt="Division Logo" 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                        />
                        {isUploadingLogo && <p className="text-sm text-slate-500 mt-1">Uploading...</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="division_number">Division Number</Label>
                    <Input
                      id="division_number"
                      placeholder="Division 10"
                      value={formData.division_number}
                      onChange={(e) => handleChange('division_number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="division_name">Division Name</Label>
                    <Input
                      id="division_name"
                      placeholder="e.g., Lake Powell Division"
                      value={formData.division_name || ''}
                      onChange={(e) => handleChange('division_name', e.target.value)}
                    />
                  </div>
                </div>

                {/* Meeting Location */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Meeting Location</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting_location">Location Name</Label>
                      <Input
                        id="meeting_location"
                        placeholder="e.g., District Office"
                        value={formData.meeting_location || ''}
                        onChange={(e) => handleChange('meeting_location', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meeting_address">Meeting Address</Label>
                      <Input
                        id="meeting_address"
                        placeholder="Street address"
                        value={formData.meeting_address || ''}
                        onChange={(e) => handleChange('meeting_address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Division Commander Section */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Division Commander</h3>
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
                        placeholder="dco@uscgaux.net"
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

                {/* Division Vice Commander Section */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Division Vice Commander</h3>
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
                        placeholder="vdco@uscgaux.net"
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

                {/* Division SO-FN Section */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Division SO-FN</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="so_fn_name">Name</Label>
                      <Input
                        id="so_fn_name"
                        placeholder="SO-FN Name"
                        value={formData.so_fn_name}
                        onChange={(e) => handleChange('so_fn_name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="so_fn_email">Email</Label>
                      <Input
                        id="so_fn_email"
                        type="email"
                        placeholder="so-fn@uscgaux.net"
                        value={formData.so_fn_email}
                        onChange={(e) => handleChange('so_fn_email', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="so_fn_phone">Phone</Label>
                      <PhoneInput
                        id="so_fn_phone"
                        value={formData.so_fn_phone}
                        onChange={(value) => handleChange('so_fn_phone', value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="so_fn_address">Physical Address</Label>
                      <Input
                        id="so_fn_address"
                        placeholder="123 Main St, City, State ZIP"
                        value={formData.so_fn_address}
                        onChange={(e) => handleChange('so_fn_address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <Button
                    type="submit"
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Division Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}