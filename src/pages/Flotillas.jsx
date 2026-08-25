import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Users, Mail } from "lucide-react";
import { RequireAuth, useFlotillaFilter } from "../components/auth/AccessControl";

import FlotillaForm from "../components/flotillas/FlotillaForm";
import FlotillasList from "../components/flotillas/FlotillasList";

export default function FlotillasPage() {
  return (
    <RequireAuth requiredLevel="flotilla_staff">
      <FlotillasContent />
    </RequireAuth>
  );
}

function FlotillasContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingFlotilla, setEditingFlotilla] = useState(null);
  const { canAccessFlotilla, user } = useFlotillaFilter();

  const queryClient = useQueryClient();

  const { data: allFlotillas, isLoading } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list('-created_date'),
    initialData: [],
  });

  console.log('Flotillas Page - User:', user);
  console.log('All Flotillas:', allFlotillas);

  const flotillas = user?.access_level === 'flotilla_staff' && user?.flotilla_ids?.length > 0
    ? allFlotillas.filter(f => user.flotilla_ids.includes(f.id))
    : allFlotillas;

  console.log('Filtered Flotillas:', flotillas);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Flotilla.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flotillas'] });
      setShowForm(false);
      setEditingFlotilla(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flotilla.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flotillas'] });
      setShowForm(false);
      setEditingFlotilla(null);
    },
  });

  const handleSubmit = async (flotillaData) => {
    if (editingFlotilla) {
      updateMutation.mutate({ id: editingFlotilla.id, data: flotillaData });
    } else {
      createMutation.mutate(flotillaData);
    }
  };

  const handleEdit = (flotilla) => {
    if (!canAccessFlotilla(flotilla.id)) {
      alert('You do not have permission to edit this flotilla');
      return;
    }
    setEditingFlotilla(flotilla);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFlotilla(null);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Flotilla Management</h1>
                <p className="text-slate-600 mt-1">Manage Division 10 flotillas and their leadership</p>
              </div>
            </div>
            {(user?.access_level === 'super_admin' || user?.access_level === 'division_staff') && (
              <Button
                onClick={() => setShowForm(true)}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Add Flotilla
              </Button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <FlotillaForm
            flotilla={editingFlotilla}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Flotillas List */}
        <FlotillasList
          flotillas={flotillas}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}