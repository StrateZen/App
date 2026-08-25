import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, AlertCircle, Upload } from "lucide-react";
import { RequireAuth } from "../components/auth/AccessControl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";

export default function ImportPage() {
  return (
    <RequireAuth requiredLevel="super_admin">
      <ImportContent />
    </RequireAuth>
  );
}

function ImportContent() {
  const [uploading, setUploading] = useState({
    payeeVendor: false,
    income: false,
    expense: false,
    volunteerActivity: false
  });
  const [results, setResults] = useState({
    payeeVendor: null,
    income: null,
    expense: null,
    volunteerActivity: null
  });

  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setUploading(prev => ({ ...prev, [type]: true }));
    setResults(prev => ({ ...prev, [type]: null }));

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Define schemas for each type
      const schemas = {
        payeeVendor: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              address: { type: "string" },
              notes: { type: "string" }
            },
            required: ["name"]
          }
        },
        income: {
          type: "array",
          items: {
            type: "object",
            properties: {
              flotilla_id: { type: "string" },
              transaction_type: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              amount: { type: "number" },
              transaction_date: { type: "string" },
              method: { type: "string" },
              vendor_payee: { type: "string" },
              notes: { type: "string" }
            },
            required: ["flotilla_id", "transaction_type", "category", "description", "amount", "transaction_date"]
          }
        },
        expense: {
          type: "array",
          items: {
            type: "object",
            properties: {
              flotilla_id: { type: "string" },
              transaction_type: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              amount: { type: "number" },
              transaction_date: { type: "string" },
              method: { type: "string" },
              check_number: { type: "string" },
              vendor_payee: { type: "string" },
              vendor_email: { type: "string" },
              vendor_address: { type: "string" },
              notes: { type: "string" }
            },
            required: ["flotilla_id", "transaction_type", "category", "description", "amount", "transaction_date", "vendor_payee"]
          }
        },
        volunteerActivity: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              start_time: { type: "string" },
              end_time: { type: "string" },
              total_hours: { type: "number" },
              activity_mission: { type: "string" },
              activity_code: { type: "string" },
              mileage: { type: "number" },
              non_reimbursed_expenses: { type: "number" },
              notes: { type: "string" },
              flotilla_id: { type: "string" }
            },
            required: ["date", "activity_mission", "activity_code"]
          }
        }
      };

      // Extract data
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schemas[type]
      });

      if (result.status === "error") {
        setResults(prev => ({ 
          ...prev, 
          [type]: { success: false, message: result.details } 
        }));
        return;
      }

      // Import data
      const data = result.output;
      let imported = 0;

      if (type === 'payeeVendor') {
        await base44.entities.PayeeVendor.bulkCreate(data);
        imported = data.length;
      } else if (type === 'income' || type === 'expense') {
        // Resolve flotilla numbers (e.g. "10-08") to actual flotilla IDs
        const flotillas = await base44.entities.Flotilla.list();
        const resolvedData = data.map(row => {
          if (row.flotilla_id) {
            const match = flotillas.find(
              f => f.flotilla_number === row.flotilla_id || f.id === row.flotilla_id
            );
            if (match) return { ...row, flotilla_id: match.id };
          }
          return row;
        });
        await base44.entities.Transaction.bulkCreate(resolvedData);
        imported = resolvedData.length;
      } else if (type === 'volunteerActivity') {
        await base44.entities.VolunteerActivity.bulkCreate(data);
        imported = data.length;
      }

      setResults(prev => ({ 
        ...prev, 
        [type]: { success: true, count: imported } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [type]: { success: false, message: error.message } 
      }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const payeeVendorTemplate = `name,email,phone,address,notes
"ABC Marine Supply","contact@abcmarine.com","(555) 123-4567","123 Harbor St, Seattle, WA 98101","Main boat parts supplier"
"Pacific Fuel Company","billing@pacificfuel.com","(555) 234-5678","456 Dock Rd, Seattle, WA 98102","Monthly fuel vendor"`;

  const incomeTransactionTemplate = `flotilla_id,transaction_type,category,description,amount,transaction_date,method,vendor_payee,notes
"flotilla-123",income,member_dues,"Annual member dues - John Smith",50.00,2025-01-15,check,"Member: John Smith","Check #1234"
"flotilla-123",income,donations,"Donation from local business",250.00,2025-01-20,check,"ABC Corporation","Annual donation"
"flotilla-123",income,course_fees,"Boating safety course fees",150.00,2025-02-01,card,"Course Participants","Spring 2025 class"`;

  const expenseTransactionTemplate = `flotilla_id,transaction_type,category,description,amount,transaction_date,method,check_number,vendor_payee,vendor_email,vendor_address,notes
"flotilla-123",expense,boat_maintenance,"Oil change and filter replacement",125.50,2025-01-10,check,1001,"ABC Marine Supply","contact@abcmarine.com","123 Harbor St, Seattle, WA 98101","Regular maintenance"
"flotilla-123",expense,fuel_costs,"Monthly fuel purchase",450.00,2025-01-15,check,1002,"Pacific Fuel Company","billing@pacificfuel.com","456 Dock Rd, Seattle, WA 98102","January fuel"
"flotilla-123",expense,training_materials,"Safety equipment for training",200.00,2025-02-01,card,,"Marine Safety Store","sales@marinesafety.com","789 Safety Ave, Portland, OR 97201","PE materials"`;

  const volunteerActivityTemplate = `date,start_time,end_time,total_hours,activity_mission,activity_code,mileage,non_reimbursed_expenses,notes,flotilla_id
2025-01-15,09:00,12:00,3.0,"Vessel Safety Checks at Marina",91A,15,0,"Conducted 5 VSCs",flotilla-123
2025-01-20,14:00,16:30,2.5,"Public Education at High School",99B,25,12.50,"Gas and materials",flotilla-123
2025-02-01,08:00,17:00,9.0,"Division Meeting and Training",99A,45,0,"All-day event",flotilla-123`;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Import Data</h1>
              <p className="text-slate-600 mt-1">Download CSV templates for bulk data imports</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Before importing transactions, make sure the flotilla_id exists in your system.
            For expense transactions, either use an existing payee/vendor name or the system will create a new one.
            Users cannot be bulk imported - they must be invited individually through the User Management page.
          </AlertDescription>
        </Alert>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payees/Vendors */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-purple-50">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Payees/Vendors Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Import multiple payees and vendors at once. Only the <strong>name</strong> field is required.
                </p>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-mono text-slate-700 mb-2">Required Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• name (required)</li>
                  </ul>
                  <p className="text-xs font-mono text-slate-700 mt-3 mb-2">Optional Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• email</li>
                    <li>• phone (format: (555) 123-4567)</li>
                    <li>• address</li>
                    <li>• notes</li>
                  </ul>
                </div>
                <Button
                  onClick={() => downloadCSV('payee-vendor-template.csv', payeeVendorTemplate)}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Upload CSV File:</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'payeeVendor')}
                    disabled={uploading.payeeVendor}
                  />
                  {uploading.payeeVendor && (
                    <p className="text-sm text-blue-600 mt-2">Importing...</p>
                  )}
                  {results.payeeVendor && (
                    <Alert className={`mt-2 ${results.payeeVendor.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <AlertDescription className={results.payeeVendor.success ? 'text-green-800' : 'text-red-800'}>
                        {results.payeeVendor.success 
                          ? `✓ Successfully imported ${results.payeeVendor.count} payees/vendors`
                          : `✗ Error: ${results.payeeVendor.message}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income Transactions */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-green-50">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Income Transactions Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Import income transactions in bulk. Make sure to use valid flotilla IDs.
                </p>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-mono text-slate-700 mb-2">Required Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• flotilla_id</li>
                    <li>• transaction_type (must be "income")</li>
                    <li>• category</li>
                    <li>• description</li>
                    <li>• amount</li>
                    <li>• transaction_date (YYYY-MM-DD)</li>
                  </ul>
                  <p className="text-xs font-mono text-slate-700 mt-3 mb-2">Optional Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• method (cash, check, card, other)</li>
                    <li>• vendor_payee</li>
                    <li>• notes</li>
                  </ul>
                </div>
                <Button
                  onClick={() => downloadCSV('income-transactions-template.csv', incomeTransactionTemplate)}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Upload CSV File:</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'income')}
                    disabled={uploading.income}
                  />
                  {uploading.income && (
                    <p className="text-sm text-blue-600 mt-2">Importing...</p>
                  )}
                  {results.income && (
                    <Alert className={`mt-2 ${results.income.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <AlertDescription className={results.income.success ? 'text-green-800' : 'text-red-800'}>
                        {results.income.success 
                          ? `✓ Successfully imported ${results.income.count} income transactions`
                          : `✗ Error: ${results.income.message}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Transactions */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-red-50">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Expense Transactions Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Import expense transactions in bulk. Either email or address is required for expenses.
                </p>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-mono text-slate-700 mb-2">Required Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• flotilla_id</li>
                    <li>• transaction_type (must be "expense")</li>
                    <li>• category</li>
                    <li>• description</li>
                    <li>• amount</li>
                    <li>• transaction_date (YYYY-MM-DD)</li>
                    <li>• vendor_payee</li>
                    <li>• vendor_email OR vendor_address</li>
                  </ul>
                  <p className="text-xs font-mono text-slate-700 mt-3 mb-2">Optional Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• method (cash, check, card, other)</li>
                    <li>• check_number (required if method is "check")</li>
                    <li>• notes</li>
                  </ul>
                </div>
                <Button
                  onClick={() => downloadCSV('expense-transactions-template.csv', expenseTransactionTemplate)}
                  className="w-full gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Upload CSV File:</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'expense')}
                    disabled={uploading.expense}
                  />
                  {uploading.expense && (
                    <p className="text-sm text-blue-600 mt-2">Importing...</p>
                  )}
                  {results.expense && (
                    <Alert className={`mt-2 ${results.expense.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <AlertDescription className={results.expense.success ? 'text-green-800' : 'text-red-800'}>
                        {results.expense.success 
                          ? `✓ Successfully imported ${results.expense.count} expense transactions`
                          : `✗ Error: ${results.expense.message}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volunteer Activities */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-indigo-50">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Volunteer Activities Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Import volunteer activity hours in bulk. All activities will be associated with your user account.
                </p>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-mono text-slate-700 mb-2">Required Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• date (YYYY-MM-DD)</li>
                    <li>• activity_mission (description)</li>
                    <li>• activity_code (91A, 91H, 91B, 91C, 91D, 91G, 99A, 99B, 99C, 99D, 99E)</li>
                  </ul>
                  <p className="text-xs font-mono text-slate-700 mt-3 mb-2">Optional Fields:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• start_time (HH:MM format)</li>
                    <li>• end_time (HH:MM format)</li>
                    <li>• total_hours (calculated or manual)</li>
                    <li>• mileage</li>
                    <li>• non_reimbursed_expenses</li>
                    <li>• notes</li>
                    <li>• flotilla_id</li>
                  </ul>
                </div>
                <Button
                  onClick={() => downloadCSV('volunteer-activities-template.csv', volunteerActivityTemplate)}
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Upload CSV File:</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'volunteerActivity')}
                    disabled={uploading.volunteerActivity}
                  />
                  {uploading.volunteerActivity && (
                    <p className="text-sm text-blue-600 mt-2">Importing...</p>
                  )}
                  {results.volunteerActivity && (
                    <Alert className={`mt-2 ${results.volunteerActivity.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <AlertDescription className={results.volunteerActivity.success ? 'text-green-800' : 'text-red-800'}>
                        {results.volunteerActivity.success 
                          ? `✓ Successfully imported ${results.volunteerActivity.count} volunteer activities`
                          : `✗ Error: ${results.volunteerActivity.message}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Info Card */}
          <Card className="shadow-sm border-slate-200 border-amber-200 bg-amber-50">
            <CardHeader className="border-b border-amber-100 bg-amber-100">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Users - No Import Available
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Users cannot be imported via CSV for security reasons. All users must be invited individually through the User Management page.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-slate-600">
                  To add users to your system:
                </p>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Navigate to the User Management page</li>
                  <li>Click "Invite User"</li>
                  <li>Enter their email and assign permissions</li>
                  <li>They will receive an invitation email</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">
              How to Use These Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 min-w-[24px]">1.</span>
                <span>Download the appropriate CSV template by clicking the button above.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 min-w-[24px]">2.</span>
                <span>Open the template in Excel, Google Sheets, or any spreadsheet application.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 min-w-[24px]">3.</span>
                <span>Fill in your data following the example rows provided. Delete the example rows before importing.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 min-w-[24px]">4.</span>
                <span>Save your file as CSV format.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 min-w-[24px]">5.</span>
                <span>Use the ExtractDataFromUploadedFile integration or your admin tools to import the data.</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}