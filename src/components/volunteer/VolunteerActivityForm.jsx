import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Info } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ACTIVITY_CODES = {
  "91A": {
    name: "VESSEL SAFETY CHECKS",
    description: "Report hours spent performing, and the number of examinations and inspections performed on Auxiliary Facilities and private boats (VSCs). Use Form ANSC-7038 for reporting.",
    category: "VESSEL EXAMINATIONS (U)"
  },
  "91H": {
    name: "VESSEL SAFETY CHECKS PADDLECRAFT",
    description: "Report hours spent performing vessel safety checks specifically for paddlecraft. Use Form ANSC-7038 for reporting.",
    category: "VESSEL EXAMINATIONS (U)"
  },
  "91B": {
    name: "VESSEL FACILITY INSPECTIONS",
    description: "Report hours spent performing facility inspections. Use Form ANSC-7038 for reporting.",
    category: "VESSEL EXAMINATIONS (U)"
  },
  "91C": {
    name: "COMMERCIAL FISHING VESSEL EXAMS",
    description: "Report hours spent performing Commercial Fishing Vessel examinations. Hours can only be listed by Auxiliarists holding a current/valid Letter of Designation as 'AUX-CFVE'. Use Form ANSC-7038.",
    category: "VESSEL EXAMINATIONS (U)"
  },
  "91D": {
    name: "UNINSPECTED PASSENGER VESSEL EXAMS",
    description: "Report hours spent performing Uninspected Passenger Vessel examinations. Hours can only be listed by Auxiliarists holding a current/valid Letter of Designation as 'AUX-UPV'. Use Form ANSC-7038.",
    category: "VESSEL EXAMINATIONS (U)"
  },
  "91G": {
    name: "UNINSPECTED TOWING VESSEL EXAMS",
    description: "Report hours spent performing Uninspected Towing Vessel examinations. Hours can only be listed by Auxiliarists holding a current/valid Letter of Designation as 'AUX-UTV'. Use Form ANSC-7038.",
    category: "VESSEL EXAMINATIONS (U)"
  },
  "99A": {
    name: "AUXILIARY LEADERSHIP",
    description: "Report all time spent by elected and appointed staff performing National, District, Division and Flotilla position duties. This includes all time spent for preparation and travel for these duties.",
    category: "AUXILIARY ADMINISTRATIVE (U)"
  },
  "99B": {
    name: "RECREATIONAL BOATING SAFETY (RBS) SUPPORT",
    description: "Report all time spent in RBS support that is not otherwise reported on a 7030, 7038, 7039 or 7046. This includes all time for preparation and travel in support of missions reported on 7030 and 7038.",
    category: "AUXILIARY ADMINISTRATIVE (U)"
  },
  "99C": {
    name: "MARINE SAFETY (MS) SUPPORT",
    description: "Report all time spent in MS support that is not otherwise reported on a 7030 or 7038. This includes all time for travel in support of Marine Safety and Marine Environmental Protection.",
    category: "AUXILIARY ADMINISTRATIVE (U)"
  },
  "99D": {
    name: "TRAINING SUPPORT",
    description: "Report all time spent in Training Support that is not otherwise reported on a 7030 or 7039. Any hours spent as a Trainee, other than attending a workshop, should be reported here. This includes all time for preparation, study, homework, and travel.",
    category: "AUXILIARY ADMINISTRATIVE (U)"
  },
  "99E": {
    name: "AUXILIARY ADMINISTRATIVE/LOGISTICAL SUPPORT",
    description: "Report all time spent for Auxiliary and CG Support missions not otherwise reported on any other form or any other Mission Code above. Include the time working on committees or attending meetings (if you are not an elected or staff officer). This includes time for preparation and travel.",
    category: "AUXILIARY ADMINISTRATIVE (U)"
  }
};

export default function VolunteerActivityForm({ activity, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(activity || {
    date: new Date().toISOString().split('T')[0],
    start_time: "",
    end_time: "",
    total_hours: "",
    activity_mission: "",
    activity_code: "",
    mileage: "",
    non_reimbursed_expenses: "",
    notes: ""
  });

  const [useTimeRange, setUseTimeRange] = useState(!!activity?.start_time);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total hours from start/end time if using time range
    let finalData = { ...formData };
    if (useTimeRange && formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const hours = (end - start) / (1000 * 60 * 60);
      finalData.total_hours = hours;
    } else {
      finalData.total_hours = parseFloat(formData.total_hours) || 0;
    }

    finalData.mileage = parseFloat(formData.mileage) || 0;
    finalData.non_reimbursed_expenses = parseFloat(formData.non_reimbursed_expenses) || 0;

    onSubmit(finalData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedCodeInfo = ACTIVITY_CODES[formData.activity_code];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-purple-50">
          <CardTitle className="text-xl font-semibold text-slate-900">
            {activity ? 'Edit Activity' : 'Log New Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Time Entry Method</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={!useTimeRange ? "default" : "outline"}
                    onClick={() => setUseTimeRange(false)}
                    className="flex-1"
                  >
                    Total Hours
                  </Button>
                  <Button
                    type="button"
                    variant={useTimeRange ? "default" : "outline"}
                    onClick={() => setUseTimeRange(true)}
                    className="flex-1"
                  >
                    Start/End Time
                  </Button>
                </div>
              </div>
            </div>

            {useTimeRange ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleChange('start_time', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="total_hours">Total Hours *</Label>
                <Input
                  id="total_hours"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="0.00"
                  value={formData.total_hours}
                  onChange={(e) => handleChange('total_hours', e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="activity_code">Activity/Mission Code *</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.activity_code} 
                  onValueChange={(val) => handleChange('activity_code', val)}
                  required
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select activity code" />
                  </SelectTrigger>
                  <SelectContent>
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

                {selectedCodeInfo && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <Info className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{formData.activity_code} - {selectedCodeInfo.name}</DialogTitle>
                        <DialogDescription className="pt-4">
                          <p className="text-sm text-slate-600 mb-2">
                            <strong>Category:</strong> {selectedCodeInfo.category}
                          </p>
                          <p className="text-sm text-slate-700">{selectedCodeInfo.description}</p>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_mission">Activity/Mission Description *</Label>
              <Textarea
                id="activity_mission"
                placeholder="Describe the activity or mission"
                value={formData.activity_mission}
                onChange={(e) => handleChange('activity_mission', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="non_reimbursed_expenses">Non-Reimbursed $ Spent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="non_reimbursed_expenses"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.non_reimbursed_expenses}
                    onChange={(e) => handleChange('non_reimbursed_expenses', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                {activity ? 'Update' : 'Log'} Activity
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}