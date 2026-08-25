import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b border-slate-200">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Log Out
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <p className="text-center text-slate-600 mb-6">
            Are you sure you want to log out of your account?
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-red-600 hover:bg-red-700 gap-2"
              size="lg"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "Logging out..." : "Yes, Log Out"}
            </Button>
            <Link to={createPageUrl("Dashboard")} className="block">
              <Button
                variant="outline"
                className="w-full gap-2"
                size="lg"
                disabled={isLoggingOut}
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}