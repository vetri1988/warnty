import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Search, Loader2, Download, Printer, Edit2, Trash2, Eye, SlidersHorizontal, ChevronLeft, ChevronRight, X, AlertTriangle, Check, RefreshCw, Smartphone, Send, Copy, Sparkles, Bell } from 'lucide-react';
import { BatteryRegistration, BatteryMake, BatteryModel, Dealer, CompanyDetails } from '../types';

export default function RegisteredBatteriesList({ token }: { token: string }) {
  const [registrations, setRegistrations] = useState<BatteryRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const printCardRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintCard = async () => {
    if (!printCardRef.current) return;
    try {
      setIsPrinting(true);
      const imgData = await toPng(printCardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        filter: (node) => {
          if (node.tagName && node.tagName.toLowerCase() === 'button') return false;
          if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') return false;
          return true;
        }
      });
      
      const printContainer = document.createElement('div');
      printContainer.id = 'special-print-container';
      printContainer.style.position = 'absolute';
      printContainer.style.top = '0';
      printContainer.style.left = '0';
      printContainer.style.width = '100%';
      printContainer.style.zIndex = '999999';
      printContainer.style.backgroundColor = 'white';
      
      const img = document.createElement('img');
      img.src = imgData;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      printContainer.appendChild(img);
      
      document.body.appendChild(printContainer);
      
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body > :not(#special-print-container) {
            display: none !important;
          }
          #special-print-container {
            display: block !important;
            position: relative !important;
          }
          @page {
            margin: 0;
          }
        }
      `;
      document.head.appendChild(style);

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, 1000);
      }, 150);

    } catch (err) {
      console.error("Failed to generate printable card", err);
    } finally {
      setIsPrinting(false);
    }
  };

  // SMS Dialer Hub States
  const [smsRecord, setSmsRecord] = useState<BatteryRegistration | null>(null);
  const [smsTemplateType, setSmsTemplateType] = useState<'Registration' | 'Lapse' | 'Offers' | 'Checkup'>('Registration');
  const [smsBody, setSmsBody] = useState('');
  const [smsCopied, setSmsCopied] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatusMessage, setSmsStatusMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Filters State
  const [makes, setMakes] = useState<BatteryMake[]>([]);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination Settings
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting State
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Popup Modals States
  const [selectedCard, setSelectedCard] = useState<BatteryRegistration | null>(null);
  const [editCard, setEditCard] = useState<BatteryRegistration | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);

  // Save/Edit form states inside popup
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editInvoice, setEditInvoice] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/registrations?search=${encodeURIComponent(search.trim())}`;
      if (selectedMake) url += `&makeId=${selectedMake}`;
      if (selectedModel) url += `&modelId=${selectedModel}`;
      if (selectedDealer) url += `&dealerId=${selectedDealer}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to query list registries");
      setRegistrations(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong fetching records.");
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch Setup
  useEffect(() => {
    const fetchAuxiliary = async () => {
      try {
        const headers = { "Authorization": `Bearer ${token}` };
        const [makesRes, dealersRes, companyRes] = await Promise.all([
          fetch('/api/makes?status=Active', { headers }),
          fetch('/api/dealers?status=Active', { headers }),
          fetch('/api/company')
        ]);
        setMakes(await makesRes.json());
        setDealers(await dealersRes.json());
        setCompany(await companyRes.json());
      } catch (err) {
        console.error("Auxiliary items loader issue:", err);
      }
    };
    fetchAuxiliary();
  }, [token]);

  // Load Models related to Makes in filters
  useEffect(() => {
    if (selectedMake) {
      fetch(`/api/models?status=Active&makeId=${selectedMake}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setModels(data))
        .catch(e => console.error(e));
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [selectedMake, token]);

  // Trigger query when filter modifiers change
  useEffect(() => {
    fetchRegistrations();
    setCurrentPage(1);
  }, [selectedMake, selectedModel, selectedDealer, selectedStatus, startDate, endDate, sortBy, sortOrder, token]);

  // Dynamically update default SMS template strings
  useEffect(() => {
    if (smsRecord) {
      const stdExpiry = smsRecord.standardExpiryDate || smsRecord.expiryDate;
      const hasProRata = (smsRecord.proRataMonths && smsRecord.proRataMonths > 0) || (smsRecord.standardExpiryDate && smsRecord.standardExpiryDate !== smsRecord.expiryDate);
      const companyName = company?.shortName || "PowerMax";
      
      if (smsTemplateType === 'Registration') {
        const warrantyMsg = hasProRata
          ? `Standard Free Replacement runs until ${stdExpiry} (${smsRecord.standardMonths}M), followed by a Pro-Rata discount period until ${smsRecord.expiryDate} (${smsRecord.proRataMonths}M)`
          : `Standard Free Replacement runs until ${smsRecord.expiryDate} (${smsRecord.standardMonths}M)`;
        setSmsBody(`Hello ${smsRecord.customerName}, your ${smsRecord.makeName} ${smsRecord.modelName} battery warranty has been successfully registered! Ref ID: ${smsRecord.id}, Serial: ${smsRecord.serialNumber}. Coverage: ${warrantyMsg}. Powered by ${companyName} Care.`);
      } else if (smsTemplateType === 'Lapse') {
        const lapseMsg = hasProRata 
          ? `Standard free replacement ended on ${stdExpiry}, and Pro-Rata discount ends on ${smsRecord.expiryDate}`
          : `Warranty expired on ${smsRecord.expiryDate}`;
        setSmsBody(`Dear ${smsRecord.customerName}, notice regarding battery Reg: ${smsRecord.id} (Serial: ${smsRecord.serialNumber}). ${lapseMsg}. Bring it to ${smsRecord.dealerName} for a checked rating and premium renewal discount!`);
      } else if (smsTemplateType === 'Offers') {
        setSmsBody(`${companyName} Care Offer for ${smsRecord.customerName}! Present Warranty ID ${smsRecord.id} (Serial: ${smsRecord.serialNumber}) at our dealer to get 15% discount on upgrade exchange programs before your warranty completely expires on ${smsRecord.expiryDate}!`);
      } else if (smsTemplateType === 'Checkup') {
        setSmsBody(`Hi ${smsRecord.customerName}, keep your motor running healthy! Visit ${smsRecord.dealerName} for a free checkup of your ${smsRecord.makeName} battery (Serial: ${smsRecord.serialNumber}). Mention Ref: ${smsRecord.id} for 10% off accessories.`);
      }
    }
  }, [smsRecord, smsTemplateType, company]);

  const handleSearchKeyPress = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistrations();
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Pagination calculation
  const totalRecords = registrations.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRegistrations = registrations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Edit action popup triggers
  const handleOpenEdit = (reg: BatteryRegistration) => {
    setEditCard(reg);
    setEditName(reg.customerName);
    setEditPhone(reg.customerContact);
    setEditAddress(reg.customerAddress);
    setEditSerial(reg.serialNumber);
    setEditInvoice(reg.invoiceNumber || '');
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPhone.trim() || !editAddress.trim() || !editSerial.trim()) {
      setEditError("Customer Name, Phone, Address and Serial barcode fields cannot remain blank.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/registrations/${editCard?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: editName.trim(),
          customerContact: editPhone.trim(),
          customerAddress: editAddress.trim(),
          serialNumber: editSerial.trim().toUpperCase(),
          invoiceNumber: editInvoice.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update record details.");
      
      // Update local state list
      setRegistrations(registrations.map(r => r.id === editCard?.id ? data : r));
      setEditCard(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update registration");
    } finally {
      setEditSaving(false);
    }
  };

  // Submit and log specific customer notifications on server DB
  const handleLogSmsSent = async (id: string, smsType: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}/sms-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ smsType })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state list
        setRegistrations(registrations.map(r => r.id === id ? { ...r, lastSmsSentAt: data.registration.lastSmsSentAt, lastSmsType: data.registration.lastSmsType } : r));
        if (smsRecord && smsRecord.id === id) {
          setSmsRecord({ ...smsRecord, lastSmsSentAt: data.registration.lastSmsSentAt, lastSmsType: data.registration.lastSmsType });
        }
      }
    } catch (e) {
      console.error("SMS notification logging error:", e);
    }
  };

  // Submit, send and log specific customer notifications via Fast2SMS API
  const handleSendSmsViaApi = async (id: string, smsType: string, customBody: string) => {
    try {
      setSendingSms(true);
      setSmsStatusMessage(null);
      const res = await fetch(`/api/registrations/${id}/sms-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ smsType, customBody })
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state list
        setRegistrations(registrations.map(r => r.id === id ? { ...r, lastSmsSentAt: data.registration.lastSmsSentAt, lastSmsType: data.registration.lastSmsType } : r));
        if (smsRecord && smsRecord.id === id) {
          setSmsRecord({ ...smsRecord, lastSmsSentAt: data.registration.lastSmsSentAt, lastSmsType: data.registration.lastSmsType });
        }
        if (data.fast2smsResult) {
          if (data.fast2smsResult.success) {
            setSmsStatusMessage({ type: 'success', text: `SMS dispatched successfully via Fast2SMS API!` });
            setTimeout(() => {
              setSmsRecord(null);
              setSmsStatusMessage(null);
            }, 1800);
          } else {
            setSmsStatusMessage({ type: 'error', text: `Fast2SMS API Response: ${data.fast2smsResult.error || 'Failed to dispatch API text.'}` });
          }
        } else {
          setSmsStatusMessage({ type: 'warning', text: `Message logged inside the portal database, but Fast2SMS_API_KEY environment variable is not defined on the web server.` });
        }
      } else {
        setSmsStatusMessage({ type: 'error', text: data.error || "Failed to dispatch SMS through the server." });
      }
    } catch (e: any) {
      console.error("SMS dispatch error:", e);
      setSmsStatusMessage({ type: 'error', text: e.message || "An unexpected error occurred." });
    } finally {
      setSendingSms(false);
    }
  };

  // Delete Action helpers
  const handleDeleteConfirm = async () => {
    if (!deleteCardId) return;
    try {
      const res = await fetch(`/api/registrations/${deleteCardId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRegistrations(registrations.filter(r => r.id !== deleteCardId));
        setDeleteCardId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Could not complete deletion.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export spreadsheet-friendly CSV generator
  const triggerExportCSV = () => {
    if (registrations.length === 0) {
      alert("No battery records compiled to generate spreadsheet sheets.");
      return;
    }

    const headers = [
      "Registration ID",
      "Battery Make",
      "Battery Model",
      "Serial Number",
      "Customer Name",
      "Contact Number",
      "Purchase Date",
      "Warranty Expiry Date",
      "Warranty Status",
      "Dealer Name"
    ];

    const rows = registrations.map(r => [
      `"${r.id}"`,
      `"${r.makeName}"`,
      `"${r.modelName}"`,
      `"${r.serialNumber}"`,
      `"${r.customerName}"`,
      `"${r.customerContact}"`,
      `"${r.purchaseDate}"`,
      `"${r.expiryDate}"`,
      `"${r.status}"`,
      `"${r.dealerName}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registered_Batteries_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedMake('');
    setSelectedModel('');
    setSelectedDealer('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className={`space-y-6 animate-fade-in ${selectedCard ? 'print:space-y-0' : ''}`}>
      
      {/* Upper header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${selectedCard ? 'print:hidden' : ''}`}>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-display">Registered Batteries ledger</h1>
          <p className="text-xs text-slate-500">Query, verify, modify parameters, or issue duplicate warranty certificates.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={triggerExportCSV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 font-semibold px-3 py-2 rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Excel Export
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 font-semibold px-3 py-2 rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 mr-1" /> PDF Ledger
          </button>
        </div>
      </div>

      {/* Advanced filters Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" /> Filter Criteria Selection
          </span>
          <button
            onClick={clearFilters}
            className="text-[11px] text-sky-600 hover:text-sky-700 font-bold uppercase tracking-wider"
          >
            Clear Filters
          </button>
        </div>

        <form onSubmit={handleSearchKeyPress} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Omni search text box */}
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Search Keyword</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Barcode, Customer Name, Claim ID, Phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
              <button
                type="submit"
                className="bg-slate-900 text-white font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Query
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Claim Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-700 hover:border-slate-300"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Sales Outlet Dealer</label>
            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className="w-full bg-slate-50 px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-700"
            >
              <option value="">All Dealers</option>
              {dealers.map((dl) => (
                <option key={dl.id} value={dl.id}>{dl.name}</option>
              ))}
            </select>
          </div>

          {/* Cascading Make & Model selection */}
          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Battery Make</label>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="w-full bg-slate-50 px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-700"
            >
              <option value="">All Makes</option>
              {makes.map((mk) => (
                <option key={mk.id} value={mk.id}>{mk.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Model Variant</label>
            <select
              disabled={!selectedMake}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-50 px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-700 disabled:opacity-50"
            >
              <option value="">All Models</option>
              {models.map((md) => (
                <option key={md.id} value={md.id}>{md.name}</option>
              ))}
            </select>
          </div>

          {/* Sales calendars dates */}
          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Sales Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Sales End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-700"
            />
          </div>

        </form>
      </div>

      {/* Professional data table container */}
      <div className={`bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden ${selectedCard ? 'print:hidden' : ''}`}>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
            <span className="text-xs font-semibold">Retrieving registry records...</span>
          </div>
        ) : totalRecords === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Registry Cards Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting filter dimensions or key in a new battery registration form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th onClick={() => handleSort('id')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">Register ID</th>
                  <th onClick={() => handleSort('makeName')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">Battery Range</th>
                  <th onClick={() => handleSort('serialNumber')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">Barcode Serial</th>
                  <th onClick={() => handleSort('customerName')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">Customer Contact</th>
                  <th onClick={() => handleSort('purchaseDate')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">Sale Date</th>
                  <th onClick={() => handleSort('expiryDate')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50">Claim Expiry</th>
                  <th onClick={() => handleSort('status')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 text-center">Status</th>
                  <th className="py-3 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-950 whitespace-nowrap">{reg.id}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 uppercase tracking-tight">{reg.makeName}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{reg.modelName}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold tracking-wider text-slate-800 uppercase whitespace-nowrap">
                      <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">{reg.serialNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{reg.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{reg.customerContact}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium whitespace-nowrap">{reg.purchaseDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">{reg.expiryDate}</td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        reg.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedCard(reg)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-sky-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Details card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSmsRecord(reg)}
                          className="p-1.5 bg-sky-50 text-sky-600 hover:text-sky-800 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                          title="Dialer & Marketing SMS Hub (Offers & Lapse alerts)"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(reg)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-sky-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modify Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteCardId(reg.id)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Remove Claim record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination blocks (Hidden in print) */}
        {!loading && totalRecords > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 py-3.5 px-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs no-print select-none">
            
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border rounded px-2 py-1 outline-none text-xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-400 text-[11px] ml-1">
                Showing {Math.min(totalRecords, (currentPage - 1) * pageSize + 1)}-{Math.min(totalRecords, currentPage * pageSize)} of {totalRecords} records
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded border bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="font-semibold text-slate-800 px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded border bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* -------------------------------------------------------------------
          MODALS INTEGRATIONS: 1. DETAILS PREVIEW MODAL
      ------------------------------------------------------------------- */}
      {selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:absolute print:inset-0 print:bg-white print:p-0">
          <div ref={printCardRef} className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-scale-up print:border-2 print:border-slate-800 print:shadow-none print:max-w-[800px] print:w-[800px] print:mx-auto print:rounded-lg print:print-color-adjust-exact">
            
            <button
              onClick={() => setSelectedCard(null)}
              data-html2canvas-ignore="true"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full print:hidden"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className={`px-6 py-4 text-white flex items-center justify-between ${
              selectedCard.status === 'Active' ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-rose-600 to-red-500'
            }`}>
              <div>
                <span className="text-[9px] uppercase font-bold text-white/80 block">Credential Card View</span>
                <span className="font-mono text-sm font-bold tracking-wider">{selectedCard.id}</span>
              </div>
              <span className="bg-white text-slate-800 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                {selectedCard.status}
              </span>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-slate-700">
                <div>
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Client Owner</b>
                  <p className="font-bold text-slate-950 text-sm mt-0.5">{selectedCard.customerName}</p>
                </div>
                <div>
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Reachout Contact</b>
                  <p className="font-semibold text-slate-850 mt-0.5">{selectedCard.customerContact}</p>
                </div>
                <div className="col-span-2 border-t border-dashed border-slate-100 pt-3">
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Owner Location</b>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{selectedCard.customerAddress}</p>
                </div>
                <div className="col-span-2 border-t border-dashed border-slate-100 pt-3">
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Relational Product Description</b>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedCard.makeName} &rarr; {selectedCard.modelName}</p>
                  <p className="font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded border inline-block mt-1">Serial Code: {selectedCard.serialNumber}</p>
                </div>
                <div className="border-t border-dashed border-slate-100 pt-3">
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Purchase Date</b>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedCard.purchaseDate}</p>
                </div>
                <div className="border-t border-dashed border-slate-100 pt-3">
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Standard replacement expiry</b>
                  <p className="text-emerald-700 font-bold mt-0.5 font-mono">{selectedCard.standardExpiryDate || selectedCard.expiryDate}</p>
                </div>
                <div className="border-t border-dashed border-slate-100 pt-3">
                  <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Pro-Rata Discount Expiry</b>
                  <p className="text-amber-700 font-bold mt-0.5 font-mono">
                    {((selectedCard.proRataMonths && selectedCard.proRataMonths > 0) || (selectedCard.standardExpiryDate && selectedCard.standardExpiryDate !== selectedCard.expiryDate))
                      ? selectedCard.expiryDate 
                      : "None (Standard Only)"}
                  </p>
                </div>
                {selectedCard.lastSmsSentAt && (
                  <div className="col-span-2 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl flex items-center justify-between text-[11px] mb-2 font-sans font-medium text-slate-700">
                    <span className="text-slate-600 font-bold flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Notification Trace:
                    </span>
                    <span className="font-bold text-indigo-900">
                      Dispatched {selectedCard.lastSmsType} alert on {new Date(selectedCard.lastSmsSentAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <b className="text-[10px] text-slate-400 block uppercase tracking-wide">Authorized Outsource Dealer</b>
                   <p className="font-bold text-slate-900 mt-0.5">{selectedCard.dealerName}</p>
                   {selectedCard.invoiceNumber && (
                     <p className="text-[11px] text-slate-500 font-mono mt-1">Financial Invoice: {selectedCard.invoiceNumber}</p>
                   )}
                </div>
              </div>

              <div className="flex gap-2 print:hidden" data-html2canvas-ignore="true">
                <button
                  type="button"
                  onClick={handlePrintCard}
                  disabled={isPrinting}
                  className="flex-1 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  {isPrinting ? 'Generating...' : 'Print warranty card certificate'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODALS INTEGRATIONS: 2. EDITING POPUP MODAL
      ------------------------------------------------------------------- */}
      {editCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-up">
            
            <div className="px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold font-display text-sm">Modify Registration Coordinates</h3>
              <p className="text-[10px] text-slate-400">Card Code Reference: {editCard.id}</p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {editError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg font-medium">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1.5">Registered Customer Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1.5">Reachout Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1.5">Claim Serial Number</label>
                  <input
                    type="text"
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none uppercase font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1.5">Registered Customer Address</label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wide mb-1.5">Invoice Code Number</label>
                <input
                  type="text"
                  placeholder="Optional billing reference ID"
                  value={editInvoice}
                  onChange={(e) => setEditInvoice(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="border-t border-slate-150 pt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setEditCard(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  {editSaving ? <RefreshCw className="w-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Changes
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODALS INTEGRATIONS: 3. DELETE CONFIRMATION MODAL
      ------------------------------------------------------------------- */}
      {deleteCardId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up text-center">
            
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 font-display">Are you absolutely sure?</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              This will permanently purge this battery's warranty certificate registration. Action is irreversible.
            </p>

            <div className="mt-5 flex gap-2 justify-center">
              <button
                onClick={() => setDeleteCardId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                No, Keep Card
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer shadow-sm"
              >
                Yes, Purge Entry
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODALS INTEGRATIONS: 4. CUSTOMER SMS DIALER & MARKETING HUB
      ------------------------------------------------------------------- */}
      {smsRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative animate-scale-up">
            
            <button
              onClick={() => {
                setSmsRecord(null);
                setSmsCopied(false);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer z-10"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="px-6 py-4 bg-gradient-to-r from-sky-900 to-indigo-950 text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="font-bold font-display text-sm text-left">Customer SMS Dialer & Notification Hub</h3>
                <p className="text-[10px] text-sky-200 text-left">Ref Card ID: {smsRecord.id} &bull; Customer Contact: {smsRecord.customerContact}</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Recipient Details Row */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl grid grid-cols-2 gap-3 text-left">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Recipient Customer</span>
                  <p className="font-bold text-slate-950 mt-0.5">{smsRecord.customerName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Target Phone</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{smsRecord.customerContact}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Battery Specs</span>
                  <p className="font-semibold text-slate-700 mt-0.5 truncate">{smsRecord.makeName} - {smsRecord.modelName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Expiration Date</span>
                  <p className={`font-bold mt-0.5 ${smsRecord.status === 'Expired' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {smsRecord.expiryDate} ({smsRecord.status})
                  </p>
                </div>

                {smsRecord.lastSmsSentAt && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2.5 mt-1.5 flex items-center justify-between text-[10px] text-indigo-950 font-medium font-sans">
                    <span className="flex items-center gap-1"><Bell className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Notification Dispatch Log:</span>
                    <span>Last Alert ({smsRecord.lastSmsType}) opened on {new Date(smsRecord.lastSmsSentAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Template Selectors */}
              <div className="space-y-1.5 text-left">
                <label className="block text-slate-500 font-bold uppercase tracking-wide text-[10px]">Select Notification Campaign Template</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSmsTemplateType('Registration')}
                    className={`p-2 rounded-xl border text-[11px] text-center font-bold tracking-tight transition-all cursor-pointer ${
                      smsTemplateType === 'Registration'
                        ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    📝 Confirm Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsTemplateType('Lapse')}
                    className={`p-2 rounded-xl border text-[11px] text-center font-bold tracking-tight transition-all cursor-pointer ${
                      smsTemplateType === 'Lapse'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    ⚠️ Warranty Lapse
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsTemplateType('Offers')}
                    className={`p-2 rounded-xl border text-[11px] text-center font-bold tracking-tight transition-all cursor-pointer ${
                      smsTemplateType === 'Offers'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    🛍️ Exclusive Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsTemplateType('Checkup')}
                    className={`p-2 rounded-xl border text-[11px] text-center font-bold tracking-tight transition-all cursor-pointer ${
                      smsTemplateType === 'Checkup'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    🔧 Free Checkup
                  </button>
                </div>
              </div>

              {/* Editable SMS body text area */}
              <div className="text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-500 font-bold uppercase tracking-wide text-[10px]">Customize Outbound SMS Message Box</label>
                  <span className={`text-[9px] font-bold ${smsBody.length > 160 ? 'text-amber-600 font-mono' : 'text-slate-400 font-mono'}`}>
                    {smsBody.length} chars (approx. {Math.ceil(smsBody.length / 160)} SMS segment{Math.ceil(smsBody.length / 160) > 1 ? 's' : ''})
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 font-medium text-slate-800 leading-relaxed"
                />
              </div>

              {/* Tips */}
              <div className="bg-sky-50/50 p-3 rounded-2xl text-[10px] text-sky-800 leading-relaxed text-left">
                ℹ️ Clicking <b>"Open Device Dialer"</b> will trigger your cell phone or computer's native SMS application, pre-seeded with customer contact <b>{smsRecord.customerContact}</b>. Alternatively, configure the server side environment and dispatch the text with <b>"Send Live (Fast2SMS API)"</b>.
              </div>

              {smsStatusMessage && (
                <div className={`p-3.5 rounded-2xl text-[11px] font-medium leading-relaxed text-left flex gap-1.5 items-start ${
                  smsStatusMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/80' 
                    : smsStatusMessage.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-100/80'
                    : 'bg-amber-50 text-amber-800 border border-amber-100/80'
                }`}>
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    smsStatusMessage.type === 'success'
                      ? 'text-emerald-500'
                      : smsStatusMessage.type === 'error'
                      ? 'text-rose-500'
                      : 'text-amber-500'
                  }`} />
                  <div>{smsStatusMessage.text}</div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(smsBody);
                    setSmsCopied(true);
                    setTimeout(() => setSmsCopied(false), 2000);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all inline-flex items-center justify-center gap-1.5"
                >
                  {smsCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {smsCopied ? "Copied!" : "Copy SMS Body"}
                </button>

                <button
                  type="button"
                  disabled={sendingSms}
                  onClick={() => handleSendSmsViaApi(smsRecord.id, smsTemplateType, smsBody)}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer text-center inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  {sendingSms ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Dispatching API...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-250 animate-pulse" />
                      Send Live (Fast2SMS API)
                    </>
                  )}
                </button>

                <a
                  href={`sms:${smsRecord.customerContact}?body=${encodeURIComponent(smsBody)}`}
                  onClick={() => {
                    handleLogSmsSent(smsRecord.id, smsTemplateType);
                    setSmsRecord(null);
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer text-center inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Open Device Dialer (SMS)
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSmsRecord(null);
                    setSmsCopied(false);
                    setSmsStatusMessage(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Discard
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
