import React, { useEffect, useState } from "react";
import { useAppSettings } from "./components/settings/useAppSettings";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Settings,
  Users,
  PiggyBank,
  Search,
  Anchor,
  Clock,
  LogOut
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationGenerator from "@/components/notifications/NotificationGenerator";
import { hasPageAccess } from "@/components/auth/AccessControl";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const getNavigationItems = (user, settings = {}) => {
  const allItems = [
    {
      title: "Super Admin",
      url: createPageUrl("SuperAdmin"),
      icon: Settings,
      page: "SuperAdmin",
    },
    {
      title: "Import Data",
      url: createPageUrl("Import"),
      icon: Search,
      page: "Import",
    },
    {
      title: "Division Dashboard",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
      page: "Dashboard",
    },
    {
      title: "Flotilla Dashboard",
      url: createPageUrl("FlotillaDashboard"),
      icon: Anchor,
      page: "FlotillaDashboard",
    },
    ...(settings.volunteer !== false ? [{
      title: "My Volunteer Hours",
      url: createPageUrl("VolunteerActivityHours"),
      icon: Clock,
      page: "VolunteerActivityHours",
    }] : []),
    ...(settings.vessel_exams !== false ? [{
      title: "Vessel Exams",
      url: createPageUrl("VesselExams"),
      icon: Anchor,
      page: "VesselExams",
    }] : []),
    ...(settings.division_settings !== false ? [{
      title: "Division Settings",
      url: createPageUrl("DivisionSettings"),
      icon: Settings,
      page: "DivisionSettings",
    }] : []),
    ...(settings.flotillas !== false ? [{
      title: "Flotilla Management",
      url: createPageUrl("Flotillas"),
      icon: Users,
      page: "Flotillas",
    }] : []),
    ...(settings.user_management !== false ? [
      {
        title: "User Management",
        url: createPageUrl("UserManagement"),
        icon: Users,
        page: "UserManagement",
      },
      {
        title: "Role Management",
        url: createPageUrl("RoleManagement"),
        icon: Users,
        page: "UserManagement",
      },
    ] : []),
    ...(settings.audit !== false ? [
      {
        title: "Audit Committee",
        url: createPageUrl("AuditCommittee"),
        icon: Settings,
        page: "AuditCommittee",
      },
      {
        title: "Audit Trail",
        url: createPageUrl("AuditTrail"),
        icon: Settings,
        page: "AuditTrail",
      },
    ] : []),
    ...(settings.transactions !== false ? [{
      title: "Financial Entry",
      url: createPageUrl("Transactions"),
      icon: DollarSign,
      page: "Transactions",
    }] : []),
    ...(settings.bank_reconciliation !== false ? [{
      title: "Bank Reconciliation",
      url: createPageUrl("BankReconciliation"),
      icon: LayoutDashboard,
      page: "BankReconciliation",
    }] : []),
    ...(settings.payee_vendors !== false ? [{
      title: "Payee/Vendor Management",
      url: createPageUrl("PayeeVendors"),
      icon: Users,
      page: "PayeeVendors",
    }] : []),
    ...(settings.budgets !== false ? [{
      title: "Budget Planning",
      url: createPageUrl("Budgets"),
      icon: PiggyBank,
      page: "Budgets",
    }] : []),
    ...(settings.reports !== false ? [
      {
        title: "Reports Center",
        url: createPageUrl("Reports"),
        icon: FileText,
        page: "Reports",
      },
      ...(settings.volunteer !== false ? [{
        title: "Volunteer Reports",
        url: createPageUrl("VolunteerReports"),
        icon: FileText,
        page: "VolunteerReports",
      }] : []),
    ] : []),
    ...(settings.analytics !== false ? [{
      title: "Analytics",
      url: createPageUrl("Analytics"),
      icon: TrendingUp,
      page: "Analytics",
    }] : []),
    {
      title: "Search",
      url: createPageUrl("Search"),
      icon: Search,
      page: "Search",
    },
    {
      title: "My Profile",
      url: createPageUrl("UserProfile"),
      icon: Users,
      page: "UserProfile",
    },
    {
      title: "Log Out",
      url: createPageUrl("Logout"),
      icon: LogOut,
      page: "Logout",
    },
  ];

  if (!user) return [];

  return allItems.filter(item => {
    if (item.page) {
      return hasPageAccess(user, item.page);
    }
    return true; 
  });
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useAppSettings();

  useEffect(() => {
    // Set viewport meta tag for responsive design
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, shrink-to-fit=no';

    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log("User loaded:", currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user", error);
      // If user fetch fails, still show the page
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas'],
    queryFn: () => base44.entities.Flotilla.list(),
    enabled: !!user,
    initialData: [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
    enabled: !!user,
    initialData: [],
  });

  const activeFlotillasCount = flotillas?.filter(f => f.active !== false).length || 0;

  const thisMonthTransactions = transactions?.filter(t => {
    if (!t.transaction_date) return false;
    const transactionDate = new Date(t.transaction_date);
    const now = new Date();
    return transactionDate.getMonth() === now.getMonth() && 
           transactionDate.getFullYear() === now.getFullYear();
  }) || [];

  const thisMonthTotal = thisMonthTransactions.reduce((sum, t) => {
    return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
  }, 0);

  const navigationItems = getNavigationItems(user, settings);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Not authenticated</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-slate-50 overflow-x-hidden">
        <style>
          {`
            :root {
              --primary-navy: #1e3a8a;
              --primary-gold: #fbbf24;
              --secondary-navy: #1e40af;
              --light-navy: #dbeafe;
              --text-navy: #1e3a8a;
            }
          `}
        </style>
        
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6 bg-gradient-to-r from-blue-900 to-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693829a377dc19b168d2f13c/a6b95a4c9_uscgauxstar.jpeg" 
                  alt="USCG Auxiliary Logo" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">USCG Auxiliary</h2>
                <p className="text-blue-100 text-sm font-medium">Southwest District–Southern Region | Greater Arizona Division</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Financial Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-800 transition-all duration-200 rounded-xl font-medium ${
                          location.pathname === item.url 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm' 
                            : 'text-slate-700'
                        }`}
                      >
                        <Link 
                          to={item.url} 
                          className="flex items-center gap-3 px-4 py-3"
                          onClick={(e) => {
                            // Close sidebar on mobile after clicking
                            if (window.innerWidth < 768) {
                              setTimeout(() => {
                                const trigger = document.querySelector('[data-sidebar="trigger"]');
                                if (trigger) trigger.click();
                              }, 100);
                            }
                          }}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-600 font-medium">Active Flotillas</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-800">{activeFlotillasCount}</span>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-slate-600 font-medium">This Month</span>
                    </div>
                    <span className={`text-xl font-bold ${thisMonthTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${Math.abs(thisMonthTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">D10</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">Greater Phoenix Division</p>
                <p className="text-xs text-slate-500">Financial Management</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-slate-50 overflow-x-hidden max-w-full">
          <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger data-sidebar="trigger" className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200 md:hidden flex-shrink-0" />
                <div className="flex items-center gap-2 md:hidden overflow-hidden">
                  <Anchor className="w-5 h-5 md:w-6 md:h-6 text-blue-800 flex-shrink-0" />
                  <h1 className="text-sm md:text-lg font-bold text-slate-900 truncate">USCG Auxiliary</h1>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <NotificationBell user={user} />
                  <NotificationGenerator user={user} />
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
    </ErrorBoundary>
  );
}