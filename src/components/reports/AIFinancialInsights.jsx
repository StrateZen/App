import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, FileText } from "lucide-react";

export default function AIFinancialInsights({ 
  reportType, 
  transactions, 
  budgets, 
  flotillaName, 
  reportMonth 
}) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare financial data summary
      const totalIncome = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const netIncome = totalIncome - totalExpenses;

      // Categorize expenses
      const expensesByCategory = {};
      transactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(t => {
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + (t.amount || 0);
        });

      // Budget comparison if available
      const currentYear = new Date().getFullYear();
      const yearBudgets = budgets.filter(b => b.budget_year === currentYear);
      
      let budgetData = null;
      if (yearBudgets.length > 0) {
        const totalBudgetIncome = yearBudgets.reduce((sum, b) => 
          sum + Object.values(b.income_budget || {}).reduce((s, v) => s + v, 0), 0);
        const totalBudgetExpense = yearBudgets.reduce((sum, b) => 
          sum + Object.values(b.expense_budget || {}).reduce((s, v) => s + v, 0), 0);
        
        budgetData = {
          budgetIncome: totalBudgetIncome,
          budgetExpense: totalBudgetExpense,
          incomeVariance: totalIncome - totalBudgetIncome,
          expenseVariance: totalBudgetExpense - totalExpenses
        };
      }

      // Build prompt for AI
      let prompt = '';
      
      if (reportType === 'profit-loss') {
        prompt = `Analyze this Profit & Loss statement for ${flotillaName} for ${reportMonth}:

Total Revenue: $${totalIncome.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Net Income: $${netIncome.toFixed(2)}

Top Expense Categories:
${Object.entries(expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat, amt]) => `- ${cat.replace(/_/g, ' ')}: $${amt.toFixed(2)}`)
  .join('\n')}

${budgetData ? `Budget Performance:
- Income Budget: $${budgetData.budgetIncome.toFixed(2)}
- Expense Budget: $${budgetData.budgetExpense.toFixed(2)}
- Income Variance: $${budgetData.incomeVariance.toFixed(2)} (${budgetData.incomeVariance >= 0 ? 'favorable' : 'unfavorable'})
- Expense Variance: $${budgetData.expenseVariance.toFixed(2)} (${budgetData.expenseVariance >= 0 ? 'favorable' : 'unfavorable'})` : ''}

Please provide:
1. A concise executive summary (2-3 sentences)
2. 3 key insights about financial performance
3. 3 specific cost-saving recommendations`;

      } else if (reportType === 'balance-sheet') {
        prompt = `Analyze this Balance Sheet for ${flotillaName} as of ${reportMonth}:

Cash on Hand: $${netIncome.toFixed(2)}
Total Income (All Time): $${totalIncome.toFixed(2)}
Total Expenses (All Time): $${totalExpenses.toFixed(2)}

Recent Activity Summary:
${Object.entries(expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat, amt]) => `- ${cat.replace(/_/g, ' ')}: $${amt.toFixed(2)}`)
  .join('\n')}

Please provide:
1. A concise executive summary (2-3 sentences) about financial position
2. 3 key insights about the organization's financial health
3. 3 recommendations for improving financial stability`;

      } else if (reportType === 'budget-variance' && budgetData) {
        prompt = `Analyze budget performance for ${flotillaName} for ${reportMonth}:

Income Performance:
- Budgeted: $${budgetData.budgetIncome.toFixed(2)}
- Actual: $${totalIncome.toFixed(2)}
- Variance: $${budgetData.incomeVariance.toFixed(2)} (${((budgetData.incomeVariance / budgetData.budgetIncome) * 100).toFixed(1)}%)

Expense Performance:
- Budgeted: $${budgetData.budgetExpense.toFixed(2)}
- Actual: $${totalExpenses.toFixed(2)}
- Variance: $${budgetData.expenseVariance.toFixed(2)} (${((budgetData.expenseVariance / budgetData.budgetExpense) * 100).toFixed(1)}%)

Major Expense Categories:
${Object.entries(expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat, amt]) => `- ${cat.replace(/_/g, ' ')}: $${amt.toFixed(2)}`)
  .join('\n')}

Please provide:
1. Executive summary of budget performance
2. 3 predictive insights on budget trends and what to expect next quarter
3. 3 actionable recommendations to improve budget adherence`;
      }

      if (!prompt) {
        setInsights(null);
        return;
      }

      // Call AI
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_insights: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(response);
    } catch (err) {
      setError(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="border-b border-purple-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Financial Insights
          </CardTitle>
          <Button 
            onClick={generateInsights}
            disabled={loading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!insights && !loading && !error && (
          <div className="text-center py-8 text-slate-600">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p>Click "Generate Insights" to get AI-powered analysis</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-slate-600">Analyzing financial data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Executive Summary</h3>
                  <p className="text-slate-700 leading-relaxed">{insights.executive_summary}</p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Key Insights</h3>
              </div>
              <div className="space-y-2">
                {insights.key_insights?.map((insight, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-600 text-white mt-1">{idx + 1}</Badge>
                      <p className="text-slate-700 text-sm flex-1">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Recommendations</h3>
              </div>
              <div className="space-y-2">
                {insights.recommendations?.map((rec, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-amber-600 text-white mt-1">{idx + 1}</Badge>
                      <p className="text-slate-700 text-sm flex-1">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}