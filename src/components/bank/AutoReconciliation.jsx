import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, AlertCircle, MinusCircle, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function AutoReconciliation({ account, onComplete }) {
  const [file, setFile] = useState(null);
  const [fileFormat, setFileFormat] = useState('csv');
  const [uploading, setUploading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-detect format from extension
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (ext === 'ofx' || ext === 'qfx') {
        setFileFormat('ofx');
      } else {
        setFileFormat('csv');
      }
    }
  };

  const handleUploadAndMatch = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Parse bank statement
      const parseResponse = await base44.functions.invoke('parseBankStatement', {
        file_url,
        format: fileFormat
      });

      if (!parseResponse.data.success) {
        throw new Error(parseResponse.data.error || 'Failed to parse statement');
      }

      setUploading(false);
      setMatching(true);

      // Match transactions
      const matchResponse = await base44.functions.invoke('matchBankTransactions', {
        bank_transactions: parseResponse.data.transactions,
        account_id: account.id,
        tolerance_days: 3
      });

      if (!matchResponse.data.success) {
        throw new Error(matchResponse.data.error || 'Failed to match transactions');
      }

      setResults(matchResponse.data);
      setMatching(false);

    } catch (error) {
      console.error('Reconciliation error:', error);
      alert(error.message || 'Failed to process bank statement');
      setUploading(false);
      setMatching(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `Date,Description,Amount,Type
2024-01-15,Sample Income,1000.00,income
2024-01-16,Sample Expense,-250.50,expense`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank_statement_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getMatchQualityColor = (quality) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (results) {
    return (
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Bank Transactions</p>
                <p className="text-2xl font-bold text-blue-900">{results.summary.total_bank_transactions}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Matched</p>
                <p className="text-2xl font-bold text-green-900">{results.summary.matched}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-700 mb-1">Unmatched (Bank)</p>
                <p className="text-2xl font-bold text-orange-900">{results.summary.unmatched_bank}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Unmatched (App)</p>
                <p className="text-2xl font-bold text-red-900">{results.summary.unmatched_app}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => setResults(null)} variant="outline">
                Start New Reconciliation
              </Button>
              <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                Complete Reconciliation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Matched Transactions */}
        {results.matches.length > 0 && (
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="w-5 h-5" />
                Matched Transactions ({results.matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {results.matches.map((match, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getMatchQualityColor(match.match_quality)}>
                            {match.match_quality} match ({match.match_score}%)
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700">Bank Statement:</p>
                            <p className="text-slate-600">{match.bank_transaction.description}</p>
                            <p className="text-xs text-slate-500">
                              {match.bank_transaction.date} • ${match.bank_transaction.amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700">App Record:</p>
                            <p className="text-slate-600">{match.app_transaction.description}</p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(match.app_transaction.transaction_date), 'yyyy-MM-dd')} • ${match.app_transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {match.discrepancies.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">Discrepancies:</p>
                            {match.discrepancies.map((disc, didx) => (
                              <p key={didx} className="text-xs text-yellow-700">
                                {disc.field}: Bank={disc.bank_value}, App={disc.app_value}
                                {disc.difference && ` (diff: $${disc.difference.toFixed(2)})`}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unmatched Bank Transactions */}
        {results.unmatched_bank.length > 0 && (
          <Card>
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-5 h-5" />
                Unmatched Bank Transactions ({results.unmatched_bank.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {results.unmatched_bank.map((trx, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{trx.description}</p>
                        <p className="text-sm text-slate-600">
                          {trx.date} • {trx.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          ${trx.amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-1">Not in app</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unmatched App Transactions */}
        {results.unmatched_app.length > 0 && (
          <Card>
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <MinusCircle className="w-5 h-5" />
                Unmatched App Transactions ({results.unmatched_app.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {results.unmatched_app.map((trx, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{trx.description}</p>
                        <p className="text-sm text-slate-600">
                          {format(new Date(trx.transaction_date), 'MMM d, yyyy')} • {trx.transaction_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${trx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          ${trx.amount.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-1">Not in bank</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Upload className="w-5 h-5" />
          Automated Bank Reconciliation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-900">
            Upload your bank statement to automatically match transactions with your app records. 
            Supported formats: CSV, OFX, QFX
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Statement Format</Label>
            <Select value={fileFormat} onValueChange={setFileFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma-Separated)</SelectItem>
                <SelectItem value="ofx">OFX/QFX (Quicken/QuickBooks)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Bank Statement File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.ofx,.qfx"
              onChange={handleFileSelect}
              disabled={uploading || matching}
            />
            {file && (
              <p className="text-sm text-slate-600 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUploadAndMatch}
              disabled={!file || uploading || matching}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : matching ? 'Matching Transactions...' : 'Upload & Match'}
            </Button>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              CSV Template
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-slate-900 mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Must include columns: Date, Description, Amount</li>
            <li>Positive amounts for income, negative for expenses</li>
            <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}