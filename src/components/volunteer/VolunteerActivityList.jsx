import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, DollarSign, Navigation } from "lucide-react";
import { format } from "date-fns";

export default function VolunteerActivityList({ activities, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No volunteer activities logged yet.</p>
          <p className="text-sm text-slate-500 mt-1">Click "Log Activity" to get started.</p>
        </CardContent>
      </Card>
    );
  }

  const getCodeBadgeColor = (code) => {
    if (code.startsWith('91')) return 'bg-blue-100 text-blue-800';
    if (code.startsWith('99')) return 'bg-purple-100 text-purple-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCodeBadgeColor(activity.activity_code)}>
                        {activity.activity_code}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {format(new Date(activity.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {activity.activity_mission}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{activity.total_hours?.toFixed(2)} hrs</span>
                    {activity.start_time && activity.end_time && (
                      <span className="text-slate-500 ml-1">
                        ({activity.start_time} - {activity.end_time})
                      </span>
                    )}
                  </div>

                  {activity.mileage > 0 && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Navigation className="w-4 h-4" />
                      <span>{activity.mileage} mi</span>
                    </div>
                  )}

                  {activity.non_reimbursed_expenses > 0 && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${activity.non_reimbursed_expenses?.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {activity.notes && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {activity.notes}
                  </p>
                )}
              </div>

              <div className="flex md:flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(activity)}
                  className="gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(activity)}
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}