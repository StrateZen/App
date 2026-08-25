import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, CheckCircle, AlertCircle, HelpCircle, FileText } from "lucide-react";

// Parse CSV text into array of objects
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const cols = [];
    let cur = "", inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || "").replace(/^"|"$/g, "").trim(); });
    return row;
  }).filter(row => Object.values(row).some(v => v));
}

// Detect common CSV column names for date and amount
function detectColumns(rows) {
  if (!rows.length) return { dateCol: null, amountCol: null, descCol: null };
  const keys = Object.keys(rows[0]);
  const dateCol = keys.find(k => /date|posted|trans/i.test(k)) || null;
  const amountCol = keys.find(k => /amount|debit|credit|sum/i.test(k)) || null;
  const descCol = keys.find(k => /desc|memo|narr|detail|payee|ref/i.test(k)) || null;
  return { dateCol, amountCol, descCol };
}

// Parse a date string loosely
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d)) return d;
  // Try MM/DD/YYYY
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    const attempt = new Date(c > 31 ? c : a > 31 ? a : 2000 + c, (c > 31 ? a : b) - 1, c > 31 ? b : a > 31 ? c : b);
    if (!isNaN(attempt)) return attempt;
  }
  return null;
}

// Match bank CSV rows to system transactions
function matchTransactions(bankRows, systemTransactions, dateCol, amountCol) {
  const DATE_TOLERANCE_DAYS = 3;
  const AMOUNT_TOLERANCE = 0.01;

  return bankRows.map(bankRow => {
    const bankDate = parseDate(bankRow[dateCol]);
    const rawAmount = parseFloat((bankRow[amountCol] || "0").replace(/[$,\s]/g, "").replace(/[()]/g, "-"));
    const bankAmount = Math.abs(isNaN(rawAmount) ? 0 : rawAmount);

    const matches = systemTransactions.filter(t => {
      const sysDate = parseDate(t.transaction_date);
      const sysAmount = Math.abs(t.amount || 0);

      if (!bankDate || !sysDate) return false;
      const daysDiff = Math.abs((bankDate - sysDate) / (1000 * 60 * 60 * 24));
      const amountMatch = Math.abs(sysAmount - bankAmount) <= AMOUNT_TOLERANCE;
      return daysDiff <= DATE_TOLERANCE_DAYS && amountMatch;
    });

    const confidence = matches.length === 1 ? "high" : matches.length > 1 ? "multiple" : "none";

    return {
      bankRow,
      bankDate,
      bankAmount,
      rawAmount,
      matches,
      confidence,
      selectedMatch: matches.length === 1 ? matches[0] : null,
    };
  });
}

export default function CSVBatchImport({ transactions, onClose }) {
  const [csvRows, setCsvRows] = useState(null);
  const [columns, setColumns] = useState({ dateCol: null, amountCol: null, descCol: null });
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      const cols = detectColumns(rows);
      setCsvRows(rows);
      setColumns(cols);
      if (cols.dateCol && cols.amountCol) {
        setResults(matchTransactions(rows, transactions, cols.dateCol, cols.amountCol));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  };

  const matched = results?.filter(r => r.confidence === "high").length || 0;
  const unmatched = results?.filter(r => r.confidence === "none").length || 0;
  const multiple = results?.filter(r => r.confidence === "multiple").length || 0;

  return (
    <Card className="shadow-sm border-blue-200">
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          CSV Batch Import & Matching
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Upload Zone */}
        {!csvRows && (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Drop your bank CSV here</p>
            <p className="text-sm text-slate-500">or click to browse. Supports standard bank export formats.</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* Summary */}
        {results && (
          <>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-slate-100 text-slate-700">{results.length} bank rows</Badge>
              <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {matched} matched
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> {multiple} multiple candidates
              </Badge>
              <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {unmatched} unmatched
              </Badge>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setCsvRows(null); setResults(null); }}>
                Upload new file
              </Button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Bank Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Matched System Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r, i) => (
                    <tr key={i} className={
                      r.confidence === "high" ? "bg-green-50" :
                      r.confidence === "multiple" ? "bg-amber-50" :
                      "bg-red-50"
                    }>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {r.bankDate ? r.bankDate.toLocaleDateString() : r.bankRow[columns.dateCol] || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {columns.descCol ? r.bankRow[columns.descCol] : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        ${r.bankAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {r.confidence === "high" && (
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1 inline" />Matched</Badge>
                        )}
                        {r.confidence === "multiple" && (
                          <Badge className="bg-amber-100 text-amber-700"><HelpCircle className="w-3 h-3 mr-1 inline" />{r.matches.length} candidates</Badge>
                        )}
                        {r.confidence === "none" && (
                          <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1 inline" />No match</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        {r.selectedMatch ? (
                          <div>
                            <p className="font-medium text-slate-800 truncate">{r.selectedMatch.description}</p>
                            <p className="text-xs text-slate-500">{r.selectedMatch.transaction_date} · ${r.selectedMatch.amount}</p>
                          </div>
                        ) : r.confidence === "multiple" ? (
                          <p className="text-xs text-amber-700">Review manually — multiple transactions match this amount/date</p>
                        ) : (
                          <p className="text-xs text-red-600">No system transaction found within ±3 days & ±$0.01</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}