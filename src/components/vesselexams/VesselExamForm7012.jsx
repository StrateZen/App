import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

import { STATE_COUNTIES } from "./stateCountiesData";

export default function VesselExamForm7012({ exam, onSubmit, onComplete, onCancel, isPaddlecraft = false, isCompleting = false }) {
  const isLocked = exam?.locked;
  const [formData, setFormData] = useState(exam || {
    exam_type: isPaddlecraft ? "7012a_paddlecraft" : "7012_vsc",
    exam_date: new Date().toISOString().split('T')[0],
    decal_awarded: false,
    safe_boating_class_attended: false,
    owner_operator_name: "",
    owner_email: "",
    location_county: "",
    location_state: "",
    replaced_decal: "",
    registration_number: "",
    hin: "",
    vessel_length: "",
    powered_by: "",
    area_of_operations: "",
    vessel_type: "",
    requirements: {
      display_of_numbers: null,
      registration_documentation: null,
      personal_flotation_devices: null,
      visual_distress_signals: null,
      fire_extinguishers: null,
      ventilation: null,
      backfire_flame_control: null,
      sound_producing_devices: null,
      navigation_lights: null,
      pollution_placard: null,
      marpol_trash_placard: null,
      marine_sanitation_devices: null,
      navigation_rules: null,
      state_local_requirements: null,
      engine_cutoff_switch: null,
    },
    recommended_items: {},
    remarks: "",
    status: "draft",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRequirementChange = (item, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [item]: value }
    }));
  };

  const handleRecommendedChange = (item, value) => {
    setFormData(prev => ({
      ...prev,
      recommended_items: { ...prev.recommended_items, [item]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = [];
    if (!formData.replaced_decal) missing.push("Replaced Decal Was");
    if (!formData.location_county) missing.push("County");
    if (!formData.location_state) missing.push("State");
    if (!formData.registration_number) missing.push("Registration/Documentation Number");
    if (!formData.hin) missing.push("HIN");
    if (!formData.area_of_operations) missing.push("Area of Operations");
    if (!formData.vessel_type) missing.push("Type");
    if (missing.length > 0) {
      alert(`Please fill in the following required fields:\n• ${missing.join('\n• ')}`);
      return;
    }
    onSubmit(formData);
  };

  const requirementItems = [
    { key: "display_of_numbers", label: "1. Display of Numbers" },
    { key: "registration_documentation", label: "2. Registration/Documentation" },
    { key: "personal_flotation_devices", label: "3. Personal Flotation Devices (PFD)" },
    { key: "visual_distress_signals", label: "4. Visual Distress Signals (VDS)" },
    { key: "fire_extinguishers", label: "5. Fire Extinguishers" },
    { key: "ventilation", label: "6. Ventilation" },
    { key: "backfire_flame_control", label: "7. Backfire Flame Control" },
    { key: "sound_producing_devices", label: "8. Sound Producing Devices" },
    { key: "navigation_lights", label: "9. Navigation Lights" },
    { key: "pollution_placard", label: "10. Pollution Placard" },
    { key: "marpol_trash_placard", label: "11. MARPOL Trash Placard" },
    { key: "marine_sanitation_devices", label: "12. Marine Sanitation Devices" },
    { key: "navigation_rules", label: "13. Navigation Rules" },
    { key: "state_local_requirements", label: "14. State and/or Local Requirements" },
    { key: "engine_cutoff_switch", label: "15. Engine Cutoff Switch (ECOS)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Read-Only Mode</p>
            <p className="text-sm text-amber-700">This exam is completed and locked. No changes can be made.</p>
          </div>
        </div>
      )}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Exam Date *</Label>
            <Input
              type="date"
              value={formData.exam_date}
              onChange={(e) => handleChange('exam_date', e.target.value)}
              required
              disabled={isLocked}
            />
          </div>

          <div>
            <Label>Decal Awarded</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.decal_awarded === true}
                  onCheckedChange={(checked) => handleChange('decal_awarded', checked)}
                />
                <span>Yes</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Owner/Operator Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Owner/Operator Name *</Label>
            <Input
              value={formData.owner_operator_name}
              onChange={(e) => handleChange('owner_operator_name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Owner Email *</Label>
            <Input
              type="email"
              value={formData.owner_email}
              onChange={(e) => handleChange('owner_email', e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Safe Boating Class Attended *</Label>
            <Select
              value={formData.safe_boating_class_attended ? "yes" : "no"}
              onValueChange={(val) => handleChange('safe_boating_class_attended', val === "yes")}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Replaced Decal Was *</Label>
            <Select
              value={formData.replaced_decal}
              onValueChange={(val) => handleChange('replaced_decal', val)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last Year">Last Year</SelectItem>
                <SelectItem value="Outdated">Outdated</SelectItem>
                <SelectItem value="First Time">First Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Location of VSC</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>State *</Label>
            <Select
              value={formData.location_state}
              onValueChange={(val) => {
                handleChange('location_state', val);
                handleChange('location_county', '');
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AL">Alabama</SelectItem>
                <SelectItem value="AK">Alaska</SelectItem>
                <SelectItem value="AZ">Arizona</SelectItem>
                <SelectItem value="AR">Arkansas</SelectItem>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="CO">Colorado</SelectItem>
                <SelectItem value="CT">Connecticut</SelectItem>
                <SelectItem value="DE">Delaware</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
                <SelectItem value="GA">Georgia</SelectItem>
                <SelectItem value="HI">Hawaii</SelectItem>
                <SelectItem value="ID">Idaho</SelectItem>
                <SelectItem value="IL">Illinois</SelectItem>
                <SelectItem value="IN">Indiana</SelectItem>
                <SelectItem value="IA">Iowa</SelectItem>
                <SelectItem value="KS">Kansas</SelectItem>
                <SelectItem value="KY">Kentucky</SelectItem>
                <SelectItem value="LA">Louisiana</SelectItem>
                <SelectItem value="ME">Maine</SelectItem>
                <SelectItem value="MD">Maryland</SelectItem>
                <SelectItem value="MA">Massachusetts</SelectItem>
                <SelectItem value="MI">Michigan</SelectItem>
                <SelectItem value="MN">Minnesota</SelectItem>
                <SelectItem value="MS">Mississippi</SelectItem>
                <SelectItem value="MO">Missouri</SelectItem>
                <SelectItem value="MT">Montana</SelectItem>
                <SelectItem value="NE">Nebraska</SelectItem>
                <SelectItem value="NV">Nevada</SelectItem>
                <SelectItem value="NH">New Hampshire</SelectItem>
                <SelectItem value="NJ">New Jersey</SelectItem>
                <SelectItem value="NM">New Mexico</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="NC">North Carolina</SelectItem>
                <SelectItem value="ND">North Dakota</SelectItem>
                <SelectItem value="OH">Ohio</SelectItem>
                <SelectItem value="OK">Oklahoma</SelectItem>
                <SelectItem value="OR">Oregon</SelectItem>
                <SelectItem value="PA">Pennsylvania</SelectItem>
                <SelectItem value="RI">Rhode Island</SelectItem>
                <SelectItem value="SC">South Carolina</SelectItem>
                <SelectItem value="SD">South Dakota</SelectItem>
                <SelectItem value="TN">Tennessee</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="UT">Utah</SelectItem>
                <SelectItem value="VT">Vermont</SelectItem>
                <SelectItem value="VA">Virginia</SelectItem>
                <SelectItem value="WA">Washington</SelectItem>
                <SelectItem value="WV">West Virginia</SelectItem>
                <SelectItem value="WI">Wisconsin</SelectItem>
                <SelectItem value="WY">Wyoming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>County *</Label>
            <Select
              value={formData.location_county}
              onValueChange={(val) => handleChange('location_county', val)}
              required
              disabled={!formData.location_state}
            >
              <SelectTrigger className={!formData.location_state ? 'opacity-50' : ''}>
                <SelectValue placeholder={formData.location_state ? "Select county..." : "Select state first..."} />
              </SelectTrigger>
              <SelectContent>
                {formData.location_state && STATE_COUNTIES[formData.location_state]?.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Vessel Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Registration/Documentation Number *</Label>
            <Input
              value={formData.registration_number}
              onChange={(e) => handleChange('registration_number', e.target.value)}
              required
            />
          </div>

          <div>
            <Label>HIN *</Label>
            <Input
              value={formData.hin}
              onChange={(e) => handleChange('hin', e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Length</Label>
            <Select value={formData.vessel_length} onValueChange={(val) => handleChange('vessel_length', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<16">&lt;16</SelectItem>
                <SelectItem value="16-25">16-25</SelectItem>
                <SelectItem value="26-39">26-39</SelectItem>
                <SelectItem value="40-65">40-65</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Powered By</Label>
            <Select value={formData.powered_by} onValueChange={(val) => handleChange('powered_by', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gas">Gas</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Sail">Sail</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Area of Operations *</Label>
            <Select value={formData.area_of_operations} onValueChange={(val) => handleChange('area_of_operations', val)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inland">Inland</SelectItem>
                <SelectItem value="Coastal">Coastal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type *</Label>
            <Select value={formData.vessel_type} onValueChange={(val) => handleChange('vessel_type', val)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PWC">PWC</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Cabin">Cabin</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">VSC Decal Requirements</h3>
        <div className="space-y-3">
          {requirementItems.map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label className="font-normal">{item.label}</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.requirements[item.key] === true}
                    onCheckedChange={() => handleRequirementChange(item.key, true)}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.requirements[item.key] === false}
                    onCheckedChange={() => handleRequirementChange(item.key, false)}
                  />
                  <span className="text-sm">No</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.requirements[item.key] === null}
                    onCheckedChange={() => handleRequirementChange(item.key, null)}
                  />
                  <span className="text-sm">N/A</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Recommended and Discussion Items</h3>
        <p className="text-sm text-slate-600 mb-4">While encouraged, items below are not VSC requirements</p>
        <div className="space-y-2">
          {[
            { key: 'marine_radio', label: 'I. Marine Radio (MMSI/EPIRB/PLB)' },
            { key: 'dewatering_device', label: 'II. Dewatering Device & Backup' },
            { key: 'mounted_fire_ext', label: 'III. Mounted Fire Extinguishers' },
            { key: 'anchor_line', label: 'IV. Anchor & Line for Area' },
            { key: 'first_aid', label: 'V. First Aid and PIW Kits' },
            { key: 'inland_vds', label: 'VI. Inland Visual Distress Signals' },
            { key: 'capacity_cert', label: 'VII. Capacity/Certificate of Compliance' },
            { key: 'deck_hazards', label: 'VIII.a. Deck free of hazards/Clean Bilge' },
            { key: 'electrical_systems', label: 'VIII.b. Electrical Systems' },
            { key: 'fuel_systems', label: 'VIII.c. Fuel Systems/Fuel Management' },
            { key: 'galley_heating', label: 'VIII.d. Galley/Heating Systems' },
            { key: 'accident_reporting', label: 'IX.a. Accident Reporting-Owner Responsibility' },
            { key: 'offshore_ops', label: 'IX.b. Offshore Operations' },
            { key: 'carbon_monoxide', label: 'IX.c. Carbon Monoxide-Dangers and Prevention' },
            { key: 'nautical_charts', label: 'IX.d. Nautical Charts/Navigation Aids' },
            { key: 'fuel_mgmt', label: 'IX.e. Fuel/Fuel Management' },
            { key: 'float_plan', label: 'IX.f. Float Plan/Weather & Sea Conditions' },
            { key: 'boating_checklist', label: 'IX.g. Boating Check List' },
            { key: 'survival_tips', label: 'IX.h. Survival Tips & First Aid' },
            { key: 'safe_boating_classes', label: 'IX.i. Safe Boating Classes' },
            { key: 'marine_domain', label: 'IX.j. Marine Domain Awareness' },
            { key: 'insurance', label: 'IX.k. Insurance Considerations' },
            { key: 'tools_spare_parts', label: 'IX.l. Tools and Spare Parts' },
            { key: 'proper_ventilation', label: 'IX.m. Proper Ventilation' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <Label className="font-normal text-sm">{item.label}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <Checkbox
                    checked={formData.recommended_items?.[item.key] === true}
                    onCheckedChange={() => handleRecommendedChange(item.key, true)}
                    disabled={isLocked}
                  />
                  <span className="text-xs">Yes</span>
                </label>
                <label className="flex items-center gap-1">
                  <Checkbox
                    checked={formData.recommended_items?.[item.key] === false}
                    onCheckedChange={() => handleRecommendedChange(item.key, false)}
                    disabled={isLocked}
                  />
                  <span className="text-xs">No</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Remarks</h3>
        <Textarea
          value={formData.remarks}
          onChange={(e) => handleChange('remarks', e.target.value)}
          rows={4}
          placeholder="Additional comments..."
        />
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {isLocked ? 'Close' : 'Cancel'}
        </Button>
        {!isLocked && (
          <>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {exam ? 'Update Exam' : 'Save Exam'}
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
          </>
        )}
      </div>
    </form>
  );
}