import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminLogin({ 
  onLoginSuccess, 
  onBackToPortal 
}: { 
  onLoginSuccess: (token: string, adminInfo: any) => void;
  onBackToPortal: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please input credentials");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Check your password.");
      }

      onLoginSuccess(data.token, data.admin);
    } catch (err: any) {
      setError(err.message || "Something went wrong during administrative sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden relative">
        
        {/* Branding banner color bar */}
        <div className="h-2 bg-gradient-to-r from-sky-500 via-primary-600 to-indigo-600" />

        <div className="p-8">
          
          {/* Logo element */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBackToPortal}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Public Portal
            </button>
            <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Admin
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-950 font-display">Administrative Logon</h1>
            <p className="text-slate-500 text-xs mt-1">
              Access warranty metrics, models, mappings, and registered customer rosters.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl p-3 mb-4 font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wilder mb-1.5">
                User Account Identification
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-800"
                />
                <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wilder">
                  Security Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-slate-800"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Access...
                </>
              ) : (
                "Authorize Credentials"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
