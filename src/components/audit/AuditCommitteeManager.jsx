import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function AuditCommitteeManager({ committeeMembers, flotillas, user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    flotilla_id: '',
    member_name: '',
    member_email: '',
    role: 'member',
    appointed_date: '',
    term_end_date: '',
    active: true
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AuditCommittee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-committee'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuditCommittee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-committee'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AuditCommittee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-committee'] });
    },
  });

  const resetForm = () => {
    setFormData({
      flotilla_id: '',
      member_name: '',
      member_email: '',
      role: 'member',
      appointed_date: '',
      term_end_date: '',
      active: true
    });
    setEditingMember(null);
    setShowDialog(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      flotilla_id: member.flotilla_id,
      member_name: member.member_name,
      member_email: member.member_email,
      role: member.role,
      appointed_date: member.appointed_date || '',
      term_end_date: member.term_end_date || '',
      active: member.active !== false
    });
    setShowDialog(true);
  };

  const handleDelete = (member) => {
    if (window.confirm(`Remove ${member.member_name} from the audit committee?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Committee Members</h3>
          <p className="text-sm text-slate-600">Manage audit committee membership</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Flotilla</TableHead>
              <TableHead>Appointed</TableHead>
              <TableHead>Term End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {committeeMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  No committee members. Add members to start audit reviews.
                </TableCell>
              </TableRow>
            ) : (
              committeeMembers.map(member => {
                const flotilla = flotillas.find(f => f.id === member.flotilla_id);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.member_name}</TableCell>
                    <TableCell>{member.member_email}</TableCell>
                    <TableCell>
                      <Badge className={member.role === 'chair' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.flotilla_id === 'division' ? (
                        <Badge variant="outline">Division Level</Badge>
                      ) : (
                        <Badge variant="outline">{flotilla?.flotilla_number || 'N/A'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.appointed_date ? format(new Date(member.appointed_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {member.term_end_date ? format(new Date(member.term_end_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={member.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {member.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(member)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Committee Member' : 'Add Committee Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Member Name *</Label>
                <Input
                  required
                  value={formData.member_name}
                  onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={formData.member_email}
                  onChange={(e) => setFormData({...formData, member_email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="chair">Chair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Flotilla/Division *</Label>
                <Select value={formData.flotilla_id} onValueChange={(val) => setFormData({...formData, flotilla_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="division">Division Level</SelectItem>
                    {flotillas.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.flotilla_number} - {f.flotilla_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Appointed Date</Label>
                <Input
                  type="date"
                  value={formData.appointed_date}
                  onChange={(e) => setFormData({...formData, appointed_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Term End Date</Label>
                <Input
                  type="date"
                  value={formData.term_end_date}
                  onChange={(e) => setFormData({...formData, term_end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingMember ? 'Update' : 'Add'} Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}