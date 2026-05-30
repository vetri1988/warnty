import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, User, Phone, MapPin, Award, CheckCircle, Printer, Plus, RefreshCw, FileText, Smartphone, Camera } from 'lucide-react';
import { BatteryMake, BatteryModel, WarrantyPeriod, Dealer, BatteryRegistration, CompanyDetails } from '../types';
import CameraScanner from './CameraScanner';

export default function WarrantyRegistrationForm({ 
  token,
  onRegistrationSuccess 
}: { 
  token: string;
  onRegistrationSuccess?: (reg: BatteryRegistration) => void;
}) {
  const [makes, setMakes] = useState<BatteryMake[]>([]);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [periods, setPeriods] = useState<WarrantyPeriod[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State Inputs
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyPeriodId, setWarrantyPeriodId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [autoSms, setAutoSms] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Execution States
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<BatteryRegistration | null>(null);

  // Fetch all active values for cascading selects
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}` };
        const [makesRes, periodsRes, dealersRes, companyRes] = await Promise.all([
          fetch('/api/makes?status=Active', { headers }),
          fetch('/api/periods?status=Active', { headers }),
          fetch('/api/dealers?status=Active', { headers }),
          fetch('/api/company')
        ]);
        
        const makesData = await makesRes.json();
        const periodsData = await periodsRes.json();
        const dealersData = await dealersRes.json();
        const companyData = await companyRes.json();

        setMakes(makesData);
        setPeriods(periodsData);
        setDealers(dealersData);
        setCompany(companyData);
      } catch (err) {
        console.error("Error loading registry selectors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, [token]);

  // Handle cascading cascade selection for models
  useEffect(() => {
    if (makeId) {
      setModels([]);
      setModelId('');
      fetch(`/api/models?status=Active&makeId=${makeId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setModels(data))
        .catch(e => console.error("Could not load associated Models", e));
    } else {
      setModels([]);
      setModelId('');
    }
  }, [makeId, token]);

  // Compute live visual expiry preview before submitting
  const [calculatedExpiry, setCalculatedExpiry] = useState('');
  const [calculatedStdExpiry, setCalculatedStdExpiry] = useState('');
  useEffect(() => {
    if (purchaseDate && warrantyPeriodId) {
      const selectedPeriod = periods.find(p => p.id === warrantyPeriodId);
      if (selectedPeriod) {
        const stdMonths = selectedPeriod.standardMonths !== undefined ? selectedPeriod.standardMonths : selectedPeriod.months;
        const prMonths = selectedPeriod.proRataMonths !== undefined ? selectedPeriod.proRataMonths : 0;

        const pDate1 = new Date(purchaseDate);
        if (!isNaN(pDate1.getTime())) {
          pDate1.setMonth(pDate1.getMonth() + stdMonths);
          setCalculatedStdExpiry(pDate1.toISOString().split('T')[0]);
        }

        const pDate2 = new Date(purchaseDate);
        if (!isNaN(pDate2.getTime())) {
          pDate2.setMonth(pDate2.getMonth() + (stdMonths + prMonths));
          setCalculatedExpiry(pDate2.toISOString().split('T')[0]);
        }
        return;
      }
    }
    setCalculatedExpiry('');
    setCalculatedStdExpiry('');
  }, [purchaseDate, warrantyPeriodId, periods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate entries
    if (!makeId || !modelId || !serialNumber.trim() || !purchaseDate || !warrantyPeriodId || !customerName.trim() || !customerContact.trim() || !customerAddress.trim() || !dealerId) {
      setFormError("Please fill out all mandatory fields marked with an asterisk (*)");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          makeId,
          modelId,
          serialNumber: serialNumber.trim().toUpperCase(),
          purchaseDate,
          warrantyPeriodId,
          customerName: customerName.trim(),
          customerContact: customerContact.trim(),
          customerAddress: customerAddress.trim(),
          dealerId,
          invoiceNumber: invoiceNumber.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to commit registration");
      }

      setSuccessRecord(data.registration);
      if (onRegistrationSuccess) onRegistrationSuccess(data.registration);

      if (autoSms) {
        const reg = data.registration;
        const hasProRata = (reg.proRataMonths && reg.proRataMonths > 0) || (reg.standardExpiryDate && reg.standardExpiryDate !== reg.expiryDate);
        const stdExpiry = reg.standardExpiryDate || reg.expiryDate;
        const warrantyMsg = hasProRata
          ? `Standard Free Replacement runs until ${stdExpiry} (${reg.standardMonths}M), followed by a Pro-Rata discount period until ${reg.expiryDate} (${reg.proRataMonths}M)`
          : `Standard Free Replacement runs until ${reg.expiryDate} (${reg.standardMonths}M)`;
        const companyName = company?.shortName || "PowerMax";
        const messageText = `Hello ${reg.customerName}, your ${reg.makeName} ${reg.modelName} battery warranty has been successfully registered! Ref ID: ${reg.id}, Serial: ${reg.serialNumber}. Coverage: ${warrantyMsg}. Powered by ${companyName} Care.`;
        const smsUrl = `sms:${reg.customerContact}?body=${encodeURIComponent(messageText)}`;
        
        // Non-blocking redirect trigger
        window.location.href = smsUrl;

        // Commit SMS notification log record to DB
        fetch(`/api/registrations/${data.registration.id}/sms-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ smsType: "Registration" })
        }).catch(e => console.error("Failed to post registration SMS trace:", e));
      }
    } catch (err: any) {
      setFormError(err.message || "Something went wrong activating this warranty certificate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setMakeId('');
    setModelId('');
    setSerialNumber('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setWarrantyPeriodId('');
    setCustomerName('');
    setCustomerContact('');
    setCustomerAddress('');
    setDealerId('');
    setInvoiceNumber('');
    setFormError(null);
    setSuccessRecord(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mb-3" />
        <span className="text-sm font-semibold">Configuring form cascading values...</span>
      </div>
    );
  }

  // SUCCESS COMPLETION STATE
  if (successRecord) {
    const reg = successRecord;
    const hasProRata = (reg.proRataMonths && reg.proRataMonths > 0) || (reg.standardExpiryDate && reg.standardExpiryDate !== reg.expiryDate);
    const stdExpiry = reg.standardExpiryDate || reg.expiryDate;
    const warrantyMsg = hasProRata
      ? `Standard Free Replacement runs until ${stdExpiry} (${reg.standardMonths}M), followed by a Pro-Rata discount period until ${reg.expiryDate} (${reg.proRataMonths}M)`
      : `Standard Free Replacement runs until ${reg.expiryDate} (${reg.standardMonths}M)`;
    const companyName = company?.shortName || "PowerMax";
    const displayedMessageText = `Hello ${reg.customerName}, your ${reg.makeName} ${reg.modelName} battery warranty has been successfully registered! Ref ID: ${reg.id}, Serial: ${reg.serialNumber}. Coverage: ${warrantyMsg}. Powered by ${companyName} Care.`;

    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl text-center animate-fade-in">
        
        {/* Animated Check Circle icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display mb-1">
          Warranty Created Successfully!
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The activation card has been securely committed to the database ledger. Here are the credentials:
        </p>

        {/* Formatted Certificate Presentation Card */}
        <div className="my-6 border border-slate-150 rounded-2xl bg-slate-50/50 p-6 text-left relative overflow-hidden">
          
          <div className="absolute right-4 top-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border border-emerald-200">
            Active
          </div>

          <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-4 mb-4 gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Unique Registration ID</span>
              <span className="font-mono text-sm font-bold text-slate-800 tracking-wider bg-white rounded border border-slate-200/50 px-2.5 py-1 inline-block mt-1">
                {successRecord.id}
              </span>
            </div>
            <div className="text-right space-y-1">
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">🛡️ Standard Replacement Expiry</span>
                <span className="font-display font-bold text-emerald-700 text-xs mt-0.5 block">
                  {successRecord.standardExpiryDate || successRecord.expiryDate}
                </span>
              </div>
              {((successRecord.proRataMonths && successRecord.proRataMonths > 0) || (successRecord.warrantyMonths > successRecord.standardMonths)) ? (
                <div>
                  <span className="text-[9px] uppercase font-semibold text-slate-400 block">📉 Pro-Rata Discount Expiry</span>
                  <span className="font-display font-bold text-amber-700 text-xs mt-0.5 block">
                    {successRecord.expiryDate}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-700">
            <div>
              <b className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Customer</b>
              <p className="font-bold text-slate-900 mt-0.5">{successRecord.customerName}</p>
              <p className="text-slate-500">{successRecord.customerContact}</p>
            </div>
            
            <div>
              <b className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Dealer Link</b>
              <p className="font-bold text-slate-900 mt-0.5">{successRecord.dealerName}</p>
            </div>

            <div>
              <b className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Battery Specifications</b>
              <p className="font-semibold text-slate-800 mt-0.5">{successRecord.makeName} - {successRecord.modelName}</p>
              <p className="font-mono text-[10px] text-slate-500">Serial: {successRecord.serialNumber}</p>
            </div>

            <div>
              <b className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Purchase Details</b>
              <p className="font-medium mt-0.5">Date: {successRecord.purchaseDate}</p>
              <p className="text-sky-700 font-semibold">{successRecord.warrantyPeriodLabel} Claim Mode</p>
            </div>
          </div>

        </div>

        {/* Customer SMS Dialer Confirmation Card */}
        <div className="my-6 bg-sky-50/40 border border-sky-100 rounded-2xl p-5 text-left space-y-3.5 no-print">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5 font-display">
              <Smartphone className="w-4 h-4 text-sky-600" /> Customer Dialer SMS Confirmation
            </span>
            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200 uppercase">
              Registration Notification
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed font-mono bg-white border border-slate-150 p-3.5 rounded-xl text-slate-700 italic">
              "{displayedMessageText}"
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`sms:${successRecord.customerContact}?body=${encodeURIComponent(displayedMessageText)}`}
                onClick={() => {
                  fetch(`/api/registrations/${successRecord.id}/sms-notification`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ smsType: "Registration" })
                  }).catch(e => console.error("Error logging manually triggered sms:", e));
                }}
                className="inline-flex items-center justify-center text-xs text-white bg-sky-600 hover:bg-sky-700 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" /> Re-Send via Dialer (SMS)
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(displayedMessageText);
                  alert("Message text successfully copied to clipboard!");
                }}
                className="inline-flex items-center justify-center text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold px-4 py-2 rounded-xl cursor-pointer transition-all gap-1.5"
              >
                📋 Copy Message Body
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              * Note: Mobile browsers and tablets will automatically trigger the device's default dialer/SMS messenger pre-filled with customer phone: <span className="font-bold text-slate-600">{successRecord.customerContact}</span>.
            </p>
          </div>
        </div>

        {/* Printable action blocks */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 font-bold text-sm px-6 py-3 rounded-xl cursor-pointer shadow-sm transition-all gap-2"
          >
            <Printer className="w-4 h-4" /> Print warranty card
          </button>
          
          <button
            onClick={handleResetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all gap-2"
          >
            <Plus className="w-4 h-4" /> Log Another Battery
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950 font-display">New Battery Warranty Entry</h1>
        <p className="text-xs text-slate-500">
          Create, validate, and commit dynamic coverage certificates for recently traded battery hardware.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          
          {formError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl p-3.5 mb-6 font-semibold">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Product Specifications Block */}
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full">
                1. Battery Range Parameters
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Battery Manufacturer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={makeId}
                    onChange={(e) => setMakeId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                  >
                    <option value="">-- Choose Manufacturer --</option>
                    {makes.map((mk) => (
                      <option key={mk.id} value={mk.id}>{mk.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Battery Model Variant <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!makeId}
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">{makeId ? "-- Choose Model Range --" : "-- Select Manufacturer First --"}</option>
                    {models.map((md) => (
                      <option key={md.id} value={md.id}>{md.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Outer Shell Barcode Serial <span className="text-rose-500">*</span></span>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Camera className="w-3 h-3" /> Mobile Camera Scan
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="e.g. EXD-8824-A61"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full text-sm pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors uppercase font-mono tracking-wider font-semibold placeholder:normal-case placeholder:font-sans placeholder:font-normal"
                    />
                    <Smartphone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="absolute right-2 top-2 bottom-2 px-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-150 text-sky-700 font-bold text-[10px] rounded-lg tracking-tight transition-colors flex items-center gap-1 cursor-pointer"
                      title="Scan Serial Barcode via Device Camera"
                    >
                      <Camera className="w-3.5 h-3.5" /> Scan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Specific Claim Period <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={warrantyPeriodId}
                    onChange={(e) => setWarrantyPeriodId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                  >
                    <option value="">-- Choose Warranty Period --</option>
                    {periods.map((wp) => (
                      <option key={wp.id} value={wp.id}>{wp.label}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Step 2: Customer Identity Block */}
            <div className="space-y-4 pt-2">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full">
                2. Customer & Outlet Transaction Coordinates
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Registered Defect Owner Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-sm pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                    />
                    <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Contact Reachout Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="w-full text-sm pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                    />
                    <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Registered Postal Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      required
                      rows={2}
                      placeholder="Indicate flat code, building area context, town name..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full text-sm pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                    />
                    <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={dealerId}
                    onChange={(e) => setDealerId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                  >
                    <option value="">-- Choose Sales Dealer --</option>
                    {dealers.map((dl) => (
                      <option key={dl.id} value={dl.id}>{dl.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Financial Invoice Identifier <span className="text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-9021"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full text-sm pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                    />
                    <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Sale Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full text-sm pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                    />
                    <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                {/* Relational Calculated Expiry Banner Preview */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Computed Claim Expirations</span>
                  {calculatedExpiry ? (
                    <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono font-semibold">
                      <div className="flex justify-between items-center bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                        <span className="text-emerald-800 font-sans font-bold flex items-center gap-1">🛡️ Standard Expiry:</span>
                        <span className="text-emerald-700 font-bold">{calculatedStdExpiry}</span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100/50">
                        <span className="text-amber-800 font-sans font-bold flex items-center gap-1">📉 Pro-Rata Expiry:</span>
                        <span className="text-amber-700 font-bold">{calculatedExpiry}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-11 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-center text-xs text-slate-400 italic">
                      Pending warranty period selection...
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Auto trigger SMS Notification Checkbox */}
            <div className="bg-sky-50/50 hover:bg-sky-50/80 border border-sky-100/50 p-4 rounded-2xl flex items-center gap-3 transition-colors">
              <input
                id="autoSmsToggle"
                type="checkbox"
                checked={autoSms}
                onChange={(e) => setAutoSms(e.target.checked)}
                className="w-4.5 h-4.5 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="autoSmsToggle" className="text-xs text-slate-700 font-semibold cursor-pointer select-none">
                <span className="block font-bold text-sky-950 font-display">📱 Automatically Trigger Customer SMS Confirmation Dialer</span>
                <span className="text-[10px] text-slate-500 font-medium">Redirects to system messaging client with a pre-filled activation message right after registering.</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-colors"
              >
                Clear Fields
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-slate-800 cursor-pointer shadow-md transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying barcodes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Initialize Warranty Claim
                  </>
                )}
              </button>
            </div>

          </form>

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
