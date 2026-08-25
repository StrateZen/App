import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowUpRight, ArrowDownRight, Eye } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const categoryDisplayNames = {
  membership_dues: "Membership Dues",
  donations: "Donations", 
  fundraising_events: "Fundraising",
  grants: "Grants",
  boat_maintenance: "Boat Maintenance",
  fuel_costs: "Fuel",
  training_materials: "Training",
  communications_equipment: "Communications",
  safety_equipment: "Safety Equipment",
  meeting_expenses: "Meetings",
  administrative_costs: "Administrative",
  uniforms_insignia: "Uniforms",
  public_education: "Public Education",
  vessel_examination_supplies: "VE Supplies",
  event_costs: "Events",
  office_supplies: "Office Supplies",
  other: "Other"
};

export default function RecentTransactions({ transactions, flotillas, isLoading }) {
  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `${flotilla.flotilla_number} - ${flotilla.flotilla_name}` : 'Unknown Flotilla';
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
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
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
          <Link to={createPageUrl("Transactions")}>
            <Button variant="ghost" size="sm" className="gap-2 text-blue-600 hover:text-blue-700">
              <Eye className="w-4 h-4" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No recent transactions</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors duration-150">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.transaction_type === 'income' 
                      ? 'bg-emerald-100' 
                      : 'bg-red-100'
                  }`}>
                    {transaction.transaction_type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {getFlotillaName(transaction.flotilla_id)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {categoryDisplayNames[transaction.category] || transaction.category}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {format(new Date(transaction.transaction_date), 'MMM d')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`font-semibold ${
                          transaction.transaction_type === 'income'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}
                          ${transaction.amount?.toFixed(2)}
                        </span>
                        {transaction.vendor_payee && (
                          <p className="text-xs text-slate-500 mt-1">
                            {transaction.vendor_payee}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}