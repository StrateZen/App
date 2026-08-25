import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, CheckCircle, Clock } from "lucide-react";

const INCOME_LABELS = {
  membership_dues: "Membership Dues",
  flotilla_dues: "Flotilla Dues",
  division_dues: "Division Dues",
  district_dues: "District Dues",
  national_dues: "National Dues",
  donations: "Donations",
  fundraising_events: "Fundraising Events",
  grants: "Grants",
  events: "Events",
  refunds_reimbursements: "Refunds & Reimbursements",
  course_fees: "Course Fees",
};

const EXPENSE_LABELS = {
  boat_maintenance: "Boat Maintenance",
  fuel_costs: "Fuel Costs",
  training_materials: "Training Materials",
  communications_equipment: "Communications Equipment",
  safety_equipment: "Safety Equipment",
  meeting_expenses: "Meeting Expenses",
  administrative_costs: "Administrative Costs",
  uniforms_insignia: "Uniforms & Insignia",
  public_education: "Public Education",
  public_education_materials: "Public Education Materials",
  vessel_examination_supplies: "Vessel Examination Supplies",
  vessel_exams: "Vessel Exams",
  event_costs: "Event Costs",
  office_supplies: "Office Supplies",
  course_fees_owed: "Course Fees Owed",
  division_dues: "Division Dues",
  district_dues: "District Dues",
  national_dues: "National Dues",
  budget: "Budget",
  awards_trophies: "Awards & Trophies",
  other: "Other",
};

