import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Edit, Search, Plus, X } from "lucide-react";
import { RequireAuth, useRolePermissions } from "../components/auth/AccessControl";
import { ROLES, DIVISION_ROLES, FLOTILLA_ROLES, isSuperAdmin, canManageUser } from "../components/auth/RoleConfig";
import { Badge } from "@/components/ui/badge";

export default function UserManagementPage() {
  return (
    <RequireAuth pageName="UserManagement">
      <UserManagementContent />
    </RequireAuth>
  );
}

function UserManagementContent() {
  const { getUserRoles } = useRolePermissions();
  const currentUserRoles = getUserRoles();
  const isCurrentUserSuperAdmin = isSuperAdmin(currentUserRoles);
  
  // Check if user can add new users (Super Admin, SO-IS, FSO-IS)
  const canAddUsers = isCurrentUserSuperAdmin || 
    currentUserRoles.some(r => r.role === 'SO-IS' || r.role === 'FSO-IS');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.functions.invoke('updateUserRoleAssignments', {
      userId: id,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowEditDialog(false);
      setEditingUser(null);
      alert('User saved successfully!');
    },
    onError: (error) => {
      alert(`Failed to save user: ${error?.message || 'Unknown error'}`);
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowAddDialog(false);
      setNewUserEmail('');
      alert('User invitation sent successfully!');
    },
    onError: (error) => {
      alert(`Failed to invite user: ${error.message}`);
    },
  });

  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFlotilla, setSelectedFlotilla] = useState('');

  const handleEdit = (user) => {
    if (!canManageUser(currentUserRoles, user)) {
      alert('You do not have permission to manage this user');
      return;
    }
    
    const roleAssignments = user.role_assignments || user.data?.role_assignments || [];
    setEditingUser({
      ...user,
      phone: user.phone || user.data?.phone || '',
      auxid: user.auxid || user.data?.auxid || '',
      address: user.address || user.data?.address || '',
      role_assignments: roleAssignments,
      isEditingSuperAdmin: isSuperAdmin(roleAssignments)
    });
    setShowEditDialog(true);
    setSelectedRole('');
    setSelectedFlotilla('');
  };

  const handleSave = () => {
    if (editingUser) {
      const updateData = {
        phone: editingUser.phone || '',
        auxid: editingUser.auxid || '',
        address: editingUser.address || '',
        role_assignments: editingUser.role_assignments || [],
      };
      updateUserMutation.mutate({ id: editingUser.id, data: updateData });
    }
  };

  const handleAddUser = () => {
    if (!newUserEmail || !newUserEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Invite as user role - they can be assigned specific roles after registration
    inviteUserMutation.mutate({ email: newUserEmail, role: 'user' });
  };

  const handleChange = (field, value) => {
    setEditingUser(prev => ({ ...prev, [field]: value }));
  };

  const handleAddRole = () => {
    if (!selectedRole) return;

    const newRole = {
      role: selectedRole,
      flotilla_id: FLOTILLA_ROLES.includes(selectedRole) ? selectedFlotilla : null
    };

    // Validate permission to assign this role
    const isDivisionLeader = currentUserRoles.some(r => 
      (r.role === ROLES.DIVISION_COMMANDER || r.role === ROLES.VICE_DIVISION_COMMANDER) && !r.flotilla_id
    );
    
    const isFlotillaLeader = currentUserRoles.some(r => 
      (r.role === ROLES.FLOTILLA_COMMANDER || r.role === ROLES.VICE_FLOTILLA_COMMANDER) && r.flotilla_id
    );
    
    // Division leaders cannot assign Super Admin
    if (!isCurrentUserSuperAdmin && selectedRole === ROLES.SUPER_ADMIN) {
      alert('Only Super Admins can assign Super Admin role');
      return;
    }
    
    // Flotilla leaders can only assign flotilla roles
    if (isFlotillaLeader && !isCurrentUserSuperAdmin && !isDivisionLeader) {
      if (!FLOTILLA_ROLES.includes(selectedRole)) {
        alert('You can only assign Flotilla-level roles');
        return;
      }
    }

    const currentRoles = editingUser.role_assignments || [];
    const exists = currentRoles.some(r => 
      r.role === newRole.role && r.flotilla_id === newRole.flotilla_id
    );

    if (exists) {
      alert('This role assignment already exists');
      return;
    }

    // Check if user being edited is admin or super admin
    const targetUserIsAdmin = currentRoles.some(r => 
      r.role === ROLES.SUPER_ADMIN || 
      r.role === ROLES.DIVISION_COMMANDER || 
      r.role === ROLES.VICE_DIVISION_COMMANDER ||
      r.role.startsWith('SO-')
    );
    
    const newRoleIsAdmin = selectedRole === ROLES.SUPER_ADMIN || 
      selectedRole === ROLES.DIVISION_COMMANDER || 
      selectedRole === ROLES.VICE_DIVISION_COMMANDER ||
      selectedRole.startsWith('SO-');

    // Check if adding this role would create multiple flotilla assignments for non-admin users
    if (FLOTILLA_ROLES.includes(selectedRole) && selectedFlotilla) {
      const existingFlotillas = currentRoles
        .filter(r => r.flotilla_id)
        .map(r => r.flotilla_id);
      
      const uniqueFlotillas = new Set([...existingFlotillas, selectedFlotilla]);
      
      // Only allow multiple flotillas for admins/super admins
      if (uniqueFlotillas.size > 1 && !targetUserIsAdmin && !newRoleIsAdmin) {
        alert('Regular users can only be assigned to one flotilla. Only admins and super admins can have multiple flotilla assignments.');
        return;
      }
    }

    setEditingUser(prev => ({
      ...prev,
      role_assignments: [...currentRoles, newRole]
    }));
    setSelectedRole('');
    setSelectedFlotilla('');
  };

  const handleRemoveRole = (roleIndex) => {
    setEditingUser(prev => ({
      ...prev,
      role_assignments: prev.role_assignments.filter((_, idx) => idx !== roleIndex)
    }));
  };

  // Normalize user objects - SDK may return role_assignments nested in data or at top level
  const normalizedUsers = users.map(u => ({
    ...u,
    phone: u.phone ?? u.data?.phone ?? '',
    auxid: u.auxid ?? u.data?.auxid ?? '',
    address: u.address ?? u.data?.address ?? '',
    role_assignments: u.role_assignments ?? u.data?.role_assignments ?? [],
  }));

  const filteredUsers = normalizedUsers.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter users based on management permissions
    if (!matchesSearch) return false;
    return canManageUser(currentUserRoles, u);
  });

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
              <p className="text-slate-600 mt-1">Manage user role assignments</p>
            </div>
            {canAddUsers && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingUsers ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Roles</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const userRoles = user.role_assignments || [];
                      
                      return (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900">{user.full_name || '-'}</td>
                          <td className="p-4 text-slate-600">{user.email}</td>
                          <td className="p-4">
                            {userRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {userRoles.slice(0, 2).map((ra, idx) => {
                                  const flotilla = flotillas.find(f => f.id === ra.flotilla_id);
                                  return (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {ra.role}
                                      {flotilla && ` (${flotilla.flotilla_number})`}
                                    </Badge>
                                  );
                                })}
                                {userRoles.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{userRoles.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-sm">No roles</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              className="gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser?.full_name}</DialogTitle>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={editingUser.email} disabled className="bg-slate-50" />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editingUser.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <Label>AuxID</Label>
                    <Input
                      value={editingUser.auxid || ''}
                      onChange={(e) => handleChange('auxid', e.target.value)}
                      placeholder="Auxiliary ID"
                    />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={editingUser.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Physical address"
                  />
                </div>

                <div>
                  <Label className="mb-3 block font-semibold text-base">Role Assignments</Label>
                    
                    {/* Current Roles */}
                    {editingUser.role_assignments?.length > 0 && (
                      <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Current Roles:</p>
                        <div className="space-y-2">
                          {editingUser.role_assignments.map((ra, idx) => {
                            const flotilla = flotillas.find(f => f.id === ra.flotilla_id);
                            const isDivRole = DIVISION_ROLES.includes(ra.role);
                            
                            return (
                              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <Badge variant={isDivRole ? "default" : "secondary"}>
                                    {ra.role}
                                  </Badge>
                                  {flotilla && (
                                    <span className="text-sm text-slate-600">
                                      @ {flotilla.flotilla_number}
                                    </span>
                                  )}
                                  {!ra.flotilla_id && (
                                    <span className="text-sm text-blue-600 font-medium">Division-wide</span>
                                  )}
                                </div>
                                {(isCurrentUserSuperAdmin || ra.role !== ROLES.SUPER_ADMIN) && (
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => handleRemoveRole(idx)}
                                   className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                 >
                                   <X className="w-4 h-4" />
                                 </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add New Role */}
                    <div className="p-4 border border-slate-200 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-slate-700">Add New Role:</p>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Role/Position</Label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role..." />
                            </SelectTrigger>
                            <SelectContent>
                              {isCurrentUserSuperAdmin && (
                                <>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-red-600">Super Admin</div>
                                  <SelectItem value={ROLES.SUPER_ADMIN}>{ROLES.SUPER_ADMIN}</SelectItem>
                                </>
                              )}
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Division Roles</div>
                              {DIVISION_ROLES.filter(role => role !== ROLES.SUPER_ADMIN).map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mt-2">Flotilla Roles</div>
                              {FLOTILLA_ROLES.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {FLOTILLA_ROLES.includes(selectedRole) && (
                          <div>
                            <Label className="text-xs">Flotilla Assignment</Label>
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
                      </div>

                      {DIVISION_ROLES.includes(selectedRole) && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs text-blue-800">
                            <strong>Division Role:</strong> Access across all flotillas
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleAddRole}
                        disabled={!selectedRole || (FLOTILLA_ROLES.includes(selectedRole) && !selectedFlotilla)}
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Role
                      </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={updateUserMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
                <p className="text-xs text-slate-500 mt-1">
                  An invitation will be sent to this email address
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  The user will receive an invitation email and can register. After registration, you can assign them specific roles and access.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddUser}
                  disabled={inviteUserMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}