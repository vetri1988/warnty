import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, ShieldCheck, ShieldAlert, Printer, RefreshCw, Smartphone, Award, ExternalLink, Camera } from 'lucide-react';
import { BatteryRegistration, BatteryMake, BatteryModel } from '../types';
import CameraScanner from './CameraScanner';

export default function PublicStatusCheck({ onGoToLogin }: { onGoToLogin: () => void }) {
  const [serialNumber, setSerialNumber] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [makes, setMakes] = useState<BatteryMake[]>([]);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatteryRegistration | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Load dynamic corporate company settings
  useEffect(() => {
    fetch('/api/company')
      .then((res) => res.json())
      .then((data) => setCompany(data))
      .catch((e) => console.error("Error loading company details inside status page:", e));
  }, []);

  // Fetch active Makes and Models for public filter selector dropdowns
  useEffect(() => {
    fetch('/api/makes?status=Active')
      .then((res) => res.json())
      .then((data) => setMakes(data))
      .catch((e) => console.error("Error loading makes for public widget:", e));
  }, []);

  useEffect(() => {
    if (selectedMake) {
      fetch(`/api/models?status=Active&makeId=${selectedMake}`)
        .then((res) => res.json())
        .then((data) => setModels(data))
        .catch((e) => console.error("Error loading models related to make:", e));
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [selectedMake]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError("Please input a chemical Serial Number to proceed");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let url = `/api/public/warranty-check?serialNumber=${encodeURIComponent(serialNumber.trim().toUpperCase())}`;
      if (selectedMake) url += `&makeId=${selectedMake}`;
      if (selectedModel) url += `&modelId=${selectedModel}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Warranty lookup failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to locate records. Check parameters and try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerPrintCard = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Branding Header Area */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-3 tracking-wider uppercase">
          <Award className="w-3.5 h-3.5 mr-1" /> Verified Warranty Hub
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 sm:text-5xl">
          {company?.shortName || "PowerMax"}<span className="text-sky-600 font-display ml-1.5">{company?.appTitleLabel || "Secure Care"}</span>
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-base">
          Validate your energy purchase, monitor remaining claim coverage days, or check your serial activation ledger status in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Search Widget Card (Left) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 font-display">Check Coverage</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center justify-between">
                <span>Battery Serial Number <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Mobile Camera Scan
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. EXD-9031-H76"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full text-sm pl-10 pr-24 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none uppercase font-mono tracking-wider font-semibold placeholder:normal-case placeholder:font-sans"
                />
                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-2 top-2 bottom-2 px-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-150 text-sky-700 font-bold text-[10px] rounded-lg tracking-tight transition-colors flex items-center gap-1 cursor-pointer"
                  title="Scan Battery Serial via Mobile Camera"
                >
                  <Camera className="w-3.5 h-3.5" /> Scan
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Found on the unique barcode sticker affixed to your outer battery container shell.
              </p>
            </div>

            <div className="border-t border-dashed border-slate-100 my-4 pt-4">
              <span className="text-xs font-medium text-slate-400 block mb-2">Optional refinement fields:</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
                    Battery Manufacturer
                  </label>
                  <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  >
                    <option value="">Any Manufacturer</option>
                    {makes.map((mk) => (
                      <option key={mk.id} value={mk.id}>{mk.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
                    Specific Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Any Model</option>
                    {models.map((md) => (
                      <option key={md.id} value={md.id}>{md.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Records...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Fetch Status
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-100 mt-6 pt-5 text-center">
            <span className="text-slate-400 text-xs">Are you an authorized dealer or admin?</span>
            <button
              onClick={onGoToLogin}
              className="block w-full text-center mt-2.5 text-xs text-sky-600 hover:text-sky-700 font-semibold uppercase tracking-wider"
            >
              Sign In to Admin Workspace &rarr;
            </button>
          </div>
        </div>

        {/* Results Presentation Area (Right) */}
        <div className="lg:col-span-7">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">No Match Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
              <div className="mt-4 p-3 bg-white border border-rose-100/50 rounded-xl max-w-xs mx-auto text-xs text-slate-400 text-left">
                💡 **Tips:**
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Verify characters (e.g. number `0` vs letter `O`).</li>
                  <li>Ensure the dealer completed your registration.</li>
                </ul>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Awaiting Input</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Key in your battery product's unique serial number on the left to verify active claim validity.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden relative">
              
              {/* Warranty Card Top Ribbon Banner */}
              <div className={`px-6 py-5 text-white flex items-center justify-between ${
                result.status === 'Active' ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-rose-600 to-red-500'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">Registration Certificate</span>
                  <span className="text-lg font-mono font-bold tracking-wider">{result.id}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase text-slate-900 border ${
                  result.status === 'Active' ? 'bg-emerald-100 border-emerald-200' : 'bg-rose-100 border-rose-200'
                }`}>
                  {result.status === 'Active' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Expired
                    </>
                  )}
                </div>
              </div>

              {/* Certificate Inner Panels */}
              <div id="warranty-card-printable-area" className="p-6">
                
                {/* Print only Header (Hidden on screen, shown in print triggers) */}
                <div className="print-only hidden text-center border-b pb-4 mb-4">
                  <h1 className="text-2xl font-bold tracking-tight">{(company?.shortName || "POWERMAX").toUpperCase()} WARRANTY CERTIFICATE</h1>
                  <p className="text-xs text-slate-500">Official Claim Verification Document</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column - Product Metrics */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Battery Manufacturer</span>
                      <p className="font-bold text-slate-900 font-display text-base">{result.makeName}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Model Range Specification</span>
                      <p className="font-semibold text-slate-800 text-sm">{result.modelName}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Serial Barcode Entry</span>
                      <p className="font-mono text-slate-900 font-semibold tracking-wider text-sm bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block">
                        {result.serialNumber}
                      </p>
                    </div>

                    <div className="border-t border-dashed border-slate-100 pt-3 mt-3">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Purchased From (Dealer)</span>
                      <div className="flex items-start gap-1.5 text-slate-700 text-xs text-left">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{result.dealerName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Customer Info & Dates */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Registered Customer</span>
                      <p className="font-bold text-slate-900 text-sm">{result.customerName}</p>
                      <p className="text-xs text-slate-500">{result.customerContact}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-semi text-slate-400 block mb-0.5">Purchase Date</span>
                        <div className="flex items-center gap-1 text-slate-700 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{result.purchaseDate}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semi text-slate-400 block mb-0.5">Claim Duration</span>
                        <div className="flex items-center gap-1 text-slate-700 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="text-sky-700">{result.warrantyPeriodLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">Warranty Dual-Timeline Ledger</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        {/* Standard Replacement Card */}
                        <div className={`p-3.5 rounded-2xl border transition-all ${
                          new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate)
                            ? "bg-emerald-50/70 border-emerald-200" 
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-500">🛡️ 1. Standard Replacement</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate) ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500 font-normal"
                            }`}>
                              {new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate) ? "Active" : "Completed"}
                            </span>
                          </div>
                          <p className="text-sm font-bold font-mono tracking-tight text-slate-800">
                            Until {result.standardExpiryDate || result.expiryDate}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-1">
                            {new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate)
                              ? "✓ Eligible for 100% standard free replacement." 
                              : "Standard replacement window closed."}
                          </p>
                        </div>

                        {/* Pro-Rata Card */}
                        {((result.proRataMonths && result.proRataMonths > 0) || (result.standardExpiryDate && result.standardExpiryDate !== result.expiryDate)) ? (
                          <div className={`p-3.5 rounded-2xl border transition-all ${
                            new Date("2026-05-28") >= new Date(result.standardExpiryDate || result.expiryDate) && new Date("2026-05-28") < new Date(result.expiryDate)
                              ? "bg-amber-50/70 border-amber-200 ring-2 ring-amber-500/15" 
                              : new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate)
                                ? "bg-slate-50/70 border-slate-100"
                                : "bg-slate-200/50 border-slate-200 text-slate-500"
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-500">📉 2. Pro-Rata Discount</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                new Date("2026-05-28") >= new Date(result.standardExpiryDate || result.expiryDate) && new Date("2026-05-28") < new Date(result.expiryDate)
                                  ? "bg-amber-100 text-amber-800 animate-pulse font-extrabold" 
                                  : new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate)
                                    ? "bg-sky-50 text-sky-700 font-semibold"
                                    : "bg-slate-200 text-slate-500 font-normal"
                              }`}>
                                {new Date("2026-05-28") >= new Date(result.standardExpiryDate || result.expiryDate) && new Date("2026-05-28") < new Date(result.expiryDate)
                                  ? "Active Phase" 
                                  : new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate)
                                    ? "Pending"
                                    : "Expired"}
                              </span>
                            </div>
                            <p className="text-sm font-bold font-mono tracking-tight text-slate-800">
                              Until {result.expiryDate}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1">
                              {new Date("2026-05-28") >= new Date(result.standardExpiryDate || result.expiryDate) && new Date("2026-05-28") < new Date(result.expiryDate)
                                ? "✓ Eligible for percentage discount on replacement battery cost." 
                                : new Date("2026-05-28") < new Date(result.standardExpiryDate || result.expiryDate)
                                  ? `Starts after standard warranty standard expiry.`
                                  : "Pro-rata discount protection expired."}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-center">
                            <span className="text-[10px] text-slate-400 italic">No secondary Pro-Rata configuration linked</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>

                {/* Relational QR Code Verification Section */}
                <div className="border-t border-slate-100 my-6 pt-5 flex flex-col sm:flex-row items-center gap-5">
                  {/* Dynamic QR Mock */}
                  <div className="w-24 h-24 bg-white border border-slate-200 rounded-lg p-1.5 shrink-0 flex flex-col items-center justify-center relative shadow-sm">
                    {/* SVG representation of standard looking QR code */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                      <rect width="100" height="100" fill="none" />
                      <path d="M5,5 h25 v25 h-25 z M12,12 h11 v11 h-11 z M70,5 h25 v25 h-25 z M77,12 h11 v11 h-11 z M5,70 h25 v25 h-25 z M12,77 h11 v11 h-11 z" fill="currentColor"/>
                      <path d="M40,5 h10 v25 h-10 z M15,40 h15 v10 h-15 z M45,45 h20 v10 h-20 z M55,15 h10 v15 h-10 z M70,40 h25 v10 h-25 z M40,70 h15 v25 h-15 z M65,70 h15 v10 h-15 z M85,75 h10 v20 h-10 z M70,85 h10 v10 h-10 z" fill="currentColor"/>
                    </svg>
                    <span className="absolute bottom-1 bg-white/95 text-[7px] font-bold text-slate-500 px-1 rounded scale-90 border">CHECK</span>
                  </div>
                  
                  <div className="text-center sm:text-left flex-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Self-Referential QR Verification</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Dealers or inspectors can scan the dynamic QR imprint on the back to verify this certificate directly within our unified status database.
                    </p>
                    
                    {/* Printable action helpers */}
                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 no-print">
                      <button
                        onClick={triggerPrintCard}
                        className="inline-flex items-center text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-200/50 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" /> Print Card
                      </button>
                      <a
                        href={`https://ais-pre-jlny3nffd6zorw4uy6kstd-143407010454.asia-southeast1.run.app/?lookup=${encodeURIComponent(result.serialNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-sky-600 hover:text-sky-700 font-semibold px-3 py-1.5 transition-colors gap-1"
                      >
                        Launch Direct Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      <CameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedText) => {
          setSerialNumber(scannedText);
          setIsScannerOpen(false);
        }}
      />

    </div>
  );
}
