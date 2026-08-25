import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function VesselExamForm7066({ exam, onSubmit, onComplete, onCancel, isCompleting = false }) {
  const [formData, setFormData] = useState(exam || {
    exam_type: "7066_commercial",
    exam_date: new Date().toISOString().split('T')[0],
    commercial_exam_data: {
      cfv_performed: 0,
      cfv_passed: 0,
      cfv_hours: 0,
      upv_performed: 0,
      upv_passed: 0,
      upv_hours: 0,
      utv_performed: 0,
      utv_passed: 0,
      utv_hours: 0,
    },
    remarks: "",
    status: "draft",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCommercialDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      commercial_exam_data: { ...prev.commercial_exam_data, [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Exam Date</h3>
        <div className="max-w-md">
          <Label>Date *</Label>
          <Input
            type="date"
            value={formData.exam_date}
            onChange={(e) => handleChange('exam_date', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Commercial Fishing Vessel (91C)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Performed</Label>
            <Input
              type="number"
              min="0"
              value={formData.commercial_exam_data.cfv_performed}
              onChange={(e) => handleCommercialDataChange('cfv_performed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Passed</Label>
            <Input
              type="number"
              min="0"
              value={formData.commercial_exam_data.cfv_passed}
              onChange={(e) => handleCommercialDataChange('cfv_passed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Hours</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={formData.commercial_exam_data.cfv_hours}
              onChange={(e) => handleCommercialDataChange('cfv_hours', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Uninspected Passenger Vessel (91D)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Performed</Label>
            <Input
              type="number"
              min="0"
              value={formData.commercial_exam_data.upv_performed}
              onChange={(e) => handleCommercialDataChange('upv_performed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Passed</Label>
            <Input
              type="number"
              min="0"
              value={formData.commercial_exam_data.upv_passed}
              onChange={(e) => handleCommercialDataChange('upv_passed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Hours</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={formData.commercial_exam_data.upv_hours}
              onChange={(e) => handleCommercialDataChange('upv_hours', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Uninspected Towing Vessel (91G)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Performed</Label>
            <Input
              type="number"
              min="0"
              value={formData.commercial_exam_data.utv_performed}
              onChange={(e) => handleCommercialDataChange('utv_performed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Passed</Label>
            <Input
              type="number"
              min="0"
              value={formData.commercial_exam_data.utv_passed}
              onChange={(e) => handleCommercialDataChange('utv_passed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Hours</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={formData.commercial_exam_data.utv_hours}
              onChange={(e) => handleCommercialDataChange('utv_hours', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Remarks</h3>
        <Textarea
          value={formData.remarks}
          onChange={(e) => handleChange('remarks', e.target.value)}
          rows={4}
        />
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {exam ? 'Update' : 'Save'}
        </Button>
        {onComplete && (
          <Button 
            type="button" 
            onClick={() => onComplete(formData)}
            disabled={isCompleting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? 'Completing...' : 'Complete & Send'}
          </Button>
        )}
      </div>
    </form>
  );
}