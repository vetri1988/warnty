import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  LayoutDashboard, 
  FileEdit, 
  Layers, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut, 
  User, 
  Award, 
  Battery, 
  Search, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

import PublicStatusCheck from './components/PublicStatusCheck';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import WarrantyRegistrationForm from './components/WarrantyRegistrationForm';
import RegisteredBatteriesList from './components/RegisteredBatteriesList';
import MasterSettings from './components/MasterSettings';
import { BatteryRegistration, CompanyDetails } from './types';

export default function App() {
  // Authentication check states
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // Corporate company branding state
  const [company, setCompany] = useState<CompanyDetails | null>(null);

  const handleCompanyUpdate = useCallback((updated: CompanyDetails) => {
    setCompany(updated);
  }, []);

  // Dynamic public vs admin workspace routing: 'Public' | 'Login' | 'AdminWorkspace'
  const [currentView, setCurrentView] = useState<'Public' | 'Login' | 'AdminWorkspace'>(
    (localStorage.getItem('currentView') as 'Public' | 'Login' | 'AdminWorkspace') || 'Public'
  );
  
  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);
  
  // Admin inner active route: 'Dashboard' | 'Register' | 'List' | 'Settings'
  const [adminRoute, setAdminRoute] = useState<'Dashboard' | 'Register' | 'List' | 'Settings'>('Dashboard');

  // Mobile navigation collapsible toggler
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verification lookup trigger (useful to pre-populate details from QR/external links)
  const [viewDetailCard, setViewDetailCard] = useState<BatteryRegistration | null>(null);

  // Load dynamic corporate company settings
  useEffect(() => {
    fetch('/api/company')
      .then(res => {
        if (!res.ok) throw new Error("Could not fetch company settings");
        return res.json();
      })
      .then(data => setCompany(data))
      .catch(e => console.error("Error loading company information:", e));
  }, []);

  // Fetch admin profile details if token exists
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            // Token expired or invalid
            handleLogout();
            throw new Error("Session expired");
          }
          return res.json();
        })
        .then(data => {
          setAdminUser(data);
        })
        .catch(e => console.error("Session fetch issue:", e));
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, userDetails: any) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    setAdminUser(userDetails);
    setCurrentView('AdminWorkspace');
    setAdminRoute('Dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdminUser(null);
    setCurrentView('Public');
  };

  const navigateToAdminRoute = (route: 'Dashboard' | 'Register' | 'List' | 'Settings') => {
    setAdminRoute(route);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 print:min-h-0 print:block print:bg-white">
      
      {/* -------------------------------------------------------------------
          UPPER NAVIGATION BAR HEADER
      ------------------------------------------------------------------- */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 no-print sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            {company?.logoDataUrl ? (
              <img src={company.logoDataUrl} alt={`${company.shortName || "Company"} Logo`} className="w-9 h-9 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-yellow-accent to-amber-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
                <Battery className="w-5.5 h-5.5" />
              </div>
            )}
            <div>
              <span className="text-lg font-black tracking-tight flex items-center">
                {company?.shortName || "PowerMax"}<span className="text-yellow-accent font-display font-medium ml-1.5">{company?.appTitleLabel || "Warranty portal"}</span>
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mt-[-2px]">
                {company?.name || "PowerMax Industries Ltd."}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            
            {currentView === 'Public' ? (
              <button
                onClick={() => setCurrentView('Login')}
                className="bg-yellow-accent hover:bg-yellow-accent-hover text-slate-950 font-extrabold text-xs px-4  py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
              >
                Admin Area Login
              </button>
            ) : currentView === 'Login' ? (
              <button
                onClick={() => setCurrentView('Public')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer transition-colors"
              >
                Back to Public Check
              </button>
            ) : (
              // Logged in Header state
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-100">{adminUser?.username || "Admin Profile"}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{adminUser?.email || "admin@powermax.com"}</p>
                </div>
                
                <div className="h-6 w-px bg-slate-800" />

                <button
                  onClick={handleLogout}
                  className="bg-transparent hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 border border-transparent hover:border-rose-500/20 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Sign out of Admin workspace"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile dropdown toggler */}
          <div className="md:hidden flex items-center gap-2">
            {currentView === 'AdminWorkspace' && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            
            {currentView !== 'AdminWorkspace' && (
              <button
                onClick={() => setCurrentView(currentView === 'Public' ? 'Login' : 'Public')}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 cursor-pointer transition-colors"
              >
                {currentView === 'Public' ? "Admin Sign In" : "Public Check"}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* -------------------------------------------------------------------
          MAIN DESKTOP WORKSPACE LAYOUT (Admin Workspace uses left sidebar)
      ------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:flex-row relative print:block print:m-0 print:p-0">
        
        {/* Responsive Mobile navigation drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="md:hidden fixed inset-y-0 left-0 bg-slate-900 text-white w-64 z-50 p-6 flex flex-col justify-between shadow-2xl border-r border-slate-800 no-print"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <span className="text-sm font-bold tracking-widest text-slate-400">ADMIN DRAWER</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1 bg-slate-800 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => navigateToAdminRoute('Dashboard')}
                    className={`w-full text-left py-2.5 px-4 rounded-xl font-bold flex items-center gap-3 text-xs transition-colors ${
                      adminRoute === 'Dashboard' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5" /> Overview Dashboard
                  </button>
                  <button
                    onClick={() => navigateToAdminRoute('Register')}
                    className={`w-full text-left py-2.5 px-4 rounded-xl font-bold flex items-center gap-3 text-xs transition-colors ${
                      adminRoute === 'Register' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileEdit className="w-4.5 h-4.5" /> Warrant Registration
                  </button>
                  <button
                    onClick={() => navigateToAdminRoute('List')}
                    className={`w-full text-left py-2.5 px-4 rounded-xl font-bold flex items-center gap-3 text-xs transition-colors ${
                      adminRoute === 'List' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4.5 h-4.5" /> Registered Batteries
                  </button>
                  {adminUser?.role === 'Admin' && (
                    <button
                      onClick={() => navigateToAdminRoute('Settings')}
                      className={`w-full text-left py-2.5 px-4 rounded-xl font-bold flex items-center gap-3 text-xs transition-colors ${
                        adminRoute === 'Settings' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4.5 h-4.5" /> Master Settings
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-auto">
                <div className="text-xs text-slate-400 mb-4 px-2">
                  <p className="font-semibold text-white">{adminUser?.username}</p>
                  <p className="text-[10px] truncate">{adminUser?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-slate-800 hover:bg-rose-500/15 text-rose-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar Panel */}
        {currentView === 'AdminWorkspace' && (
          <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col py-6 px-4 shrink-0 no-print">
            <div className="space-y-6 flex-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest px-2 select-none">
                Core Navigations
              </span>

              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => navigateToAdminRoute('Dashboard')}
                  className={`w-full text-left py-3 px-4 rounded-xl font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                    adminRoute === 'Dashboard' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" /> Dashboard Overview
                </button>
                <button
                  onClick={() => navigateToAdminRoute('Register')}
                  className={`w-full text-left py-3 px-4 rounded-xl font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                    adminRoute === 'Register' ? 'bg-yellow-accent text-slate-950 shadow animate-pulse-subtle' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileEdit className="w-4.5 h-4.5" /> Log Battery Warranty
                </button>
                <button
                  onClick={() => navigateToAdminRoute('List')}
                  className={`w-full text-left py-3 px-4 rounded-xl font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                    adminRoute === 'List' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4.5 h-4.5" /> Registered Batteries
                </button>
                {adminUser?.role === 'Admin' && (
                  <button
                    onClick={() => navigateToAdminRoute('Settings')}
                    className={`w-full text-left py-3 px-4 rounded-xl font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                      adminRoute === 'Settings' ? 'bg-yellow-accent text-slate-950 shadow' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4.5 h-4.5" /> Master Settings
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5 mt-auto text-xs">
              <div className="bg-slate-850 px-3 py-2 border border-slate-800/50 rounded-xl mb-4 select-none">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Access Node</span>
                <p className="font-bold text-slate-200 mt-1">{adminUser?.username || "Admin node"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 font-bold py-2 px-3 rounded-lg border border-transparent hover:border-rose-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </aside>
        )}

        {/* CONTENT PANELS WORKSPACE REGION */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 print:p-0 print:m-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView + (currentView === 'AdminWorkspace' ? adminRoute : '')}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {currentView === 'Public' && (
                <PublicStatusCheck onGoToLogin={() => setCurrentView('Login')} />
              )}
              
              {currentView === 'Login' && (
                <AdminLogin 
                  onLoginSuccess={handleLoginSuccess}
                  onBackToPortal={() => setCurrentView('Public')}
                />
              )}

              {currentView === 'AdminWorkspace' && (
                <>
                  {adminRoute === 'Dashboard' && (
                    <AdminDashboard 
                      token={token!}
                      onViewRegistration={(reg) => {
                        setViewDetailCard(reg);
                        setAdminRoute('List');
                      }}
                    />
                  )}
                  {adminRoute === 'Register' && (
                    <WarrantyRegistrationForm 
                      token={token!} 
                      onRegistrationSuccess={() => {}}
                    />
                  )}
                  {adminRoute === 'List' && (
                    <RegisteredBatteriesList token={token!} />
                  )}
                  {adminRoute === 'Settings' && adminUser?.role === 'Admin' && (
                    <MasterSettings 
                      token={token!} 
                      onCompanyUpdate={handleCompanyUpdate} 
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* -------------------------------------------------------------------
          PRO-BRAND FOOTER AREA (Hidden in print)
      ------------------------------------------------------------------- */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 select-none">
          <p className="font-semibold text-slate-300">{company?.name || "PowerMax Industries Ltd."} - Care Portal</p>
          <p className="text-[10px] text-slate-505 mt-1">
            Built with production-ready relational API architecture, offline file safety caching, JWT security, and Tailwind design matrices.
          </p>
          <p className="text-[9px] text-slate-500 mt-2">
            © 2026 {company?.name || "PowerMax Industries Ltd."} All claim parameters are logged securely.
          </p>
        </div>
      </footer>

    </div>
  );
}
