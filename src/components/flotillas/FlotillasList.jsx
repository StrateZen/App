import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Users, Mail, MapPin, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlotillasList({ flotillas, isLoading, onEdit }) {
  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-semibold text-slate-900">
          Flotillas ({flotillas.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {flotillas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Flotillas Yet</h3>
            <p className="text-slate-500">Add your first flotilla to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flotillas.map((flotilla) => (
              <div key={flotilla.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {flotilla.flotilla_number}
                    </h3>
                    <p className="text-purple-600 font-semibold">{flotilla.flotilla_name}</p>
                  </div>
                  <Badge variant={flotilla.active ? "default" : "secondary"}>
                    {flotilla.active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {flotilla.location && (
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <p className="text-sm text-slate-600">{flotilla.location}</p>
                  </div>
                )}

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {flotilla.commander_name && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-slate-500">Commander</p>
                        <p className="text-sm font-medium text-slate-700">{flotilla.commander_name}</p>
                      </div>
                    </div>
                  )}

                  {flotilla.vice_commander_name && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-xs text-slate-500">Vice Commander</p>
                        <p className="text-sm font-medium text-slate-700">{flotilla.vice_commander_name}</p>
                      </div>
                    </div>
                  )}

                  {flotilla.fso_fn_name && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs text-slate-500">FSO-FN</p>
                        <p className="text-sm font-medium text-slate-700">{flotilla.fso_fn_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(flotilla)}
                    className="flex-1 gap-2 hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}