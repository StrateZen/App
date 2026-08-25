/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analytics from './pages/Analytics';
import AuditCommittee from './pages/AuditCommittee';
import AuditTrail from './pages/AuditTrail';
import BankReconciliation from './pages/BankReconciliation';
import Budgets from './pages/Budgets';
import Dashboard from './pages/Dashboard';
import DivisionSettings from './pages/DivisionSettings';
import FlotillaDashboard from './pages/FlotillaDashboard';
import Flotillas from './pages/Flotillas';
import Home from './pages/Home';
import Import from './pages/Import';
import Logout from './pages/Logout';
import PayeeVendors from './pages/PayeeVendors';
import Reports from './pages/Reports';
import RoleManagement from './pages/RoleManagement';
import Search from './pages/Search';
import SuperAdmin from './pages/SuperAdmin';
import Transactions from './pages/Transactions';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import VesselExams from './pages/VesselExams';
import VolunteerActivityHours from './pages/VolunteerActivityHours';
import VolunteerReports from './pages/VolunteerReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "AuditCommittee": AuditCommittee,
    "AuditTrail": AuditTrail,
    "BankReconciliation": BankReconciliation,
    "Budgets": Budgets,
    "Dashboard": Dashboard,
    "DivisionSettings": DivisionSettings,
    "FlotillaDashboard": FlotillaDashboard,
    "Flotillas": Flotillas,
    "Home": Home,
    "Import": Import,
    "Logout": Logout,
    "PayeeVendors": PayeeVendors,
    "Reports": Reports,
    "RoleManagement": RoleManagement,
    "Search": Search,
    "SuperAdmin": SuperAdmin,
    "Transactions": Transactions,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "VesselExams": VesselExams,
    "VolunteerActivityHours": VolunteerActivityHours,
    "VolunteerReports": VolunteerReports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};