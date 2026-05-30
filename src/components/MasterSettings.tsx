import React, { useState, useEffect, useCallback, memo } from 'react';
import * as XLSX from 'xlsx';
import { ToggleLeft, Plus, Edit2, Trash, Check, X, ShieldAlert, Library, ListStart, CalendarClock, Store, Search, HelpCircle, RefreshCw, Building2, Users, Database, UploadCloud, DownloadCloud, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { BatteryMake, BatteryModel, WarrantyPeriod, Dealer, CompanyDetails } from '../types';

function MasterSettings({ token, onCompanyUpdate }: { token: string; onCompanyUpdate?: (updated: CompanyDetails) => void }) {
  // Tabs: 'Makes' | 'Models' | 'Periods' | 'Dealers' | 'Company' | 'Users' | 'Database'
  const [activeTab, setActiveTab] = useState<'Makes' | 'Models' | 'Periods' | 'Dealers' | 'Company' | 'Users' | 'Database'>('Makes');
  const [loading, setLoading] = useState(true);

  // States lists
  const [makes, setMakes] = useState<BatteryMake[]>([]);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [periods, setPeriods] = useState<WarrantyPeriod[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Search filter inputs
  const [tabSearch, setTabSearch] = useState('');

  // Form Creation Input drawers
  const [makeName, setMakeName] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelMakeId, setModelMakeId] = useState('');
  const [periodMonths, setPeriodMonths] = useState('');
  const [periodStandardMonths, setPeriodStandardMonths] = useState('');
  const [periodProRataMonths, setPeriodProRataMonths] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');

  // User accounts inputs
  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'Admin' | 'General'>('General');

  // Drawer errors/triggers
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Editing state mapping
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isDbUnlocked, setIsDbUnlocked] = useState(false);
  const [dbPassword, setDbPassword] = useState('');
  
  // Custom states for multi field edits (Models and Dealers)
  const [editModelMakeId, setEditModelMakeId] = useState('');
  const [editDealerPhone, setEditDealerPhone] = useState('');
  const [editDealerAddress, setEditDealerAddress] = useState('');
  const [editPeriodMonths, setEditPeriodMonths] = useState('');
  const [editPeriodStandardMonths, setEditPeriodStandardMonths] = useState('');
  const [editPeriodProRataMonths, setEditPeriodProRataMonths] = useState('');

  // Editing user fields
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<'Admin' | 'General'>('General');

  // Company details dynamic branding states
  const [compName, setCompName] = useState('');
  const [compShortName, setCompShortName] = useState('');
  const [compAppTitle, setCompAppTitle] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compLogoDataUrl, setCompLogoDataUrl] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  const fetchTabRecord = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const [makesRes, modelsRes, periodsRes, dealersRes, companyRes] = await Promise.all([
        fetch('/api/makes', { headers }),
        fetch('/api/models', { headers }),
        fetch('/api/periods', { headers }),
        fetch('/api/dealers', { headers }),
        fetch('/api/company', { headers })
      ]);

      setMakes(await makesRes.json());
      setModels(await modelsRes.json());
      setPeriods(await periodsRes.json());
      setDealers(await dealersRes.json());

      const compData = await companyRes.json();
      setCompName(compData.name || '');
      setCompShortName(compData.shortName || '');
      setCompAppTitle(compData.appTitleLabel || '');
      setCompPhone(compData.contactPhone || '');
      setCompEmail(compData.contactEmail || '');
      setCompAddress(compData.address || '');
      setCompLogoDataUrl(compData.logoDataUrl || '');

      // Load users safely
      try {
        const usersRes = await fetch('/api/users', { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } catch (e) {
        console.error("Failed to load user credentials", e);
      }
    } catch (err) {
      setActionError("Could not refresh parameters. Verify auth credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSavingCompany(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      const res = await fetch("/api/company", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: compName,
          shortName: compShortName,
          appTitleLabel: compAppTitle,
          contactPhone: compPhone,
          contactEmail: compEmail,
          address: compAddress,
          logoDataUrl: compLogoDataUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update company details");
      
      setCompName(data.name);
      setCompShortName(data.shortName);
      setCompAppTitle(data.appTitleLabel);
      setCompPhone(data.contactPhone);
      setCompEmail(data.contactEmail);
      setCompAddress(data.address);
      
      if (onCompanyUpdate) {
        onCompanyUpdate(data);
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to save company details.");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add some size/type validations here
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCompLogoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // clear input
  };

  useEffect(() => {
    fetchTabRecord();
  }, [token]);

  // Handle addition form submissions
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const headers = { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${token}` 
    };

    try {
      if (activeTab === "Makes") {
        if (!makeName.trim()) throw new Error("Manufacturer Make name is mandatory.");
        const res = await fetch("/api/makes", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: makeName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMakes([...makes, data]);
        setMakeName('');
      } else if (activeTab === "Models") {
        if (!modelName.trim() || !modelMakeId) throw new Error("A Model variant Name must be linked to a Make.");
        const res = await fetch("/api/models", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: modelName, makeId: modelMakeId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setModels([...models, data]);
        setModelName('');
        setModelMakeId('');
      } else if (activeTab === "Periods") {
        const stdVal = Number(periodStandardMonths);
        const prVal = periodProRataMonths ? Number(periodProRataMonths) : 0;
        
        if (!periodStandardMonths || isNaN(stdVal) || stdVal < 0) {
          throw new Error("Input a valid number of standard replacement months.");
        }
        if (isNaN(prVal) || prVal < 0) {
          throw new Error("Input a valid number of pro-rata months (or leave blank as 0).");
        }
        if (stdVal + prVal <= 0) {
          throw new Error("Total combined warranty months must be greater than zero.");
        }

        const res = await fetch("/api/periods", {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            standardMonths: stdVal, 
            proRataMonths: prVal, 
            label: periodLabel 
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPeriods([...periods, data]);
        setPeriodStandardMonths('');
        setPeriodProRataMonths('');
        setPeriodLabel('');
      } else if (activeTab === "Dealers") {
        if (!dealerName.trim() || !dealerPhone.trim() || !dealerAddress.trim()) throw new Error("Please complete all dealer outlet coordinates.");
        const res = await fetch("/api/dealers", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: dealerName, contactNumber: dealerPhone, address: dealerAddress })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDealers([...dealers, data]);
        setDealerName('');
        setDealerPhone('');
        setDealerAddress('');
      } else if (activeTab === "Users") {
        if (!userUsername.trim() || !userEmail.trim() || !userPassword.trim()) throw new Error("Please enter all required user profile settings.");
        const res = await fetch("/api/users", {
          method: "POST",
          headers,
          body: JSON.stringify({ username: userUsername, email: userEmail, password: userPassword, role: userRole })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers([...users, data]);
        setUserUsername('');
        setUserEmail('');
        setUserPassword('');
        setUserRole('General');
      }
      setDrawerOpen(false);
    } catch (err: any) {
      setActionError(err.message || "Failed to add elements.");
    }
  };

  // Status fast-toggle helper
  const handleToggleStatus = async (id: string, currentStatus: 'Active' | 'Inactive', itemype: 'Make' | 'Model' | 'Period' | 'Dealer') => {
    setActionError(null);
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const endpointMap = {
      Make: `/api/makes/${id}`,
      Model: `/api/models/${id}`,
      Period: `/api/periods/${id}`,
      Dealer: `/api/dealers/${id}`
    };

    try {
      const res = await fetch(endpointMap[itemype], {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle active state.");

      // Refresh corresponding state list in client UI
      if (itemype === 'Make') setMakes(makes.map(m => m.id === id ? data : m));
      if (itemype === 'Model') setModels(models.map(m => m.id === id ? data : m));
      if (itemype === 'Period') setPeriods(periods.map(p => p.id === id ? data : p));
      if (itemype === 'Dealer') setDealers(dealers.map(d => d.id === id ? data : d));
    } catch (err: any) {
      setActionError(err.message || "Operation failed.");
    }
  };

  // Full-edit form save trigger
  const handleSaveEdit = async (id: string) => {
    setActionError(null);
    const headers = { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${token}` 
    };

    try {
      let body: any = { status: editStatus };
      let url = "";

      if (activeTab === "Makes") {
        body.name = editName;
        url = `/api/makes/${id}`;
      } else if (activeTab === "Models") {
        body.name = editName;
        body.makeId = editModelMakeId;
        url = `/api/models/${id}`;
      } else if (activeTab === "Periods") {
        body.label = editName;
        const stdVal = Number(editPeriodStandardMonths);
        const prVal = Number(editPeriodProRataMonths || 0);

        if (isNaN(stdVal) || stdVal < 0) {
          throw new Error("Input a valid number of standard replacement months.");
        }
        if (isNaN(prVal) || prVal < 0) {
          throw new Error("Input a valid number of pro-rata months (or 0).");
        }
        if (stdVal + prVal <= 0) {
          throw new Error("Total combined warranty months must be positive.");
        }

        body.standardMonths = stdVal;
        body.proRataMonths = prVal;
        body.months = stdVal + prVal;
        url = `/api/periods/${id}`;
      } else if (activeTab === "Dealers") {
        body.name = editName;
        body.contactNumber = editDealerPhone;
        body.address = editDealerAddress;
        url = `/api/dealers/${id}`;
      } else if (activeTab === "Users") {
        body.username = editName;
        body.email = editUserEmail;
        body.role = editUserRole;
        if (editUserPassword) {
          body.password = editUserPassword;
        }
        url = `/api/users/${id}`;
      }

      const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update operation failed");

      // Dispatch changes to states lists
      if (activeTab === "Makes") setMakes(makes.map(m => m.id === id ? data : m));
      if (activeTab === "Models") setModels(models.map(m => m.id === id ? data : m));
      if (activeTab === "Periods") setPeriods(periods.map(p => p.id === id ? data : p));
      if (activeTab === "Dealers") setDealers(dealers.map(d => d.id === id ? data : d));
      if (activeTab === "Users") setUsers(users.map(u => u.id === id ? data : u));

      setEditingId(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to save edits.");
    }
  };

  // Handle deletions
  const handleDeleteItem = async (id: string, itemType: 'Make' | 'Model' | 'Period' | 'Dealer' | 'User') => {
    setActionError(null);
    const endpointMap = {
      Make: `/api/makes/${id}`,
      Model: `/api/models/${id}`,
      Period: `/api/periods/${id}`,
      Dealer: `/api/dealers/${id}`,
      User: `/api/users/${id}`
    };

    if (!confirm(`Warning: Are you sure you want to permanently delete this master settings ${itemType}?`)) {
      return;
    }

    try {
      const res = await fetch(endpointMap[itemType], {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Successfully purged list, reduce client state
      if (itemType === 'Make') setMakes(makes.filter(m => m.id !== id));
      if (itemType === 'Model') setModels(models.filter(m => m.id !== id));
      if (itemType === 'Period') setPeriods(periods.filter(p => p.id !== id));
      if (itemType === 'Dealer') setDealers(dealers.filter(d => d.id !== id));
      if (itemType === 'User') setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      setActionError(err.message || "System blocked deletion command due to relational links.");
    }
  };

  // Open Edit wrapper variables mapper
  const handleOpenEditInline = (item: any) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setActionError(null);

    if (activeTab === "Makes") {
      setEditName(item.name);
    } else if (activeTab === "Models") {
      setEditName(item.name);
      setEditModelMakeId(item.makeId);
    } else if (activeTab === "Periods") {
      setEditName(item.label);
      setEditPeriodMonths(item.months.toString());
      setEditPeriodStandardMonths((item.standardMonths ?? item.months).toString());
      setEditPeriodProRataMonths((item.proRataMonths ?? 0).toString());
    } else if (activeTab === "Dealers") {
      setEditName(item.name);
      setEditDealerPhone(item.contactNumber);
      setEditDealerAddress(item.address);
    } else if (activeTab === "Users") {
      setEditName(item.username);
      setEditUserEmail(item.email);
      setEditUserRole(item.role);
      setEditUserPassword('');
    }
  };

  const handleExportModelTemplate = () => {
    const wsData = [
      ['Make_ID', 'Model_Name', 'Status'],
      ['make-random-id', 'Sample Tubular 200AH', 'Active'],
      ['make-random-id', 'Sample Inverter 150AH', 'Active']
    ];
    
    // Provide a real Make ID to help user
    if (makes.length > 0) {
       wsData[1][0] = makes[0].id;
       wsData[2][0] = makes[0].id;
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Models_Bulk_Import");
    XLSX.writeFile(wb, "Models_Import_Template.xlsx");
  };

  const handleBulkImportModels = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      
      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        const makeId = row['Make_ID'];
        const name = row['Model_Name'];
        let status = String(row['Status'] || 'Active');
        if (status !== 'Active' && status !== 'Inactive') status = 'Active';

        if (!makeId || !name) {
          errorCount++;
          continue;
        }

        const makeMatch = makes.find(m => m.id === makeId);
        if (!makeMatch) {
          errorCount++;
          continue;
        }

        const res = await fetch("/api/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            makeId,
            makeName: makeMatch.name,
            name,
            status
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      alert(`Import complete:\nSuccessfully added: ${successCount}\nFailed/Skipped: ${errorCount}`);
      fetchTabRecord();

    } catch (err) {
      alert("Failed to read the Excel file.");
      console.error(err);
    }
    
    e.target.value = '';
  };

  // Database Management Handlers
  const handleExportDatabase = async () => {
    try {
      const res = await fetch("/api/database/export", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warranty-db-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert("Failed to export database.");
    }
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: This will completely replace all your current data (registrations, branches, settings) with the contents of this backup. This cannot be undone. Are you sure you want to proceed?")) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const jsonStr = JSON.parse(text); // Verify it's valid JSON
      
      const res = await fetch("/api/database/import", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonStr)
      });
      
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message || "Database restored successfully.");
        fetchTabRecord();
      } else {
        alert("Error: " + resData.error);
      }
    } catch(err) {
      alert("Invalid JSON file or failed to upload.");
    }
    
    e.target.value = '';
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete ALL warranty registrations, battery models, makes, and branches. Your data will be irrecoverable unless you have a backup. Proceed?")) return;
    
    if (!window.confirm("Are you absolutely sure you want to WIPE the entire database?")) return;

    try {
      const res = await fetch("/api/database/clear", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message || "Database wiped.");
        fetchTabRecord();
      } else {
        alert("Error: " + (resData.error || "Failed to clear"));
      }
    } catch(e) {
      alert("Network error.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mb-3" />
        <span className="text-sm font-semibold">Syncing relational parameter ledgers...</span>
      </div>
    );
  }

  // Filter lists based on tabSearch keyword
  const qStr = tabSearch.toLowerCase().trim();
  const filteredMakes = makes.filter(m => m.name.toLowerCase().includes(qStr));
  const filteredModels = models.filter(m => m.name.toLowerCase().includes(qStr) || m.makeName.toLowerCase().includes(qStr));
  const filteredPeriods = periods.filter(p => p.label.toLowerCase().includes(qStr) || p.months.toString().includes(qStr));
  const filteredDealers = dealers.filter(d => d.name.toLowerCase().includes(qStr) || d.contactNumber.includes(qStr));
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(qStr) || u.email.toLowerCase().includes(qStr) || (u.role || '').toLowerCase().includes(qStr));

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-display">Relational Master Settings</h1>
          <p className="text-xs text-slate-500">Add, edit, toggle active statuses, or delete key values across the warranty framework.</p>
        </div>
        {activeTab !== 'Company' && (
          <button
            onClick={() => {
              setDrawerOpen(true);
              setActionError(null);
            }}
            className="bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Predefined {activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl p-3.5 font-semibold flex items-start gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs list panel items */}
      <div className="flex border-b border-slate-200 select-none overflow-x-auto scrollbar-thin">
        
        <button
          onClick={() => { setActiveTab('Makes'); setTabSearch(''); setIsDbUnlocked(false); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Makes' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Library className="w-4 h-4" /> Manufacturers Makes
        </button>

        <button
          onClick={() => { setActiveTab('Models'); setTabSearch(''); setIsDbUnlocked(false); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Models' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListStart className="w-4 h-4" /> Models Variants
        </button>

        <button
          onClick={() => { setActiveTab('Periods'); setTabSearch(''); setIsDbUnlocked(false); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Periods' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarClock className="w-4 h-4" /> Warranty Periods
        </button>

        <button
          onClick={() => { setActiveTab('Dealers'); setTabSearch(''); setIsDbUnlocked(false); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Dealers' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" /> Branches
        </button>

        <button
          onClick={() => { setActiveTab('Company'); setTabSearch(''); setIsDbUnlocked(false); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Company' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Company Details
        </button>

        <button
          onClick={() => { setActiveTab('Users'); setTabSearch(''); setIsDbUnlocked(false); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Users' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> User Creation & Roles
        </button>

        <button
          onClick={() => { setActiveTab('Database'); setTabSearch(''); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-3 px-5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Database' ? 'border-sky-600 text-sky-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> Database Mgmt
        </button>

      </div>

      {/* Tabs Filter Bar & Search */}
      {(activeTab !== 'Company' && activeTab !== 'Database') && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative max-w-sm w-full sm:w-auto">
            <input
              type="text"
              placeholder={`Search inside ${activeTab}...`}
              value={tabSearch}
              onChange={(e) => setTabSearch(e.target.value)}
              className="w-full sm:w-80 text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/10"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          </div>

          {activeTab === 'Models' && (
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              <button
                onClick={handleExportModelTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wide rounded-lg transition-colors cursor-pointer"
              >
                <DownloadCloud className="w-3 h-3" /> Template
              </button>
              
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold text-[11px] uppercase tracking-wide rounded-lg transition-colors cursor-pointer relative">
                <FileSpreadsheet className="w-3 h-3" /> Bulk Import Excel
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleBulkImportModels}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Data visual block matrices */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden text-xs">
        
        {/* Makes visual list */}
        {activeTab === "Makes" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Manufacturer Make ID</th>
                <th className="py-3 px-5">Make Name</th>
                <th className="py-3 px-5">State status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMakes.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-5 font-mono font-medium text-slate-400">{m.id}</td>
                  <td className="py-3 px-5 font-bold uppercase tracking-wide text-slate-900">
                    {editingId === m.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value.toUpperCase())}
                        className="border px-2 py-1 rounded w-full font-bold uppercase max-w-xs focus:ring-2"
                      />
                    ) : m.name}
                  </td>
                  <td className="py-3 px-5">
                    {editingId === m.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="border px-2.5 py-1 bg-white rounded text-xs"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(m.id, m.status, 'Make')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer border ${
                          m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {m.status}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                    {editingId === m.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(m.id)} className="p-1 text-emerald-600 hover:bg-slate-100 rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:bg-slate-100 rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleOpenEditInline(m)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-sky-600 rounded cursor-pointer inline-flex">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem(m.id, 'Make')} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded cursor-pointer inline-flex">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Models list visual */}
        {activeTab === "Models" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500">
                <th className="py-3 px-5">Model Mappings ID</th>
                <th className="py-3 px-5">Manufacturer Make Link</th>
                <th className="py-3 px-5">Model Range Name</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModels.map((md) => (
                <tr key={md.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-mono text-slate-400">{md.id}</td>
                  <td className="py-3 px-5 font-bold uppercase text-slate-600">
                    {editingId === md.id ? (
                      <select
                        value={editModelMakeId}
                        onChange={(e) => setEditModelMakeId(e.target.value)}
                        className="border px-2 py-1 bg-white rounded text-xs font-bold focus:ring-2"
                      >
                        {makes.map(mk => (
                          <option key={mk.id} value={mk.id}>{mk.name}</option>
                        ))}
                      </select>
                    ) : md.makeName}
                  </td>
                  <td className="py-3 px-5 text-slate-800 font-semibold">
                    {editingId === md.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border px-2 py-0.5 rounded font-semibold text-xs focus:ring-2 w-full max-w-md"
                      />
                    ) : md.name}
                  </td>
                  <td className="py-3 px-5">
                    {editingId === md.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="border px-2 py-0.5 bg-white rounded text-xs whitespace-nowrap"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(md.id, md.status, 'Model')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border cursor-pointer ${
                          md.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {md.status}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                    {editingId === md.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(md.id)} className="p-1 text-emerald-600 hover:bg-slate-100 rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:bg-slate-100 rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleOpenEditInline(md)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-sky-600 rounded cursor-pointer inline-flex">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem(md.id, 'Model')} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded cursor-pointer inline-flex">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Periods list */}
        {activeTab === "Periods" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500">
                <th className="py-3 px-5">Warranty ID</th>
                <th className="py-3 px-5">Standard Months</th>
                <th className="py-3 px-5">Pro-Rata Months</th>
                <th className="py-3 px-5">Total Months</th>
                <th className="py-3 px-5">Form Label</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeriods.map((wp) => (
                <tr key={wp.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-mono text-slate-400">{wp.id}</td>
                  
                  {/* Standard Months */}
                  <td className="py-3 px-5 font-mono font-bold text-slate-800">
                    {editingId === wp.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editPeriodStandardMonths}
                        onChange={(e) => {
                          const stdVal = e.target.value;
                          setEditPeriodStandardMonths(stdVal);
                          setEditName(`${stdVal || 0}M Standard + ${editPeriodProRataMonths || 0}M Pro-Rata`);
                        }}
                        className="border px-2 py-0.5 rounded font-mono font-bold text-xs focus:ring-2 w-16"
                      />
                    ) : (wp.standardMonths ?? wp.months)}
                  </td>

                  {/* Pro-Rata Months */}
                  <td className="py-3 px-5 font-mono font-bold text-slate-800">
                    {editingId === wp.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editPeriodProRataMonths}
                        onChange={(e) => {
                          const prVal = e.target.value;
                          setEditPeriodProRataMonths(prVal);
                          setEditName(`${editPeriodStandardMonths || 0}M Standard + ${prVal || 0}M Pro-Rata`);
                        }}
                        className="border px-2 py-0.5 rounded font-mono font-bold text-xs focus:ring-2 w-16"
                      />
                    ) : (wp.proRataMonths ?? 0)}
                  </td>

                  {/* Total Months */}
                  <td className="py-3 px-5 font-mono font-medium text-slate-500">
                    {editingId === wp.id ? (
                      <span className="font-bold text-slate-600">
                        {Number(editPeriodStandardMonths || 0) + Number(editPeriodProRataMonths || 0)}M
                      </span>
                    ) : wp.months}
                  </td>

                  <td className="py-3 px-5 font-semibold text-slate-800">
                    {editingId === wp.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border px-2 py-0.5 rounded text-xs focus:ring-2 max-w-xs w-full"
                      />
                    ) : wp.label}
                  </td>
                  <td className="py-3 px-5">
                    {editingId === wp.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="border px-2 py-0.5 bg-white rounded text-xs whitespace-nowrap"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(wp.id, wp.status, 'Period')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border cursor-pointer ${
                          wp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {wp.status}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                    {editingId === wp.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(wp.id)} className="p-1 text-emerald-600 hover:bg-slate-100 rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:bg-slate-100 rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleOpenEditInline(wp)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-sky-600 rounded cursor-pointer inline-flex">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem(wp.id, 'Period')} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded cursor-pointer inline-flex">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Dealers list visual element */}
        {activeTab === "Dealers" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500">
                <th className="py-3 px-5">Branch ID</th>
                <th className="py-3 px-5">Branch Name</th>
                <th className="py-3 px-5">Contact Phone</th>
                <th className="py-3 px-5">Branch Address</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDealers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-mono text-slate-400">{d.id}</td>
                  <td className="py-3 px-5 font-bold text-slate-900">
                    {editingId === d.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border px-2 py-0.5 rounded font-bold text-xs focus:ring-2 w-full max-w-xs"
                      />
                    ) : d.name}
                  </td>
                  <td className="py-3 px-5 font-mono text-slate-600">
                    {editingId === d.id ? (
                      <input
                        type="text"
                        value={editDealerPhone}
                        onChange={(e) => setEditDealerPhone(e.target.value)}
                        className="border px-2 py-0.5 rounded font-mono text-xs focus:ring-2 w-28"
                      />
                    ) : d.contactNumber}
                  </td>
                  <td className="py-3 px-5 text-slate-500 max-w-xs truncate">
                    {editingId === d.id ? (
                      <input
                        type="text"
                        value={editDealerAddress}
                        onChange={(e) => setEditDealerAddress(e.target.value)}
                        className="border px-2 py-0.5 rounded text-xs focus:ring-2 w-full"
                      />
                    ) : d.address}
                  </td>
                  <td className="py-3 px-5">
                    {editingId === d.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="border px-2 py-0.5 bg-white rounded text-xs"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(d.id, d.status, 'Dealer')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border cursor-pointer ${
                          d.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {d.status}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                    {editingId === d.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(d.id)} className="p-1 text-emerald-600 hover:bg-slate-100 rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:bg-slate-100 rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleOpenEditInline(d)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-sky-600 rounded cursor-pointer inline-flex">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem(d.id, 'Dealer')} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded cursor-pointer inline-flex">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Company Settings Dynamic Admin Form Section */}
        {activeTab === "Company" && (
          <div className="p-6 md:p-8 max-w-3xl">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-2">Corporate Identity & Dynamic Application Branding</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Updating these settings will change the branding, titles, footer text, contact details, and labels across both the public-facing warranty lookup tool and the admin console instantly.
              </p>
            </div>
            
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold uppercase mb-1">Company Corporate Name *</label>
                  <input
                    required
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. PowerMax Industries Ltd."
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Displayed in footer copyright and official claims documents.</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase mb-1">Company Short Brand Name *</label>
                  <input
                    required
                    type="text"
                    value={compShortName}
                    onChange={(e) => setCompShortName(e.target.value)}
                    placeholder="e.g. PowerMax"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Displayed as main application title brand in headers.</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase mb-1">Application Title / Subtitle *</label>
                <input
                  required
                  type="text"
                  value={compAppTitle}
                  onChange={(e) => setCompAppTitle(e.target.value)}
                  placeholder="e.g. Warranty Portal"
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">The tagline or dashboard console subtitle description.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold uppercase mb-1">Support Contact Number</label>
                  <input
                    type="text"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase mb-1">Support Email Address</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    placeholder="e.g. support@powermax.com"
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase mb-1">Company App Logo</label>
                <div className="flex items-center gap-4">
                  {compLogoDataUrl ? (
                    <div className="relative">
                      <img src={compLogoDataUrl} alt="Company Logo" className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200" />
                      <button 
                        type="button" 
                        onClick={() => setCompLogoDataUrl('')}
                        className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full p-1 hover:bg-rose-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                  )}
                  <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-colors shadow-sm">
                    Upload Logo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload} 
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                    Recommended: Square format (1:1), transparent PNG or clear JPG. This replaces the default battery icon in the top header.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase mb-1">Corporate Postal / HQ Address</label>
                <textarea
                  rows={2}
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  placeholder="e.g. Shop 12, Metro Plaza, New Delhi, India"
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-6 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                >
                  {savingCompany ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Details...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Corporate Identity Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Management tab rendering */}
        {activeTab === "Users" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">ID / Creation Date</th>
                <th className="py-3 px-5">Username</th>
                <th className="py-3 px-5">Email Address</th>
                <th className="py-3 px-5">Access Level Role</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-5 text-[11px]">
                    <span className="font-mono text-slate-400 block">{u.id}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Initial Seed'}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-bold text-slate-900">
                    {editingId === u.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border px-2 py-0.5 rounded font-bold text-xs focus:ring-2 w-full max-w-xs"
                      />
                    ) : u.username}
                  </td>
                  <td className="py-3 px-5 font-medium text-slate-700">
                    {editingId === u.id ? (
                      <input
                        type="email"
                        value={editUserEmail}
                        onChange={(e) => setEditUserEmail(e.target.value)}
                        className="border px-2 py-0.5 rounded text-xs focus:ring-2 w-full max-w-xs"
                      />
                    ) : u.email}
                  </td>
                  <td className="py-3 px-5">
                    {editingId === u.id ? (
                      <div className="space-y-1.5">
                        <select
                          value={editUserRole}
                          onChange={(e) => setEditUserRole(e.target.value as any)}
                          className="border px-2 py-0.5 bg-white rounded text-xs block w-full max-w-[140px]"
                        >
                          <option value="Admin">Admin (Super)</option>
                          <option value="General">General (Staff)</option>
                        </select>
                        <input
                          type="password"
                          value={editUserPassword}
                          onChange={(e) => setEditUserPassword(e.target.value)}
                          placeholder="Change password (optional)"
                          className="border px-2 py-0.5 rounded text-[10px] w-full max-w-[140px] block"
                        />
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        u.role === 'Admin' 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {u.role === 'Admin' ? 'Super Admin' : 'General User'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                    {editingId === u.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(u.id)} className="p-1 text-emerald-600 hover:bg-slate-100 rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-rose-500 hover:bg-slate-100 rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleOpenEditInline(u)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-sky-600 rounded cursor-pointer inline-flex">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(u.id, 'User')} 
                          disabled={u.username.toLowerCase() === 'admin'}
                          className={`p-1.5 bg-slate-50 hover:bg-slate-100 rounded inline-flex ${
                            u.username.toLowerCase() === 'admin'
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-500 hover:text-rose-600 cursor-pointer'
                          }`}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center font-medium text-slate-400">
                    No user accounts found matching this keyword search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Database Management */}
        {activeTab === "Database" && (
          !isDbUnlocked ? (
            <div className="p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
               <ShieldAlert className="w-12 h-12 text-slate-300" />
               <h3 className="font-bold text-slate-800">Database Access Restricted</h3>
               <p className="text-xs text-slate-500 max-w-sm">Please enter the security password to manage database operations.</p>
               <input 
                 type="password" 
                 value={dbPassword}
                 onChange={(e) => setDbPassword(e.target.value)}
                 className="border border-slate-300 rounded-xl px-4 py-2 w-full max-w-xs focus:ring-2 focus:ring-sky-500/20 outline-none"
                 placeholder="Enter password..."
               />
               <button 
                 onClick={() => {
                   if (dbPassword === 'securebase') {
                     setIsDbUnlocked(true);
                     setDbPassword('');
                   } else {
                     alert('Incorrect Password');
                     setDbPassword('');
                   }
                 }}
                 className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all"
               >
                 Unlock Access
               </button>
            </div>
          ) : (
            <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-600" /> Database Management
                </h3>
                <p className="text-slate-500 text-xs mt-1">Export your data, import a backup, or reset the system to its initial state.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {/* Export Panel */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <DownloadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Backup Database</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Download a complete snapshot of all settings, company details, branches, and warranty registrations as a local JSON file.</p>
                  </div>
                  <button
                    onClick={handleExportDatabase}
                    className="mt-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all w-full justify-center"
                  >
                    Download .JSON Backup
                  </button>
                </div>

                {/* Import Panel */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 border-dashed shadow-sm flex flex-col items-start gap-3 relative overflow-hidden group">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="w-full">
                    <h4 className="font-bold text-sm text-slate-800">Restore Database</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Upload a previously exported database JSON file. Warning: This will completely overwrite your current data.</p>
                    
                    <input 
                      type="file" 
                      accept=".json"
                      id="db-upload"
                      className="hidden"
                      onChange={handleImportDatabase}
                    />
                    <label 
                      htmlFor="db-upload"
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all w-full justify-center cursor-pointer relative z-10"
                    >
                      Select & Restore File
                    </label>
                  </div>
                </div>

                {/* Clear Data Panel */}
                <div className="p-5 border border-rose-100 rounded-2xl bg-rose-50/50 flex flex-col items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-800">Clear Sample Database</h4>
                    <p className="text-[10px] text-rose-600/80 mt-1 leading-relaxed">Wipe all warranty registrations, makes, models, periods, and branches. Only your admin accounts and company details will be kept.</p>
                  </div>
                  <button
                    onClick={handleClearDatabase}
                    className="mt-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all w-full shadow-sm shadow-rose-200"
                  >
                    <Trash className="w-3.5 h-3.5" /> Wipe Database
                  </button>
                </div>
              </div>
            </div>
          )
        )}

      </div>

      {/* -------------------------------------------------------------------
          MODAL DRAWER: ADD DIALOG DRAWER FOR PREDEFINED VALUES
      ------------------------------------------------------------------- */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-up">
            
            <div className="px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold font-display text-sm">Add New {activeTab.slice(0, -1)} Value</h3>
              <p className="text-[10px] text-slate-400">Values are validated before linked relational insertions</p>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              
              {/* Manufacturer field */}
              {activeTab === "Makes" && (
                <div>
                  <label className="block text-slate-500 font-bold uppercase mb-1">Manufacturer Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. EXIDE, AMARON, SF SONIC"
                    value={makeName}
                    onChange={(e) => setMakeName(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 uppercase font-bold tracking-wide placeholder:font-normal placeholder:normal-case"
                  />
                </div>
              )}

              {/* Models form field */}
              {activeTab === "Models" && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Link to Make Manufacturer *</label>
                    <select
                      required
                      value={modelMakeId}
                      onChange={(e) => setModelMakeId(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="">-- Choose Manufacturer --</option>
                      {makes.map(mk => (
                        <option key={mk.id} value={mk.id}>{mk.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Model Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Exide Tubular 150AH"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </>
              )}

              {/* Periods field */}
              {activeTab === "Periods" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Standard Replacement (Months) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="e.g. 12"
                        value={periodStandardMonths}
                        onChange={(e) => {
                          const stdVal = e.target.value;
                          setPeriodStandardMonths(stdVal);
                          setPeriodLabel(`${stdVal || 0}M Standard + ${periodProRataMonths || 0}M Pro-Rata`);
                        }}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Pro-Rata Discount (Months) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="e.g. 12"
                        value={periodProRataMonths}
                        onChange={(e) => {
                          const prVal = e.target.value;
                          setPeriodProRataMonths(prVal);
                          setPeriodLabel(`${periodStandardMonths || 0}M Standard + ${prVal || 0}M Pro-Rata`);
                        }}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Dropdown Description Label *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 12 Months Standard + 12 Months Pro-Rata"
                      value={periodLabel}
                      onChange={(e) => setPeriodLabel(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>
                </>
              )}

              {/* Dealers field */}
              {activeTab === "Dealers" && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Outlet Store Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Spark Auto Electricals"
                      value={dealerName}
                      onChange={(e) => setDealerName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Sales Phone / Mobile *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. +91 91234 56789"
                      value={dealerPhone}
                      onChange={(e) => setDealerPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Location Address *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Metric Square, Tower A, Delhi"
                      value={dealerAddress}
                      onChange={(e) => setDealerAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>
                </>
              )}

              {/* Users creation form inputs */}
              {activeTab === "Users" && (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Username / Login ID *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. janesmith"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Email Address *</label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. jane@company.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Default Password *</label>
                    <input
                      required
                      type="password"
                      placeholder="Input safe initial password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase mb-1">Role / Access Level *</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2"
                    >
                      <option value="General">General User (Staff View only)</option>
                      <option value="Admin">Super Administrator (Full Master Access)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer shadow-sm"
                >
                  Create predefined value
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default memo(MasterSettings);
