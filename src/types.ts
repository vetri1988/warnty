/**
 * Battery Warranty Management System Types & Models
 */

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'General';
  createdAt: string;
}

export interface BatteryMake {
  id: string;
  name: string; // e.g. EXIDE, AMARON, SF SONIC, Luminous
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface BatteryModel {
  id: string;
  makeId: string; // Relational link
  makeName: string; // Compiled for ease
  name: string; // e.g., EXIDE 150AH, EXIDE 200AH
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface WarrantyPeriod {
  id: string;
  months: number; // e.g. 24 (total combined months)
  standardMonths: number; // e.g. 12
  proRataMonths: number; // e.g. 12
  label: string; // e.g. "12M Standard + 12M Pro-Rata"
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Dealer {
  id: string;
  name: string;
  contactNumber: string;
  address: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface BatteryRegistration {
  id: string; // Registration ID (e.g. REG-XXXXX)
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  serialNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  warrantyMonths: number;
  standardMonths: number;
  proRataMonths: number;
  warrantyPeriodLabel: string;
  expiryDate: string; // YYYY-MM-DD (calculated: purchaseDate + warrantyMonths)
  standardExpiryDate: string; // YYYY-MM-DD (calculated: purchaseDate + standardMonths)
  customerName: string;
  customerContact: string;
  customerAddress: string;
  dealerId: string;
  dealerName: string;
  invoiceNumber?: string;
  status: 'Active' | 'Expired';
  createdAt: string;
  lastSmsSentAt?: string;
  lastSmsType?: string;
}

export interface DashboardStats {
  totalRegistered: number;
  activeWarranties: number;
  expiredWarranties: number;
  recentRegistrations: BatteryRegistration[];
  makesBreakdown: { name: string; count: number }[];
  dealersBreakdown: { name: string; count: number }[];
}

export interface AuthState {
  token: string | null;
  admin: AdminUser | null;
}

export interface CompanyDetails {
  name: string;          // e.g., "PowerMax Industries Ltd."
  shortName: string;     // e.g., "PowerMax"
  appTitleLabel: string; // e.g., "Warranty Portal"
  contactPhone: string;  // e.g., "+91 98765 43210"
  contactEmail: string;  // e.g., "support@powermax.com"
  address: string;       // e.g., "Shop 12, Metro Plaza, New Delhi"
  logoDataUrl?: string;  // Data URL of the company logo image
}

