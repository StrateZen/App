import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2,
  Users,
  Plus
} from "lucide-react";
import { RequireAuth, useFlotillaFilter } from "../components/auth/AccessControl";
import AuditReviewPanel from "../components/audit/AuditReviewPanel";
import AuditCommitteeManager from "../components/audit/AuditCommitteeManager";

export default function AuditCommitteePage() {
  return (
    <AuditCommitteeAccessControl />
  );
}

function AuditCommitteeAccessControl() {
  const { user, loading } = useFlotillaFilter();
  const [hasAccess, setHasAccess] = React.useState(false);

  const { data: committeeMembers = [] } = useQuery({
    queryKey: ['audit-committee'],
    queryFn: () => base44.entities.AuditCommittee.list(),
  });

  React.useEffect(() => {
    if (user) {
      // Allow division staff and super admin
      if (user.access_level === 'division_staff' || user.access_level === 'super_admin') {
        setHasAccess(true);
      } else {
        // Check if user is an audit committee member
        const isMember = committeeMembers.some(
          member => member.member_email === user.email && member.active
        );
        setHasAccess(isMember);
      }
    }
  }, [user, committeeMembers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    base44.auth.redirectToLogin(window.location.pathname);
    return null;
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">
              You don't have permission to access the Audit Committee.
            </p>
            <p className="text-sm text-slate-500">
              Only Division Commanders and Audit Committee members can access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AuditCommitteeContent />;
}

function AuditCommitteeContent() {
  const [activeTab, setActiveTab] = useState('review');
  const { filterByFlotilla, user } = useFlotillaFilter();

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date'),
  });

  const transactions = filterByFlotilla(allTransactions);

  const { data: allFlotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
  });

  const { data: allCommitteeMembers = [] } = useQuery({
    queryKey: ['audit-committee'],
    queryFn: () => base44.entities.AuditCommittee.list(),
  });

  const committeeMembers = filterByFlotilla(allCommitteeMembers, 'flotilla_id');

  // Statistics
  const pendingReview = transactions.filter(t => 
    !t.audit_status || t.audit_status === 'pending'
  ).length;

  const flaggedItems = transactions.filter(t => 
    t.audit_status === 'flagged'
  ).length;

  const approvedItems = transactions.filter(t => 
    t.audit_status === 'approved'
  ).length;

  const reviewedItems = transactions.filter(t => 
    t.audit_status === 'reviewed'
  ).length;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Audit Committee</h1>
              <p className="text-slate-600 mt-1">Financial review and audit compliance management</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-amber-900">{pendingReview}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium mb-1">Flagged Items</p>
                  <p className="text-3xl font-bold text-red-900">{flaggedItems}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Reviewed</p>
                  <p className="text-3xl font-bold text-blue-900">{reviewedItems}</p>
                </div>
                <FileCheck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-900">{approvedItems}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-sm border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b border-slate-100">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="review">Transaction Review</TabsTrigger>
                <TabsTrigger value="members">Committee Members</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-6">
              <TabsContent value="review" className="mt-0">
                <AuditReviewPanel 
                  transactions={transactions}
                  flotillas={allFlotillas}
                  committeeMembers={committeeMembers}
                  user={user}
                />
              </TabsContent>
              <TabsContent value="members" className="mt-0">
                <AuditCommitteeManager
                  committeeMembers={committeeMembers}
                  flotillas={allFlotillas}
                  user={user}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}