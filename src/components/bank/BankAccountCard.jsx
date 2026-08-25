import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ChevronRight, Building2, Phone, Mail, MapPin, Users } from "lucide-react";

export default function BankAccountCard({ account, flotillas, onEdit, onDelete, onViewReconciliations }) {
  const getFlotillaName = (flotillaId) => {
    const flotilla = flotillas.find(f => f.id === flotillaId);
    return flotilla ? `Flotilla ${flotilla.flotilla_number} - ${flotilla.flotilla_name}` : 'Unknown';
  };

  const signers = [
    account.primary_signer,
    account.secondary_signer,
    ...(account.additional_signers ? account.additional_signers.split(',').map(s => s.trim()) : [])
  ].filter(Boolean);

  return (
    <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {account.account_name}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">{getFlotillaName(account.flotilla_id)}</p>
          </div>
          <Badge className={account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {account.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Account Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">Account Details</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Account Number</p>
                  <p className="font-mono text-sm text-slate-900">{account.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Bank Name</p>
                  <p className="text-sm text-slate-900">{account.bank_name}</p>
                </div>
                {account.bank_branch && (
                  <div>
                    <p className="text-xs text-slate-500">Branch</p>
                    <p className="text-sm text-slate-900">{account.bank_branch}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bank Contact Information */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">Bank Contact</p>
              <div className="space-y-2">
                {account.bank_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-900">{account.bank_address}</p>
                  </div>
                )}
                {account.bank_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-900">{account.bank_phone}</p>
                  </div>
                )}
                {account.bank_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-900">{account.bank_email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Authorized Signers */}
        {signers.length > 0 && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-700">Authorized Signers</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {signers.map((signer, idx) => (
                <Badge key={idx} variant="outline" className="bg-white">
                  {signer}
                  {idx === 0 && ' (Primary)'}
                  {idx === 1 && account.secondary_signer && ' (Secondary)'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {account.notes && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-700">{account.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(account)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(account)}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => onViewReconciliations(account)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            View Reconciliations
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}