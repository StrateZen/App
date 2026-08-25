import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Save } from "lucide-react";

export default function UserProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    access_level: '',
    position_title: '',
    phone: '',
    email: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        access_level: currentUser.access_level || '',
        position_title: currentUser.position_title || '',
        phone: currentUser.phone || '',
        email: currentUser.email || ''
      });
    } catch (error) {
      console.error("Failed to load user", error);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      alert('Profile updated successfully!');
      loadUser();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>
              <p className="text-slate-600 mt-1">Update your profile information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Full Name</Label>
                <Input value={user.full_name || ''} disabled className="bg-slate-50" />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Email address"
                />
              </div>

              <div>
                <Label>Access Level</Label>
                <Select value={formData.access_level} onValueChange={(val) => handleChange('access_level', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flotilla_staff">Flotilla Staff</SelectItem>
                    <SelectItem value="division_staff">Division Staff</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Position Title</Label>
                <Input
                  value={formData.position_title}
                  onChange={(e) => handleChange('position_title', e.target.value)}
                  placeholder="e.g., FSO-FN, Commander"
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}