import React, { useState, useEffect } from 'react';
import { Battery, ShieldCheck, ShieldAlert, Clock, Search, ExternalLink, RefreshCw, Layers, Award, TrendingUp, Users } from 'lucide-react';
import { DashboardStats, BatteryRegistration } from '../types';

export default function AdminDashboard({ 
  token,
  onViewRegistration 
}: { 
  token: string;
  onViewRegistration: (reg: BatteryRegistration) => void;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick lookup search form inside dashboard
  const [dashSearch, setDashSearch] = useState('');
  const [searchResult, setSearchResult] = useState<BatteryRegistration[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard metrics");
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleDashSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashSearch.trim()) {
      setSearchResult([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/registrations?search=${encodeURIComponent(dashSearch.trim())}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data.slice(0, 5)); // show top 5 matches
      }
    } catch (err) {
      console.error("Dashboard quick search failed", err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mb-3" />
        <span className="text-sm font-semibold tracking-wide">Loading workspace analytics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-800 p-6 rounded-2xl text-center max-w-lg mx-auto">
        <h3 className="text-lg font-bold">Analytics Load Issue</h3>
        <p className="text-sm mt-1">{error || "Please verify administrator parameters."}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate SVG Bar configurations
  const maxMakeCount = stats.makesBreakdown.reduce((max, curr) => curr.count > max ? curr.count : max, 1);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-display">Overview Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time battery warranty activations, coverage limits, and dealer transactions.</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 font-semibold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Counters
        </button>
      </div>

      {/* KPI 3-Grid Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Batteries Registered */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <Battery className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Total Registered</span>
            <span className="text-3xl font-extrabold text-slate-950 font-display mt-0.5 block">{stats.totalRegistered}</span>
            <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 border rounded-full inline-block mt-1">Batteries Logged</span>
          </div>
        </div>

        {/* Active Warranties */}
        <div className="bg-white border border-slate-110 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Active Warranties</span>
            <span className="text-3xl font-extrabold text-slate-950 font-display mt-0.5 block text-emerald-700">{stats.activeWarranties}</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full inline-block mt-1 font-medium">✓ Protected Claims</span>
          </div>
        </div>

        {/* Expired Warranties */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Expired Warranties</span>
            <span className="text-3xl font-extrabold text-slate-950 font-display mt-0.5 block text-rose-600">{stats.expiredWarranties}</span>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded-full inline-block mt-1 font-medium">✗ Protection Lapsed</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Diagnostic Analytics & SVG Charts (Col 7) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* SVG Manufacturer Breakdown Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Manufacturer Distribution Chart</h3>
                <p className="text-xs text-slate-500">Share of registrations partitioned by battery brand makes metadata</p>
              </div>
              <TrendingUp className="w-5 h-5 text-sky-500 shrink-0" />
            </div>

            {stats.makesBreakdown.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-xl">
                No active records. Complete your first registration to unlock visual analytical trends.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {stats.makesBreakdown.map((make) => {
                  const percentage = Math.round((make.count / stats.totalRegistered) * 100);
                  const barWidth = Math.max(8, Math.round((make.count / maxMakeCount) * 100));
                  return (
                    <div key={make.name} className="flex items-center gap-4 text-xs">
                      <div className="w-24 font-bold text-slate-700 uppercase tracking-wide truncate">{make.name}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                        {/* Dynamic SVG style bar */}
                        <div 
                          className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${barWidth}%` }}
                        />
                        <span className="absolute left-2.5 top-1 font-bold text-[10px] text-sky-950">{percentage}%</span>
                      </div>
                      <div className="w-16 text-right font-mono font-semibold text-slate-500">{make.count} Batches</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Search Lookup Widget */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 font-display mb-2">Omni-Channel Quick Search</h3>
            <p className="text-xs text-slate-500 mb-4">Search serial barcodes or client phone numbers directly for on-the-fly claims inspection.</p>

            <form onSubmit={handleDashSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Barcode Serial, Claim ID, Contact, Customer Name..."
                  value={dashSearch}
                  onChange={(e) => setDashSearch(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-800"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-slate-800 shadow-sm cursor-pointer transition-colors"
              >
                Find
              </button>
            </form>

            {dashSearch.trim() && (
              <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                {searching ? (
                  <p className="text-center text-xs text-slate-500 py-2">Searching database...</p>
                ) : searchResult.length === 0 ? (
                  <p className="text-center text-xs text-rose-500 py-2">No matching entries located.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {searchResult.map((reg) => (
                      <div key={reg.id} className="py-2.5 flex justify-between items-center text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{reg.customerName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1 rounded mr-1">{reg.serialNumber}</span> • {reg.modelName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            reg.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {reg.status}
                          </span>
                          <button
                            onClick={() => onViewRegistration(reg)}
                            className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                            title="View full credentials card"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Recently Logged Transactions and Dealers Metrics (Col 5) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Active Registrants list block */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 font-display mb-1">Recent Registrations</h3>
            <p className="text-xs text-slate-500 mb-4">Latest warranty contracts entered onto the digital ledger.</p>

            {stats.recentRegistrations.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl">
                Battery registration ledger is currently empty.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentRegistrations.map((reg) => (
                  <div key={reg.id} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{reg.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{reg.makeName} • {reg.modelName}</p>
                      <p className="font-mono text-[9px] text-slate-400 mt-1">Serial: {reg.serialNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                        reg.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {reg.status}
                      </span>
                      <p className="text-[9px] text-slate-400 font-medium mt-1.5">{reg.purchaseDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dealer Sales Registry table summary */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Dealer Statistics</h3>
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            
            {stats.dealersBreakdown.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4 border border-dashed rounded-lg">No active dealer sales records compiled.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {stats.dealersBreakdown.slice(0, 5).map((dl) => (
                  <div key={dl.name} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-xs">{dl.name}</span>
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded font-mono text-[10px] shrink-0">
                      {dl.count} sales
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
