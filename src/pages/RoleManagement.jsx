import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, X, Users } from "lucide-react";
import { RequireAuth } from "../components/auth/AccessControl";
import { ROLES, DIVISION_ROLES, FLOTILLA_ROLES } from "../components/auth/RoleConfig";

export default function RoleManagementPage() {
  return (
    <RequireAuth pageName="UserManagement">
      <RoleManagementContent />
    </RequireAuth>
  );
}

function RoleManagementContent() {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFlotilla, setSelectedFlotilla] = useState('');

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedRole('');
      setSelectedFlotilla('');
    },
  });

  const currentUser = users.find(u => u.id === selectedUser);
  const currentRoles = currentUser?.role_assignments || [];

  const handleAddRole = () => {
    if (!selectedUser || !selectedRole) return;

    const newRole = {
      role: selectedRole,
      flotilla_id: FLOTILLA_ROLES.includes(selectedRole) ? selectedFlotilla : null
    };

    // Check if role already exists
    const exists = currentRoles.some(r => 
      r.role === newRole.role && r.flotilla_id === newRole.flotilla_id
    );

    if (exists) {
      alert('This role assignment already exists for this user');
      return;
    }

    const updatedRoles = [...currentRoles, newRole];
    updateUserMutation.mutate({
      userId: selectedUser,
      data: { role_assignments: updatedRoles }
    });
  };

  const handleRemoveRole = (roleIndex) => {
    if (!selectedUser) return;
    
    const updatedRoles = currentRoles.filter((_, idx) => idx !== roleIndex);
    updateUserMutation.mutate({
      userId: selectedUser,
      data: { role_assignments: updatedRoles }
    });
  };

  const isDivisionRoleSelected = DIVISION_ROLES.includes(selectedRole);
  const isFlotillaRoleSelected = FLOTILLA_ROLES.includes(selectedRole);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
              <p className="text-slate-600 mt-1">Assign roles and permissions to users</p>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select User</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Current Roles */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle>Current Role Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {currentRoles.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No roles assigned yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Flotilla</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRoles.map((roleAssignment, idx) => {
                      const flotilla = flotillas.find(f => f.id === roleAssignment.flotilla_id);
                      const isDivRole = DIVISION_ROLES.includes(roleAssignment.role);
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{roleAssignment.role}</TableCell>
                          <TableCell>
                            {flotilla ? `${flotilla.flotilla_number} - ${flotilla.flotilla_name}` : 'Division-wide'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isDivRole ? "default" : "secondary"}>
                              {isDivRole ? 'Division' : 'Flotilla'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRole(idx)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add New Role */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Division Roles</div>
                    {DIVISION_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mt-2">Flotilla Roles</div>
                    {FLOTILLA_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isFlotillaRoleSelected && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Flotilla Assignment</label>
                  <Select value={selectedFlotilla} onValueChange={setSelectedFlotilla}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flotilla..." />
                    </SelectTrigger>
                    <SelectContent>
                      {flotillas.map(flotilla => (
                        <SelectItem key={flotilla.id} value={flotilla.id}>
                          {flotilla.flotilla_number} - {flotilla.flotilla_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isDivisionRoleSelected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Division Role:</strong> This role will have access across all flotillas in the division.
                  </p>
                </div>
              )}

              <Button
                onClick={handleAddRole}
                disabled={!selectedRole || (isFlotillaRoleSelected && !selectedFlotilla)}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Add Role
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Role Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Role Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-slate-900">Division Roles</h3>
                <p className="text-sm text-slate-600 mb-3">Have access across all flotillas</p>
                <div className="space-y-1">
                  {DIVISION_ROLES.map(role => (
                    <Badge key={role} variant="outline" className="mr-2 mb-2">{role}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-slate-900">Flotilla Roles</h3>
                <p className="text-sm text-slate-600 mb-3">Limited to assigned flotilla(s)</p>
                <div className="space-y-1">
                  {FLOTILLA_ROLES.map(role => (
                    <Badge key={role} variant="secondary" className="mr-2 mb-2">{role}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}