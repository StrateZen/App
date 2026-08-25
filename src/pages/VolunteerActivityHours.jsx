import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Clock, Search, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth, useFlotillaFilter } from "../components/auth/AccessControl";
import VolunteerActivityForm from "../components/volunteer/VolunteerActivityForm";
import VolunteerActivityList from "../components/volunteer/VolunteerActivityList";

export default function VolunteerActivityHoursPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    base44.auth.redirectToLogin(window.location.pathname);
    return null;
  }

  return <VolunteerActivityHoursContent user={user} />;
}

function VolunteerActivityHoursContent({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCode, setFilterCode] = useState('all');
  const [showGuide, setShowGuide] = useState(false);

  const queryClient = useQueryClient();

  const { data: allActivities, isLoading } = useQuery({
    queryKey: ['volunteer-activities'],
    queryFn: () => base44.entities.VolunteerActivity.list('-date', 1000),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerActivity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
      setShowForm(false);
      setEditingActivity(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VolunteerActivity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
      setShowForm(false);
      setEditingActivity(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VolunteerActivity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
    },
  });

  const handleSubmit = async (activityData) => {
    // Auto-assign flotilla_id from user's first flotilla assignment
    if (!activityData.flotilla_id && user?.role_assignments) {
      const userFlotilla = user.role_assignments.find(r => r.flotilla_id)?.flotilla_id;
      if (userFlotilla) {
        activityData.flotilla_id = userFlotilla;
      }
    }
    
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data: activityData });
    } else {
      createMutation.mutate(activityData);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = (activity) => {
    if (window.confirm('Are you sure you want to delete this activity entry?')) {
      deleteMutation.mutate(activity.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingActivity(null);
  };

  const activities = allActivities.filter(a => a.created_by === user.email);

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.activity_mission?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCode = filterCode === 'all' || a.activity_code === filterCode;
    return matchesSearch && matchesCode;
  });

  const totalHours = filteredActivities.reduce((sum, a) => sum + (a.total_hours || 0), 0);
  const totalMileage = filteredActivities.reduce((sum, a) => sum + (a.mileage || 0), 0);
  const totalExpenses = filteredActivities.reduce((sum, a) => sum + (a.non_reimbursed_expenses || 0), 0);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Volunteer Activity Hours</h1>
                <p className="text-slate-600 mt-1">Track your volunteer hours and missions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowGuide(true)}
                size="sm"
                variant="outline"
                className="gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <BookOpen className="w-4 h-4" />
                Guide
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="gap-3 bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-6 h-6" />
                Log Activity
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-900">{totalHours.toFixed(2)}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Total Mileage</p>
                  <p className="text-3xl font-bold text-green-900">{totalMileage.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium mb-1">Non-Reimbursed $</p>
                  <p className="text-3xl font-bold text-amber-900">${totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <VolunteerActivityForm
            activity={editingActivity}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Filters */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Filter Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterCode} onValueChange={setFilterCode}>
                <SelectTrigger>
                  <SelectValue placeholder="All Activity Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity Codes</SelectItem>
                  <SelectItem value="91A">91A - Vessel Safety Checks</SelectItem>
                  <SelectItem value="91H">91H - VSC Paddlecraft</SelectItem>
                  <SelectItem value="91B">91B - Vessel Facility Inspections</SelectItem>
                  <SelectItem value="91C">91C - Commercial Fishing Vessel Exams</SelectItem>
                  <SelectItem value="91D">91D - Uninspected Passenger Vessel Exams</SelectItem>
                  <SelectItem value="91G">91G - Uninspected Towing Vessel Exams</SelectItem>
                  <SelectItem value="99A">99A - Auxiliary Leadership</SelectItem>
                  <SelectItem value="99B">99B - RBS Support</SelectItem>
                  <SelectItem value="99C">99C - Marine Safety Support</SelectItem>
                  <SelectItem value="99D">99D - Training Support</SelectItem>
                  <SelectItem value="99E">99E - Administrative/Logistical Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <VolunteerActivityList
          activities={filteredActivities}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Mission Code Guide Dialog */}
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-blue-900">Mission Code 99 Category Guide</DialogTitle>
              <p className="text-sm text-slate-600 mt-2">Mission Codes 99 should be used for Mission Preparation, Travel to and from the Mission, and Post Mission paperwork/reporting</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Mission Program Areas */}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 bg-blue-100 p-2 rounded">Mission Program Areas (Mission Codes)</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>AUXMP</strong> - Marine Patrols (01,02,22A,54A,54B,55A)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>CA</strong> - Culinary Affairs (96)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>CS</strong> - Clergy Support (97)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>CV</strong> - Commercial Vessel Outreach & Exams (80,91C-E)</span>
                      <Badge className="bg-green-600">99C</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>CGADMN</strong> - CG Administrative Support (08,92,94)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>CGOPS</strong> - CG Operational Support (07,22,26)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>GOVSUP</strong> - Government Agency Support (41,42,43)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>HS</strong> - Health Services (93)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>IA</strong> - International Affairs (60)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>ICE</strong> - Ice Operations Mission (53)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>LE</strong> - Legal (94)</span>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>LO</strong> - Legislative Outreach (65)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>EM</strong> - Emergency Management (28)</span>
                      <Badge className="bg-green-600">99C</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>MS/MEP</strong> - Marine Safety & Environmental Protection (28G,70,80)</span>
                      <Badge className="bg-green-600">99C</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>MS</strong> - Marine Safety (Staff Officers all levels 70K)</span>
                      <Badge variant="outline">70K</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>MT</strong> - Member Training (06)</span>
                      <Badge className="bg-amber-600">99D</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>NS</strong> - Navigation Systems (03,30,31,32)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>RN</strong> - Auxiliary Radio Operations (20)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>SAR</strong> - Search and Rescue (23,24)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>UMDV</strong> - RBS Program Visits (11) (Marine Dealer Visits)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>UPA</strong> - Public Affairs (including Musicians) (10)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>UPE</strong> - Public Education (14)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>UREC</strong> - Recruiting Assistance (09,90)</span>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <span className="text-sm"><strong>VSC</strong> - Vessel Safety Check (91A,91B,91H)</span>
                      <Badge className="bg-blue-600">99B</Badge>
                    </div>
                  </div>
                </div>

                {/* Other Administrative Activities */}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 bg-blue-100 p-2 rounded">Other Administrative Activities</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Meetings (elected or appointed officers)</p>
                        <p className="text-xs text-slate-600">Meeting time, Pre-meeting prep including arranging for speakers, Travel to and from meeting, Post-meeting follow-up</p>
                      </div>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Meetings - MS Officers all Levels</p>
                        <p className="text-xs text-slate-600">Meeting time, Pre-meeting prep including arranging for speakers, Travel to and from meeting, Post-meeting follow-up</p>
                      </div>
                      <Badge variant="outline">70K</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Meetings - non-officer</p>
                        <p className="text-xs text-slate-600">Meeting time, Pre-meeting prep, Travel to and from meeting, post-meeting follow-up</p>
                      </div>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Meetings (committees at any level)</p>
                        <p className="text-xs text-slate-600">Meeting time, Preparation for meeting, Travel to and from meeting, Post-meeting follow-up</p>
                      </div>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Training (AUXOP, C-school, Online courses)</p>
                        <p className="text-xs text-slate-600">Classroom time, Travel to and from classes, Online time (Except MS (70U) and PA (10G))</p>
                      </div>
                      <Badge className="bg-amber-600">99D</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Study, Homework, Class Preparation – Non-Instructor</p>
                        <p className="text-xs text-slate-600">Study, Homework, Class preparation (Exceptions: MS should be reported as 70U and PA should be reported as mission code 10G)</p>
                      </div>
                      <Badge className="bg-amber-600">99D</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Meeting with prospective members (elected or appointed only)</p>
                        <p className="text-xs text-slate-600">See mission code 90C – Prep and Travel to and from meeting</p>
                      </div>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Mentoring</p>
                        <p className="text-xs text-slate-600">Meetings & communications (phone, email)</p>
                      </div>
                      <Badge className="bg-amber-600">99D</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Conferences (non-instructor) as elected or appointed</p>
                        <p className="text-xs text-slate-600">Conference time, Preconference arrangements, Travel to and from conference, Post-conference follow-up</p>
                      </div>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Attending Conferences (non-instructor) as member</p>
                        <p className="text-xs text-slate-600">Conference time, Preconference arrangements, Travel to and from conference, Post-conference follow-up</p>
                      </div>
                      <Badge className="bg-purple-600">99E</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Administrative activities elected & appointed (Except MS – 70K)</p>
                        <p className="text-xs text-slate-600">Email, Phone calls, records management</p>
                      </div>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">Preparation of Reports (elected & appointed)</p>
                        <p className="text-xs text-slate-600">Preparation of monthly and annual reports</p>
                      </div>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 p-2 border-b">
                      <div>
                        <p className="text-sm font-semibold">FSO, SO, DSO IS data analysis (NOT data entry)</p>
                        <p className="text-xs text-slate-600">AUXDATAQC, report generation, Forms management</p>
                      </div>
                      <Badge className="bg-red-600">99A</Badge>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-bold text-amber-900 mb-2">Important Notes:</h4>
                  <ul className="space-y-1 text-sm text-amber-900">
                    <li><strong>Note 1:</strong> MS Officers at all levels should report all Leadership time as Mission Code 70K rather than 99A used for other staff officers.</li>
                    <li><strong>Note 2:</strong> All IS Officers performing DATA ENTRY should report their data entry time as Mission Code 92.</li>
                  </ul>
                </div>

                {/* Mileage and Expenses */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Mileage and Expenses:</h4>
                  <p className="text-sm text-blue-900">Report Total Miles traveled for the period. Expenses include tolls, parking and lodging for overnight missions. Do NOT include cost of gasoline or vehicle costs related to miles.</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}