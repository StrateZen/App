import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIReportGenerator({ flotillas, transactions, budgets }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const context = `
You are analyzing financial data for USCG Auxiliary flotillas. Here's the available data:

Flotillas: ${flotillas.map(f => `${f.flotilla_number} (${f.flotilla_name})`).join(", ")}

Transaction Categories: ${[...new Set(transactions.map(t => t.category))].join(", ")}

Available data fields:
- Transactions: id, flotilla_id, transaction_type (income/expense), category, description, amount, transaction_date, method, vendor_payee, budget_item, audit_status
- Budgets: flotilla_id, budget_year, income_budget (object with categories), expense_budget (object with categories)

Current date: ${new Date().toISOString().split('T')[0]}

User request: ${prompt}

Analyze the request and return a structured response with:
1. "query": A JSON object describing how to filter the data
2. "summary": A brief text summary of what was found
3. "insights": Array of key insights or findings
4. "recommendations": Optional suggestions based on the data
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        response_json_schema: {
          type: "object",
          properties: {
            query: {
              type: "object",
              properties: {
                flotilla_ids: { type: "array", items: { type: "string" } },
                date_range: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" }
                  }
                },
                transaction_types: { type: "array", items: { type: "string" } },
                categories: { type: "array", items: { type: "string" } },
                min_amount: { type: "number" },
                max_amount: { type: "number" },
                budget_variance_threshold: { type: "number" }
              }
            },
            summary: { type: "string" },
            insights: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Apply filters based on AI response
      const query = response.query;
      let filtered = [...transactions];

      if (query.flotilla_ids?.length) {
        filtered = filtered.filter(t => query.flotilla_ids.includes(t.flotilla_id));
      }

      if (query.date_range?.start || query.date_range?.end) {
        filtered = filtered.filter(t => {
          const date = new Date(t.transaction_date);
          const start = query.date_range.start ? new Date(query.date_range.start) : null;
          const end = query.date_range.end ? new Date(query.date_range.end) : null;
          return (!start || date >= start) && (!end || date <= end);
        });
      }

      if (query.transaction_types?.length) {
        filtered = filtered.filter(t => query.transaction_types.includes(t.transaction_type));
      }

      if (query.categories?.length) {
        filtered = filtered.filter(t => query.categories.includes(t.category));
      }

      if (query.min_amount !== undefined) {
        filtered = filtered.filter(t => t.amount >= query.min_amount);
      }

      if (query.max_amount !== undefined) {
        filtered = filtered.filter(t => t.amount <= query.max_amount);
      }

      // Calculate budget variance if requested
      let budgetAnalysis = null;
      if (query.budget_variance_threshold !== undefined && query.flotilla_ids?.length) {
        budgetAnalysis = query.flotilla_ids.map(flotillaId => {
          const flotilla = flotillas.find(f => f.id === flotillaId);
          const flotillaTransactions = filtered.filter(t => t.flotilla_id === flotillaId);
          const budget = budgets.find(b => b.flotilla_id === flotillaId && b.budget_year === new Date().getFullYear());

          const actualIncome = flotillaTransactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const actualExpenses = flotillaTransactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const budgetIncome = budget ? Object.values(budget.income_budget || {}).reduce((sum, v) => sum + v, 0) : 0;
          const budgetExpenses = budget ? Object.values(budget.expense_budget || {}).reduce((sum, v) => sum + v, 0) : 0;

          const incomeVariance = budgetIncome > 0 ? ((actualIncome - budgetIncome) / budgetIncome) * 100 : 0;
          const expenseVariance = budgetExpenses > 0 ? ((actualExpenses - budgetExpenses) / budgetExpenses) * 100 : 0;

          return {
            flotilla: flotilla?.flotilla_number,
            actualIncome,
            budgetIncome,
            incomeVariance,
            actualExpenses,
            budgetExpenses,
            expenseVariance
          };
        }).filter(b => Math.abs(b.incomeVariance) > query.budget_variance_threshold || Math.abs(b.expenseVariance) > query.budget_variance_threshold);
      }

      setReportData({
        ...response,
        transactions: filtered,
        budgetAnalysis,
        totalAmount: filtered.reduce((sum, t) => sum + (t.transaction_type === 'income' ? t.amount : -t.amount), 0)
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData?.transactions) return;

    const headers = ['Date', 'Flotilla', 'Type', 'Category', 'Description', 'Amount', 'Vendor/Payee'];
    const rows = reportData.transactions.map(t => {
      const flotilla = flotillas.find(f => f.id === t.flotilla_id);
      return [
        t.transaction_date,
        flotilla?.flotilla_number || '',
        t.transaction_type,
        t.category,
        t.description,
        t.amount,
        t.vendor_payee || ''
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="w-5 h-5" />
            AI-Powered Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Describe the report you need:
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Examples:
• Show me all transactions for Flotilla 10-05 in Q3 2024
• Compare budget vs actual for all flotillas with variance over 10%
• List all expenses over $500 in the last 6 months
• Show income trends by category for Flotilla 10-01"
              className="min-h-32"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Report Results</CardTitle>
              <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
              <p className="text-slate-700">{reportData.summary}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Transactions Found</p>
                <p className="text-2xl font-bold text-green-900">{reportData.transactions.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Net Amount</p>
                <p className="text-2xl font-bold text-blue-900">${reportData.totalAmount.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-700 mb-1">Insights Generated</p>
                <p className="text-2xl font-bold text-purple-900">{reportData.insights?.length || 0}</p>
              </div>
            </div>

            {/* Insights */}
            {reportData.insights?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Key Insights</h4>
                <div className="space-y-2">
                  {reportData.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <Badge className="bg-amber-500 mt-1">{idx + 1}</Badge>
                      <p className="text-slate-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Analysis */}
            {reportData.budgetAnalysis?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Budget Variance Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700">Flotilla</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Budget Income</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Actual Income</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Variance %</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Budget Expenses</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Actual Expenses</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Variance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.budgetAnalysis.map((b, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="p-3 font-medium">{b.flotilla}</td>
                          <td className="p-3 text-right">${b.budgetIncome.toFixed(2)}</td>
                          <td className="p-3 text-right">${b.actualIncome.toFixed(2)}</td>
                          <td className={`p-3 text-right font-bold ${b.incomeVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {b.incomeVariance >= 0 ? '+' : ''}{b.incomeVariance.toFixed(1)}%
                          </td>
                          <td className="p-3 text-right">${b.budgetExpenses.toFixed(2)}</td>
                          <td className="p-3 text-right">${b.actualExpenses.toFixed(2)}</td>
                          <td className={`p-3 text-right font-bold ${b.expenseVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {b.expenseVariance >= 0 ? '+' : ''}{b.expenseVariance.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {reportData.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {reportData.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Badge className="bg-green-500 mt-1">💡</Badge>
                      <p className="text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction List */}
            {reportData.transactions.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">
                  Matching Transactions ({reportData.transactions.length})
                </h4>
                <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700">Date</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Flotilla</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Type</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Category</th>
                        <th className="text-left p-3 font-semibold text-slate-700">Description</th>
                        <th className="text-right p-3 font-semibold text-slate-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.transactions.map(t => {
                        const flotilla = flotillas.find(f => f.id === t.flotilla_id);
                        return (
                          <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 text-sm">{t.transaction_date}</td>
                            <td className="p-3 text-sm">{flotilla?.flotilla_number}</td>
                            <td className="p-3">
                              <Badge variant={t.transaction_type === 'income' ? 'default' : 'destructive'}>
                                {t.transaction_type}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">{t.category}</td>
                            <td className="p-3 text-sm">{t.description}</td>
                            <td className="p-3 text-right font-semibold">${t.amount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}