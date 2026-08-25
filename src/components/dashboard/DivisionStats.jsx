import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Users, FileText, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function DivisionStats({ 
  totalIncome, 
  totalExpenses, 
  netIncome, 
  flotillasCount, 
  transactionsCount, 
  isLoading,
  onIncomeClick,
  onExpensesClick,
  onNetClick,
  onTransactionsClick,
}) {
  const stats = [
    {
      title: "YTD Income",
      value: `$${formatCurrency(totalIncome)}`,
      icon: DollarSign,
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      trend: totalIncome > 0 ? "positive" : "neutral",
      onClick: onIncomeClick,
    },
    {
      title: "YTD Expenses", 
      value: `$${formatCurrency(totalExpenses)}`,
      icon: TrendingDown,
      bgColor: "bg-red-500",
      textColor: "text-red-600",
      trend: totalExpenses > 0 ? "negative" : "neutral",
      onClick: onExpensesClick,
    },
    {
      title: "Net Income",
      value: `$${formatCurrency(netIncome)}`,
      icon: TrendingUp,
      bgColor: (netIncome || 0) >= 0 ? "bg-blue-500" : "bg-orange-500",
      textColor: (netIncome || 0) >= 0 ? "text-blue-600" : "text-orange-600",
      trend: (netIncome || 0) >= 0 ? "positive" : "negative",
      onClick: onNetClick,
    },
    {
      title: "Active Flotillas",
      value: flotillasCount,
      icon: Users,
      bgColor: "bg-purple-500",
      textColor: "text-purple-600",
      trend: "neutral",
      onClick: null,
    },
    {
      title: "YTD Transactions",
      value: transactionsCount,
      icon: FileText,
      bgColor: "bg-amber-500", 
      textColor: "text-amber-600",
      trend: "neutral",
      onClick: onTransactionsClick,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`relative overflow-hidden shadow-sm border-slate-200 transition-all duration-200 ${stat.onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 group' : ''}`}
          onClick={stat.onClick || undefined}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 transform translate-x-6 -translate-y-6 ${stat.bgColor} rounded-full opacity-10`} />
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  {stat.title}
                  {stat.onClick && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </p>
                <CardTitle className="text-2xl font-bold mt-1 text-slate-900">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : stat.value}
                </CardTitle>
              </div>
              <div className={`p-2 rounded-xl ${stat.bgColor} bg-opacity-15`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stat.trend !== "neutral" && (
              <div className="flex items-center">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    stat.trend === "positive" 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {stat.trend === "positive" ? "↗" : "↘"} YTD
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}