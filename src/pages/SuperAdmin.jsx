import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  Users, 
  Activity, 
  Clock, 
  Calendar,
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import { RequireAuth } from "../components/auth/AccessControl";
import FeatureFlagsPanel from "../components/settings/FeatureFlagsPanel";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";

export default function SuperAdminPage() {
  return (
    <RequireAuth requiredLevel="super_admin">
      <SuperAdminContent />
    </RequireAuth>
  );
}

function SuperAdminContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('all');

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-updated_date'),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-created_date', 100),
  });

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
  });

  // Calculate user statistics
  const getUserStats = (user) => {
    const lastLogin = user.updated_date ? new Date(user.updated_date) : null;
    const accountAge = user.created_date ? new Date(user.created_date) : null;
    
    // Count user activities
    const userTransactions = transactions.filter(t => t.created_by === user.email);
    const userBudgets = budgets.filter(b => b.created_by === user.email);
    
    return {
      lastLogin,
      accountAge,
      transactionCount: userTransactions.length,
      budgetCount: userBudgets.length,
      totalActivity: userTransactions.length + userBudgets.length
    };
  };

  // System-wide statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => {
    const lastActivity = new Date(u.updated_date);
    const daysSinceActivity = differenceInMinutes(new Date(), lastActivity) / (60 * 24);
    return daysSinceActivity <= 30;
  }).length;

  const usersByAccessLevel = {
    super_admin: users.filter(u => u.access_level === 'super_admin').length,
    division_staff: users.filter(u => u.access_level === 'division_staff').length,
    flotilla_staff: users.filter(u => u.access_level === 'flotilla_staff').length,
  };

  // Recent audit trail
  const recentActivities = [
    ...transactions.slice(0, 20).map(t => ({
      type: 'transaction',
      action: 'Created Transaction',
      user: t.created_by,
      details: `${t.description} - $${t.amount}`,
      timestamp: t.created_date
    })),
    ...budgets.slice(0, 20).map(b => ({
      type: 'budget',
      action: 'Created Budget',
      user: b.created_by,
      details: `FY ${b.budget_year} ${b.budget_period}`,
      timestamp: b.created_date
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccessLevel = filterAccessLevel === 'all' || u.access_level === filterAccessLevel;
    return matchesSearch && matchesAccessLevel;
  });

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">System monitoring, user activity, and audit trails</p>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <FeatureFlagsPanel />

        {/* System Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900">{totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Active Users (30d)</p>
                  <p className="text-3xl font-bold text-green-900">{activeUsers}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Recent Activities</p>
                  <p className="text-3xl font-bold text-purple-900">{recentActivities.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium mb-1">Super Admins</p>
                  <p className="text-3xl font-bold text-amber-900">{usersByAccessLevel.super_admin}</p>
                </div>
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Level Breakdown */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">User Distribution by Access Level</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium mb-1">Super Admins</p>
                <p className="text-2xl font-bold text-purple-900">{usersByAccessLevel.super_admin}</p>
                <p className="text-xs text-purple-600 mt-1">Full system access</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">Division Staff</p>
                <p className="text-2xl font-bold text-blue-900">{usersByAccessLevel.division_staff}</p>
                <p className="text-xs text-blue-600 mt-1">Division-level access</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">Flotilla Staff</p>
                <p className="text-2xl font-bold text-green-900">{usersByAccessLevel.flotilla_staff}</p>
                <p className="text-xs text-green-600 mt-1">Flotilla-level access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterAccessLevel} onValueChange={setFilterAccessLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Levels</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="division_staff">Division Staff</SelectItem>
                  <SelectItem value="flotilla_staff">Flotilla Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Table */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">
              User Activity Monitor ({filteredUsers.length} users)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Account Age</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-center">Budgets</TableHead>
                    <TableHead className="text-center">Total Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => {
                    const stats = getUserStats(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            user.access_level === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                            user.access_level === 'division_staff' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }>
                            {user.access_level || 'Not Set'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stats.lastLogin ? (
                            <div>
                              <p className="text-sm text-slate-900">
                                {formatDistanceToNow(stats.lastLogin, { addSuffix: true })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(stats.lastLogin, 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.accountAge ? (
                            <div>
                              <p className="text-sm text-slate-900">
                                {formatDistanceToNow(stats.accountAge)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(stats.accountAge, 'MMM d, yyyy')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{stats.transactionCount}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{stats.budgetCount}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-indigo-100 text-indigo-700">
                            {stats.totalActivity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Audit Trail (Last 50 Activities)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={
                          activity.type === 'transaction' ? 'bg-blue-100 text-blue-700' :
                          activity.type === 'budget' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {activity.action}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900">
                          {activity.user}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{activity.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}