import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

export default function VesselExamForm7003({ exam, onSubmit, onComplete, onCancel, isCompleting = false }) {
  const [formData, setFormData] = useState(exam || {
    exam_type: "7003_facility",
    exam_date: new Date().toISOString().split('T')[0],
    owner_operator_name: "",
    owner_email: "",
    registration_number: "",
    hin: "",
    vessel_facility_data: {
      facility_name: "",
      manufacturer: "",
      model: "",
      year: "",
      length: "",
    },
    remarks: "",
    status: "draft",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFacilityDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vessel_facility_data: { ...prev.vessel_facility_data, [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Inspection Date *</Label>
            <Input
              type="date"
              value={formData.exam_date}
              onChange={(e) => handleChange('exam_date', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Owner Name *</Label>
            <Input
              value={formData.owner_operator_name}
              onChange={(e) => handleChange('owner_operator_name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Owner Email</Label>
            <Input
              type="email"
              value={formData.owner_email}
              onChange={(e) => handleChange('owner_email', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Facility Data</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Registration Number</Label>
            <Input
              value={formData.registration_number}
              onChange={(e) => handleChange('registration_number', e.target.value)}
            />
          </div>
          <div>
            <Label>HIN</Label>
            <Input
              value={formData.hin}
              onChange={(e) => handleChange('hin', e.target.value)}
            />
          </div>
          <div>
            <Label>Facility Name</Label>
            <Input
              value={formData.vessel_facility_data.facility_name}
              onChange={(e) => handleFacilityDataChange('facility_name', e.target.value)}
            />
          </div>
          <div>
            <Label>Manufacturer</Label>
            <Input
              value={formData.vessel_facility_data.manufacturer}
              onChange={(e) => handleFacilityDataChange('manufacturer', e.target.value)}
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              value={formData.vessel_facility_data.model}
              onChange={(e) => handleFacilityDataChange('model', e.target.value)}
            />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              value={formData.vessel_facility_data.year}
              onChange={(e) => handleFacilityDataChange('year', e.target.value)}
            />
          </div>
          <div>
            <Label>Length (ft)</Label>
            <Input
              value={formData.vessel_facility_data.length}
              onChange={(e) => handleFacilityDataChange('length', e.target.value)}
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