export default function BudgetApprovalReport({ budgets, flotillas, flotillaId, reportMonth }) {
  const printRef = useRef(null);

  const [year] = reportMonth.split('-');
  const currentYear = parseInt(year);

  // Get relevant budgets
  let relevantBudgets = budgets.filter(b => b.budget_year === currentYear);
  if (flotillaId && flotillaId !== 'all') {
    relevantBudgets = relevantBudgets.filter(b => b.flotilla_id === flotillaId);
  }

  const getFlotillaName = (flotillaId) => {
    const f = flotillas.find(f => f.id === flotillaId);
    return f ? `${f.flotilla_number} - ${f.flotilla_name}` : 'Unknown Flotilla';
  };

  const calcTotals = (budget) => {
    const totalIncome = Object.values(budget.income_budget || {}).reduce((sum, v) => sum + (v || 0), 0);
    const totalExpense = Object.values(budget.expense_budget || {}).reduce((sum, v) => sum + (v || 0), 0);
    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Budget Approval Report - FY ${currentYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; }
            h1 { font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 4px; }
            h2 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
            h3 { font-size: 14px; font-weight: bold; background: #f1f5f9; padding: 8px; margin: 16px 0 8px 0; }
            .header-info { text-align: center; color: #475569; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; border: 1px solid #94a3b8; }
            .badge-approved { background: #dcfce7; border-color: #16a34a; color: #15803d; }
            .badge-pending { background: #fef9c3; border-color: #ca8a04; color: #a16207; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #f8fafc; padding: 8px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: 600; }
            th.right, td.right { text-align: right; }
            td { padding: 7px 12px; border-bottom: 1px solid #f1f5f9; }
            .total-row td { font-weight: bold; background: #f8fafc; border-top: 2px solid #e2e8f0; }
            .net-section { margin: 12px 0; padding: 12px; background: #eff6ff; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
            .net-label { font-size: 16px; font-weight: bold; }
            .net-value { font-size: 22px; font-weight: bold; }
            .surplus { color: #2563eb; }
            .deficit { color: #ea580c; }
            .signatures { margin-top: 40px; page-break-inside: avoid; }
            .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
            .sig-box { border-top: 2px solid #1e293b; padding-top: 8px; }
            .sig-label { font-size: 12px; color: #475569; }
            .budget-section { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 30px 0; }
            @media print { body { margin: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (relevantBudgets.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No budgets found for FY {currentYear}</p>
        <p className="text-sm mt-1">Create a budget in the Budget Planning section first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <Button onClick={handlePrint} className="gap-2 bg-blue-700 hover:bg-blue-800">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div ref={printRef}>
        <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>
          USCG Auxiliary — Budget Approval Report
        </h1>
        <div className="header-info" style={{ textAlign: 'center', color: '#475569', marginBottom: '20px' }}>
          <p style={{ margin: '2px 0' }}>Fiscal Year {currentYear}</p>
          <p style={{ margin: '2px 0', fontSize: '13px' }}>Generated: {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>

        {relevantBudgets.map((budget, idx) => {
          const { totalIncome, totalExpense, net } = calcTotals(budget);
          const flotilla = flotillas.find(f => f.id === budget.flotilla_id);
          const incomeEntries = Object.entries(budget.income_budget || {}).filter(([, v]) => v > 0);
          const expenseEntries = Object.entries(budget.expense_budget || {}).filter(([, v]) => v > 0);

          return (
            <div key={budget.id} style={{ marginBottom: '40px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              {idx > 0 && <hr style={{ border: 'none', borderTop: '2px dashed #e2e8f0', margin: '30px 0' }} />}

              {/* Budget Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {getFlotillaName(budget.flotilla_id)}
                  </h2>
                  <p style={{ color: '#475569', fontSize: '13px' }}>
                    Period: {budget.period_start} to {budget.period_end}
                  </p>
                </div>
                <div>
                  {budget.approved ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 12px', background: '#dcfce7', borderRadius: '9999px', color: '#15803d', fontWeight: '600', fontSize: '12px', border: '1px solid #16a34a' }}>
                      ✓ APPROVED
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 12px', background: '#fef9c3', borderRadius: '9999px', color: '#a16207', fontWeight: '600', fontSize: '12px', border: '1px solid #ca8a04' }}>
                      ⏳ PENDING APPROVAL
                    </span>
                  )}
                </div>
              </div>

              {/* Income Table */}
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', background: '#f0fdf4', padding: '8px', marginBottom: '8px', borderRadius: '4px', color: '#15803d' }}>
                REVENUE / INCOME
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Budgeted Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeEntries.map(([cat, amt]) => (
                    <tr key={cat}>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f5f9' }}>{INCOME_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${(amt || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {incomeEntries.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic' }}>No income items budgeted</td></tr>
                  )}
                  <tr style={{ fontWeight: 'bold', background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                    <td style={{ padding: '8px 12px' }}>Total Income</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#15803d' }}>${totalIncome.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Expense Table */}
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', background: '#fef2f2', padding: '8px', marginBottom: '8px', borderRadius: '4px', color: '#b91c1c' }}>
                EXPENSES
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Budgeted Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseEntries.map(([cat, amt]) => (
                    <tr key={cat}>
                      <td style={{ padding: '7px 12px', borderBottom: '1px solid #f1f5f9' }}>{EXPENSE_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${(amt || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {expenseEntries.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic' }}>No expense items budgeted</td></tr>
                  )}
                  <tr style={{ fontWeight: 'bold', background: '#fef2f2', borderTop: '2px solid #fecaca' }}>
                    <td style={{ padding: '8px 12px' }}>Total Expenses</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#b91c1c' }}>${totalExpense.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Net */}
              <div style={{ margin: '12px 0', padding: '14px 16px', background: net >= 0 ? '#eff6ff' : '#fff7ed', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${net >= 0 ? '#bfdbfe' : '#fed7aa'}` }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Net Budget (Surplus / Deficit)</span>
                <span style={{ fontWeight: 'bold', fontSize: '22px', color: net >= 0 ? '#2563eb' : '#ea580c' }}>
                  ${Math.abs(net).toFixed(2)} {net >= 0 ? 'SURPLUS' : 'DEFICIT'}
                </span>
              </div>

              {/* Notes */}
              {budget.notes && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', color: '#475569', border: '1px solid #e2e8f0' }}>
                  <strong>Notes:</strong> {budget.notes}
                </div>
              )}

              {/* Approval Info */}
              {budget.approved && budget.approved_by && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '6px', fontSize: '13px', color: '#15803d', border: '1px solid #bbf7d0' }}>
                  <strong>Approved by:</strong> {budget.approved_by}
                </div>
              )}

              {/* Signature Lines */}
              <div style={{ marginTop: '40px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Flotilla Approval Signatures
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  {[
                    { label: 'Flotilla Commander', name: flotilla?.commander_name },
                    { label: 'Vice Commander', name: flotilla?.vice_commander_name },
                    { label: 'FSO-FN (Finance)', name: flotilla?.fso_fn_name },
                    { label: 'Meeting Date' },
                  ].map((sig, i) => (
                    <div key={i} style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                      <div style={{ minHeight: '30px' }}>&nbsp;</div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{sig.label}</p>
                      {sig.name && <p style={{ fontSize: '11px', color: '#64748b' }}>{sig.name}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}