import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Lock, CheckCircle, FileText, Eye, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function VesselExamsList({ exams, onEdit, isLoading }) {
  const [reprintingId, setReprintingId] = useState(null);

  const getFormTypeLabel = (type) => {
    const labels = {
      "7012_vsc": "VSC",
      "7012a_paddlecraft": "Paddle Craft",
      "7066_commercial": "Commercial",
      "7008_pwc": "PWC",
      "7003_facility": "Facility",
    };
    return labels[type] || type;
  };

  const handleReprint = async (examId) => {
    try {
      setReprintingId(examId);
      const response = await base44.functions.invoke('reprintVesselExam', { exam_id: examId });
      if (response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
      }
    } catch (error) {
      alert('Error reprinting exam: ' + error.message);
    } finally {
      setReprintingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No exams found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Exam History ({exams.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Owner</th>
                <th className="text-left p-4">Vessel</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    {exam.exam_date ? format(new Date(exam.exam_date), 'MMM dd, yyyy') : '-'}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{getFormTypeLabel(exam.exam_type)}</Badge>
                  </td>
                  <td className="p-4">{exam.owner_operator_name || '-'}</td>
                  <td className="p-4 text-sm">
                    {exam.registration_number || exam.hin || '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Badge>{exam.status}</Badge>
                      {exam.locked && <Lock className="w-3 h-3" />}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(exam)}
                        title={exam.locked ? "View exam (read-only)" : "Edit exam"}
                      >
                        {exam.locked ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                      {(exam.status === 'completed' || exam.status === 'sent') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprint(exam.id)}
                          disabled={reprintingId === exam.id}
                          title="Reprint PDF report"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      )}
                      {exam.pdf_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(exam.pdf_url, '_blank')}
                          title="Download PDF report"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}