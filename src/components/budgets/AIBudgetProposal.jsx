import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { subYears, format } from "date-fns";

export default function AIBudgetProposal({ flotillas, onProposalGenerated, userFlotillaId }) {
  const [selectedFlotilla, setSelectedFlotilla] = useState(userFlotillaId || "");
  const [yearsToAnalyze, setYearsToAnalyze] = useState("2");
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!selectedFlotilla) {
      setError("Please select a flotilla");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProposal(null);

    try {
      // Fetch historical transactions
      const allTransactions = await base44.entities.Transaction.list('-transaction_date');
      
      // Filter by flotilla and date range
      const yearsBack = parseInt(yearsToAnalyze);
      const cutoffDate = subYears(new Date(), yearsBack);
      
      const historicalTransactions = allTransactions.filter(t => 
        t.flotilla_id === selectedFlotilla && 
        new Date(t.transaction_date) >= cutoffDate
      );

      if (historicalTransactions.length === 0) {
        setError(`No historical data found for the selected flotilla in the last ${yearsBack} year(s)`);
        setIsGenerating(false);
        return;
      }

      // Prepare data summary for AI
      const incomeByCategory = {};
      const expenseByCategory = {};
      
      historicalTransactions.forEach(t => {
        if (t.transaction_type === 'income') {
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + (t.amount || 0);
        } else {
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + (t.amount || 0);
        }
      });

      // Calculate yearly averages
      const incomeAverages = {};
      const expenseAverages = {};
      
      Object.entries(incomeByCategory).forEach(([cat, total]) => {
        incomeAverages[cat] = total / yearsBack;
      });
      
      Object.entries(expenseByCategory).forEach(([cat, total]) => {
        expenseAverages[cat] = total / yearsBack;
      });

      // Build AI prompt
      const flotilla = flotillas.find(f => f.id === selectedFlotilla);
      const prompt = `You are a financial advisor for a Coast Guard Auxiliary flotilla. Analyze the following historical financial data and generate a realistic budget proposal for ${targetYear}.

Flotilla: ${flotilla?.flotilla_number} - ${flotilla?.flotilla_name}
Analysis Period: Last ${yearsBack} year(s)
Total Transactions Analyzed: ${historicalTransactions.length}

HISTORICAL INCOME (Yearly Averages):
${Object.entries(incomeAverages).map(([cat, avg]) => `- ${cat.replace(/_/g, ' ')}: $${avg.toFixed(2)}`).join('\n')}

HISTORICAL EXPENSES (Yearly Averages):
${Object.entries(expenseAverages).map(([cat, avg]) => `- ${cat.replace(/_/g, ' ')}: $${avg.toFixed(2)}`).join('\n')}

Based on this data:
1. Identify spending trends and patterns
2. Suggest realistic budget amounts for each income and expense category for ${targetYear}
3. Apply a reasonable growth rate (2-5%) where appropriate
4. Flag any categories with high variability or concerns
5. Provide brief reasoning for your recommendations

Return your analysis in the following JSON format:
{
  "income_budget": {
    "membership_dues": number,
    "donations": number,
    "fundraising_events": number,
    "grants": number
  },
  "expense_budget": {
    "boat_maintenance": number,
    "fuel_costs": number,
    "training_materials": number,
    "communications_equipment": number,
    "safety_equipment": number,
    "meeting_expenses": number,
    "administrative_costs": number,
    "uniforms_insignia": number,
    "public_education": number,
    "vessel_examination_supplies": number,
    "event_costs": number,
    "office_supplies": number,
    "other": number
  },
  "analysis": {
    "trends": ["key trend 1", "key trend 2", "key trend 3"],
    "concerns": ["concern 1 if any", "concern 2 if any"],
    "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "growth_rate_applied": "percentage or description"
  }
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            income_budget: {
              type: "object",
              properties: {
                membership_dues: { type: "number" },
                donations: { type: "number" },
                fundraising_events: { type: "number" },
                grants: { type: "number" }
              }
            },
            expense_budget: {
              type: "object",
              properties: {
                boat_maintenance: { type: "number" },
                fuel_costs: { type: "number" },
                training_materials: { type: "number" },
                communications_equipment: { type: "number" },
                safety_equipment: { type: "number" },
                meeting_expenses: { type: "number" },
                administrative_costs: { type: "number" },
                uniforms_insignia: { type: "number" },
                public_education: { type: "number" },
                vessel_examination_supplies: { type: "number" },
                event_costs: { type: "number" },
                office_supplies: { type: "number" },
                other: { type: "number" }
              }
            },
            analysis: {
              type: "object",
              properties: {
                trends: { type: "array", items: { type: "string" } },
                concerns: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                growth_rate_applied: { type: "string" }
              }
            }
          }
        }
      });

      setProposal({
        ...response,
        flotilla_id: selectedFlotilla,
        budget_year: targetYear,
        yearsAnalyzed: yearsBack,
        transactionsAnalyzed: historicalTransactions.length
      });

    } catch (err) {
      setError(err.message || "Failed to generate budget proposal");
      console.error("Budget proposal error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptProposal = () => {
    if (!proposal) return;

    const budgetData = {
      flotilla_id: proposal.flotilla_id,
      budget_year: proposal.budget_year,
      budget_period: "annual",
      period_start: `${proposal.budget_year}-01-01`,
      period_end: `${proposal.budget_year}-12-31`,
      income_budget: proposal.income_budget,
      expense_budget: proposal.expense_budget,
      approved: false,
      approved_by: "",
      notes: `AI-generated budget based on ${proposal.yearsAnalyzed} year(s) of historical data (${proposal.transactionsAnalyzed} transactions). ${proposal.analysis.growth_rate_applied}`
    };

    onProposalGenerated(budgetData);
  };

  const totalIncome = proposal ? Object.values(proposal.income_budget).reduce((sum, val) => sum + val, 0) : 0;
  const totalExpense = proposal ? Object.values(proposal.expense_budget).reduce((sum, val) => sum + val, 0) : 0;
  const netBudget = totalIncome - totalExpense;

  return (
    <Card className="shadow-lg border-indigo-200">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          AI Budget Proposal Generator
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Automatically generate budget recommendations based on historical financial data
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Configuration */}
        <div className="grid md:grid-cols-3 gap-4">
          {!userFlotillaId && (
            <div className="space-y-2">
              <Label>Flotilla *</Label>
              <Select value={selectedFlotilla} onValueChange={setSelectedFlotilla}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flotilla" />
                </SelectTrigger>
                <SelectContent>
                  {flotillas.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.flotilla_number} - {f.flotilla_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Years to Analyze</Label>
            <Select value={yearsToAnalyze} onValueChange={setYearsToAnalyze}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 Year</SelectItem>
                <SelectItem value="2">Last 2 Years</SelectItem>
                <SelectItem value="3">Last 3 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Budget Year</Label>
            <Select value={targetYear.toString()} onValueChange={(val) => setTargetYear(parseInt(val))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2].map(offset => {
                  const year = new Date().getFullYear() + offset;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!proposal && (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedFlotilla}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Generating Proposal..." : "Generate Budget Proposal"}
          </Button>
        )}

        {/* Proposal Results */}
        {proposal && (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Analysis Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">Data Period:</p>
                  <p className="text-slate-600">
                    {proposal.yearsAnalyzed} year(s) • {proposal.transactionsAnalyzed} transactions analyzed
                  </p>
                </div>
                
                {proposal.analysis.trends.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700">Key Trends:</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {proposal.analysis.trends.map((trend, i) => (
                        <li key={i}>{trend}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {proposal.analysis.concerns.length > 0 && (
                  <div>
                    <p className="font-medium text-orange-700">Concerns:</p>
                    <ul className="list-disc list-inside text-orange-600 space-y-1">
                      {proposal.analysis.concerns.map((concern, i) => (
                        <li key={i}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {proposal.analysis.recommendations.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700">Recommendations:</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {proposal.analysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Proposed Budget */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Income */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 mb-3">Proposed Income</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(proposal.income_budget).map(([cat, amount]) => (
                    amount > 0 && (
                      <div key={cat} className="flex justify-between">
                        <span className="text-slate-700">
                          {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="font-medium text-emerald-700">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    )
                  ))}
                  <div className="pt-2 mt-2 border-t border-emerald-300 flex justify-between font-bold">
                    <span>Total Income</span>
                    <span className="text-emerald-600">${totalIncome.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3">Proposed Expenses</h3>
                <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {Object.entries(proposal.expense_budget).map(([cat, amount]) => (
                    amount > 0 && (
                      <div key={cat} className="flex justify-between">
                        <span className="text-slate-700">
                          {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="font-medium text-red-700">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    )
                  ))}
                  <div className="pt-2 mt-2 border-t border-red-300 flex justify-between font-bold">
                    <span>Total Expenses</span>
                    <span className="text-red-600">${totalExpense.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Budget */}
            <div className={`p-4 rounded-lg border ${netBudget >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-slate-900">Projected Net Budget:</span>
                <span className={`text-2xl font-bold ${netBudget >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ${Math.abs(netBudget).toFixed(2)}
                  {netBudget >= 0 ? ' Surplus' : ' Deficit'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptProposal}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4" />
                Accept & Create Budget
              </Button>
              <Button
                onClick={() => setProposal(null)}
                variant="outline"
                className="flex-1"
              >
                Generate New Proposal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}