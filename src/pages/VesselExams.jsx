import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Anchor, Plus, Search, FileText, Calendar, ShieldAlert } from "lucide-react";
import { RequireAuth, useRolePermissions, hasQualification } from "../components/auth/AccessControl";
import VesselExamForm7012 from "../components/vesselexams/VesselExamForm7012";
import VesselExamForm7066 from "../components/vesselexams/VesselExamForm7066";
import VesselExamForm7008 from "../components/vesselexams/VesselExamForm7008";
import VesselExamForm7003 from "../components/vesselexams/VesselExamForm7003";
import VesselExamsList from "../components/vesselexams/VesselExamsList";

export default function VesselExamsPage() {
  return (
    <RequireAuth pageName="VesselExams">
      <VesselExamsContent />
    </RequireAuth>
  );
}

function VesselExamsContent() {
  const { user, getUserFlotillaIds } = useRolePermissions();
  const userFlotillaIds = getUserFlotillaIds();

  // Recording an exam requires a CURRENT Vessel Examiner qualification. The
  // database enforces this regardless; hiding the control means a lapsed VE
  // finds out before filling in a form, not after submitting one.
  const isCurrentVE = hasQualification(user, 'VE');
  
  const [selectedFormType, setSelectedFormType] = useState("7012_vsc");
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const queryClient = useQueryClient();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['vesselExams'],
    queryFn: () => base44.entities.VesselExam.list('-exam_date'),
    initialData: [],
  });

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    initialData: [],
  });

  const createExamMutation = useMutation({
    mutationFn: (examData) => base44.entities.VesselExam.create(examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vesselExams'] });
      setShowForm(false);
      setEditingExam(null);
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VesselExam.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vesselExams'] });
      setShowForm(false);
      setEditingExam(null);
    },
  });

  const completeExamMutation = useMutation({
    mutationFn: (exam_id) => base44.functions.invoke('completeVesselExam', { exam_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vesselExams'] });
      setShowForm(false);
      setEditingExam(null);
      alert('Exam completed and sent to vessel owner!');
    },
    onError: (error) => {
      alert('Error completing exam: ' + error.message);
    },
  });

  const handleNewExam = () => {
    setEditingExam(null);
    setShowForm(true);
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setSelectedFormType(exam.exam_type);
    setShowForm(true);
  };

  const handleSubmit = async (examData) => {
    const dataWithMeta = {
      ...examData,
      examiner_id: user.id,
      examiner_name: user.full_name,
      flotilla_id: userFlotillaIds[0] || user.flotilla_id || "",
    };

    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, data: dataWithMeta });
    } else {
      createExamMutation.mutate(dataWithMeta);
    }
  };

  const handleComplete = async (examData) => {
    if (!examData.owner_email) {
      if (!confirm('No owner email provided. Complete exam anyway?')) {
        return;
      }
    }
    
    const dataWithMeta = {
      ...examData,
      examiner_id: user.id,
      examiner_name: user.full_name,
      flotilla_id: userFlotillaIds[0] || user.flotilla_id || "",
    };

    try {
      // First save/update the exam
      let examId;
      if (editingExam) {
        await updateExamMutation.mutateAsync({ id: editingExam.id, data: dataWithMeta });
        examId = editingExam.id;
      } else {
        const result = await createExamMutation.mutateAsync(dataWithMeta);
        examId = result.id;
      }
      
      // Then complete and send
      completeExamMutation.mutate(examId);
    } catch (error) {
      alert('Error saving exam: ' + error.message);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.owner_operator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.hin?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formTypeOptions = [
    { value: "7012_vsc", label: "7012 - Vessel Safety Check" },
    { value: "7012a_paddlecraft", label: "7012A - Paddle Craft VSC" },
    { value: "7066_commercial", label: "7066 - Commercial Vessel" },
    { value: "7008_pwc", label: "7008 - PWC Facility" },
    { value: "7003_facility", label: "7003 - Vessel Facility" },
  ];

  const renderForm = () => {
    const formProps = {
      exam: editingExam,
      onSubmit: handleSubmit,
      onComplete: handleComplete,
      onCancel: () => {
        setShowForm(false);
        setEditingExam(null);
      },
      flotillas,
      isCompleting: completeExamMutation.isPending,
    };

    switch (selectedFormType) {
      case "7012_vsc":
      case "7012a_paddlecraft":
        return <VesselExamForm7012 {...formProps} isPaddlecraft={selectedFormType === "7012a_paddlecraft"} />;
      case "7066_commercial":
        return <VesselExamForm7066 {...formProps} />;
      case "7008_pwc":
        return <VesselExamForm7008 {...formProps} />;
      case "7003_facility":
        return <VesselExamForm7003 {...formProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Vessel Examinations</h1>
                <p className="text-slate-600 mt-1">Conduct and manage vessel safety checks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!showForm && (
                <>
                  <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isCurrentVE ? (
                    <Button onClick={handleNewExam} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      New Exam
                    </Button>
                  ) : (
                    <div
                      className="flex items-start gap-2 rounded-lg border border-amber-200
                                 bg-amber-50 px-3 py-2 max-w-md"
                      title="Recording an exam requires a current Vessel Examiner qualification."
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-900">
                        <span className="font-medium">Vessel Examiner qualification required.</span>{' '}
                        You can view and reprint exams. Recording one requires a current VE
                        qualification &mdash; contact your FSO-MT if yours has lapsed.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {showForm ? (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-900">
                {editingExam ? 'Edit Exam' : `New ${formTypeOptions.find(o => o.value === selectedFormType)?.label}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderForm()}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search and Filters */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by owner, registration, or HIN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Exams List */}
            <VesselExamsList
              exams={filteredExams}
              onEdit={handleEdit}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
