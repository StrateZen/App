import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Upload, CheckCircle2, AlertTriangle, Eye, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AIReconciliationAssistant({ 
  bankAccount, 
  periodStart, 
  periodEnd, 
  transactions, 
  onCreateJournal 
}) {
  const [bankStatementFile, setBankStatementFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBankStatementFile(file);
    setProcessing(true);

    try {
      // Step 1: Upload the bank statement file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: Extract data from the bank statement
      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  description: { type: "string" },
                  amount: { type: "number" },
                  type: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractionResult.status !== 'success') {
        alert('Failed to extract data from bank statement: ' + extractionResult.details);
        setProcessing(false);
        return;
      }

      const bankStatementTransactions = extractionResult.output.transactions || [];

      // Step 3: Use AI to match transactions
      const matchingResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a financial reconciliation assistant. Your job is to match bank statement transactions with internal accounting transactions.

Bank Statement Transactions:
${JSON.stringify(bankStatementTransactions, null, 2)}

Internal System Transactions:
${JSON.stringify(transactions.map(t => ({
  id: t.id,
  date: t.transaction_date,
  description: t.description,
  vendor: t.vendor_payee,
  amount: t.amount,
  type: t.transaction_type
})), null, 2)}

For each bank statement transaction, find the best matching internal transaction based on:
1. Date proximity (same day or within 1-2 days)
2. Amount match (exact or very close)
3. Description similarity

Provide:
- Matched transactions with confidence score (0-100)
- Unmatched bank statement items (discrepancies)
- Suggested journal entries for discrepancies

Format your response as a structured analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bank_transaction: { type: "object" },
                  internal_transaction: { type: "object" },
                  confidence: { type: "number" },
                  match_reason: { type: "string" }
                }
              }
            },
            discrepancies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bank_transaction: { type: "object" },
                  issue: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  amount: { type: "number" },
                  entry_type: { type: "string" },
                  category: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });

      setMatches(matchingResult.matches || []);
      setDiscrepancies(matchingResult.discrepancies || []);
      setSuggestions(matchingResult.suggestions || []);
    } catch (error) {
      console.error('AI reconciliation error:', error);
      alert('Failed to process reconciliation: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'bg-red-100 text-red-800';
    if (severity === 'medium') return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  const handleApplySuggestion = (suggestion) => {
    onCreateJournal({
      entry_type: suggestion.entry_type,
      amount: suggestion.amount,
      category: suggestion.category,
      description: suggestion.description,
      notes: suggestion.notes,
      entry_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" />
          AI Reconciliation Assistant
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Upload your bank statement and let AI automatically match transactions and identify discrepancies
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="flex items-center gap-4">
          <label className="flex-1">
            <div className="flex items-center gap-3 p-4 bg-white border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {bankStatementFile ? bankStatementFile.name : 'Upload Bank Statement'}
                </p>
                <p className="text-xs text-slate-500">PDF, CSV, or image files supported</p>
              </div>
            </div>
            <Input
              type="file"
              className="hidden"
              accept=".pdf,.csv,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={processing}
            />
          </label>
        </div>

        {processing && (
          <div className="flex items-center justify-center gap-3 p-8 bg-white rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <div>
              <p className="font-medium text-slate-900">Processing bank statement...</p>
              <p className="text-sm text-slate-500">AI is analyzing and matching transactions</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!processing && matches.length > 0 && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-slate-600">Matches Found</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{matches.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium text-slate-600">Discrepancies</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">{discrepancies.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium text-slate-600">Suggestions</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{suggestions.length}</p>
              </div>
            </div>

            {/* Matched Transactions */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Matched Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-96 overflow-y-auto">
                  {matches.map((match, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedMatch(match)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {match.bank_transaction.description}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            Bank: {match.bank_transaction.date} • ${match.bank_transaction.amount?.toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-500">
                            System: {match.internal_transaction.date} • ${match.internal_transaction.amount?.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getConfidenceColor(match.confidence)} border`}>
                            {match.confidence}% match
                          </Badge>
                          <Eye className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discrepancies */}
            {discrepancies.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="border-b bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5" />
                    Discrepancies Requiring Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {discrepancies.map((disc, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {disc.bank_transaction.description}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {disc.bank_transaction.date} • ${disc.bank_transaction.amount?.toFixed(2)}
                            </p>
                            <p className="text-sm text-amber-700 mt-2">
                              {disc.issue}
                            </p>
                          </div>
                          <Badge className={getSeverityColor(disc.severity)}>
                            {disc.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <Card className="border-purple-200">
                <CardHeader className="border-b bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                    <Sparkles className="w-5 h-5" />
                    AI Suggested Journal Entries
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {suggestions.map((suggestion, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {suggestion.description}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {suggestion.entry_type.replace(/_/g, ' ')} • ${suggestion.amount?.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-600 mt-2">
                              {suggestion.notes}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Match Detail Modal */}
        <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Match Details</DialogTitle>
            </DialogHeader>
            {selectedMatch && (
              <div className="space-y-6 mt-4">
                <div className="text-center">
                  <Badge className={`${getConfidenceColor(selectedMatch.confidence)} border text-lg px-4 py-2`}>
                    {selectedMatch.confidence}% Confidence Match
                  </Badge>
                  <p className="text-sm text-slate-600 mt-2">{selectedMatch.match_reason}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-sm">Bank Statement</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="font-medium">{selectedMatch.bank_transaction.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Description</p>
                        <p className="font-medium">{selectedMatch.bank_transaction.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Amount</p>
                        <p className="font-medium text-lg">${selectedMatch.bank_transaction.amount?.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-sm">Internal System</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="font-medium">{selectedMatch.internal_transaction.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Description</p>
                        <p className="font-medium">{selectedMatch.internal_transaction.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Amount</p>
                        <p className="font-medium text-lg">${selectedMatch.internal_transaction.amount?.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}