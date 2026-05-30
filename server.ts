import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { 
  AdminUser, 
  BatteryMake, 
  BatteryModel, 
  WarrantyPeriod, 
  Dealer, 
  BatteryRegistration, 
  DashboardStats,
  CompanyDetails
} from "./src/types";

// Setup secret and file paths
const JWT_SECRET = process.env.JWT_SECRET || "battery-warranty-super-secret-key-12345!";
const DB_FILE = path.join(process.cwd(), "database.json");

// Define schema representation in local database
interface LocalDB {
  admins: any[];
  makes: BatteryMake[];
  models: BatteryModel[];
  periods: WarrantyPeriod[];
  dealers: Dealer[];
  registrations: BatteryRegistration[];
  company: CompanyDetails;
}

// Initial relational dataset seed (matches MySQL db-schema structure)
const INITIAL_DATABASE_STATE: LocalDB = {
  admins: [
    {
      id: "adm-01",
      username: "admin",
      email: "admin@batterywarranty.com",
      // Hashed password for 'admin123' using bcryptjs
      password: bcrypt.hashSync("admin123", 10),
      role: "Admin",
      createdAt: new Date().toISOString()
    }
  ],
  makes: [
    { id: "mk-exide", name: "EXIDE", status: "Active", createdAt: new Date().toISOString() },
    { id: "mk-amaron", name: "AMARON", status: "Active", createdAt: new Date().toISOString() },
    { id: "mk-sfsonic", name: "SF SONIC", status: "Active", createdAt: new Date().toISOString() },
    { id: "mk-luminous", name: "LUMINOUS", status: "Active", createdAt: new Date().toISOString() }
  ],
  models: [
    { id: "md-ex1", makeId: "mk-exide", makeName: "EXIDE", name: "EXIDE Mile-Plus 150AH", status: "Active", createdAt: new Date().toISOString() },
    { id: "md-ex2", makeId: "mk-exide", makeName: "EXIDE", name: "EXIDE Tubular 200AH", status: "Active", createdAt: new Date().toISOString() },
    { id: "md-ex3", makeId: "mk-exide", makeName: "EXIDE", name: "EXIDE Matrix 80AH", status: "Active", createdAt: new Date().toISOString() },
    { id: "md-am1", makeId: "mk-amaron", makeName: "AMARON", name: "AMARON Pro 150AH", status: "Active", createdAt: new Date().toISOString() },
    { id: "md-am2", makeId: "mk-amaron", makeName: "AMARON", name: "AMARON Hi-Way 100AH", status: "Active", createdAt: new Date().toISOString() },
    { id: "md-sf1", makeId: "mk-sfsonic", makeName: "SF SONIC", name: "SF Sonic Volt 120AH", status: "Active", createdAt: new Date().toISOString() },
    { id: "md-lm1", makeId: "mk-luminous", makeName: "LUMINOUS", name: "Luminous RedCharge 150AH", status: "Active", createdAt: new Date().toISOString() }
  ],
  periods: [
    { id: "wp-12m", months: 12, standardMonths: 12, proRataMonths: 0, label: "12 Months Standard", status: "Active", createdAt: new Date().toISOString() },
    { id: "wp-12m12m", months: 24, standardMonths: 12, proRataMonths: 12, label: "12 Months Standard + 12 Months Pro-Rata", status: "Active", createdAt: new Date().toISOString() },
    { id: "wp-18m18m", months: 36, standardMonths: 18, proRataMonths: 18, label: "18 Months Standard + 18 Months Pro-Rata", status: "Active", createdAt: new Date().toISOString() },
    { id: "wp-24m", months: 24, standardMonths: 24, proRataMonths: 0, label: "24 months Standard", status: "Active", createdAt: new Date().toISOString() },
    { id: "wp-24m24m", months: 48, standardMonths: 24, proRataMonths: 24, label: "24 Months Standard + 24 Months Pro-Rata", status: "Active", createdAt: new Date().toISOString() },
    { id: "wp-36m36m", months: 72, standardMonths: 36, proRataMonths: 36, label: "36 Months Standard + 36 Months Pro-Rata", status: "Active", createdAt: new Date().toISOString() }
  ],
  dealers: [
    { id: "dl-01", name: "Spark Auto Electricals", contactNumber: "+91 98765 43210", address: "Shop 12, Metro Plaza, New Delhi", status: "Active", createdAt: new Date().toISOString() },
    { id: "dl-02", name: "Power Source Battery House", contactNumber: "+91 87654 32109", address: "Sector 4, Hiranandani Complex, Mumbai", status: "Active", createdAt: new Date().toISOString() },
    { id: "dl-03", name: "Energy Trade Dealers", contactNumber: "+91 76543 21098", address: "G-14, Green Avenue, Bangalore", status: "Active", createdAt: new Date().toISOString() },
    { id: "dl-04", name: "Alpha Battery Hub", contactNumber: "+91 65432 10987", address: "Court Road, Civil Lines, Kolkata", status: "Active", createdAt: new Date().toISOString() }
  ],
  registrations: [],
  company: {
    name: "PowerMax Industries Ltd.",
    shortName: "PowerMax",
    appTitleLabel: "Warranty Portal",
    contactPhone: "+91 98765 43210",
    contactEmail: "support@powermax.com",
    address: "Shop 12, Metro Plaza, New Delhi, India",
    logoDataUrl: ""
  }
};

// Seed dynamic initial registrations so the app loads with pristine mock warranty cards
const generateMockRegistrations = (): BatteryRegistration[] => {
  const list: BatteryRegistration[] = [];
  const names = [
    { name: "Rahul Sharma", contact: "+91 91234 56789", address: "A-54, Block G, Hauz Khas, New Delhi" },
    { name: "Siddharth Nair", contact: "+91 85642 93102", address: "Flat 402, Royal Palms, Bandra, Mumbai" },
    { name: "Ananya Iyer", contact: "+91 73491 80214", address: "12, 4th Cross Road, Indiranagar, Bangalore" },
    { name: "Vikram Sen", contact: "+91 61408 55431", address: "Block C-2, Salt Lake, Kolkata" }
  ];
  
  const makesAndModels = [
    { makeId: "mk-exide", makeName: "EXIDE", modelId: "md-ex1", modelName: "EXIDE Mile-Plus 150AH", serial: "EXD-9031-H76" },
    { makeId: "mk-exide", makeName: "EXIDE", modelId: "md-ex2", modelName: "EXIDE Tubular 200AH", serial: "EXD-4821-K32" },
    { makeId: "mk-amaron", makeName: "AMARON", modelId: "md-am1", modelName: "AMARON Pro 150AH", serial: "AMR-5542-X12" },
    { makeId: "mk-luminous", makeName: "LUMINOUS", modelId: "md-lm1", modelName: "Luminous RedCharge 150AH", serial: "LUM-1982-A05" }
  ];

  const dealers = [
    { id: "dl-01", name: "Spark Auto Electricals" },
    { id: "dl-02", name: "Power Source Battery House" },
    { id: "dl-03", name: "Energy Trade Dealers" },
    { id: "dl-04", name: "Alpha Battery Hub" }
  ];

  const purchaseDates = [
    "2025-08-15", // active (expires 2028 depending on months)
    "2026-01-10", // active
    "2023-04-12", // expired (under 36M, etc)
    "2025-11-20"  // active
  ];

  for (let i = 0; i < 4; i++) {
    const pD = purchaseDates[i];
    const item = makesAndModels[i];
    const customer = names[i];
    const dealer = dealers[i];
    const months = i === 2 ? 12 : 36; // Expired one gets 12 months, others 36
    
    // Let's divide standard and pro-rata evenly for the seed mock data
    const stdMonths = Math.ceil(months / 2);
    const prMonths = Math.floor(months / 2);

    // expiry calculation
    const purchase = new Date(pD);
    const expiry = new Date(purchase.getTime());
    expiry.setMonth(expiry.getMonth() + months);
    const expiryStr = expiry.toISOString().split('T')[0];

    const stdPurchase = new Date(pD);
    stdPurchase.setMonth(stdPurchase.getMonth() + stdMonths);
    const standardExpiryStr = stdPurchase.toISOString().split('T')[0];
    
    // Status relative to current time 2026-05-28
    const isExpired = new Date(expiryStr) < new Date("2026-05-28");

    list.push({
      id: `REG-58291${i}`,
      makeId: item.makeId,
      makeName: item.makeName,
      modelId: item.modelId,
      modelName: item.modelName,
      serialNumber: item.serial,
      purchaseDate: pD,
      warrantyMonths: months,
      standardMonths: stdMonths,
      proRataMonths: prMonths,
      warrantyPeriodLabel: `${stdMonths}M Standard + ${prMonths}M Pro-Rata`,
      expiryDate: expiryStr,
      standardExpiryDate: standardExpiryStr,
      customerName: customer.name,
      customerContact: customer.contact,
      customerAddress: customer.address,
      dealerId: dealer.id,
      dealerName: dealer.name,
      invoiceNumber: `INV-${2025000 + i}`,
      status: isExpired ? "Expired" : "Active",
      createdAt: new Date(pD).toISOString()
    });
  }
  return list;
};

// Syncing state and loading DB safely
let database: LocalDB = { ...INITIAL_DATABASE_STATE };
database.registrations = generateMockRegistrations();

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      database = JSON.parse(data);
      if (!database.company) {
        database.company = { ...INITIAL_DATABASE_STATE.company };
        saveDB();
      }
      
      let changed = false;

      // Ensure periods are updated with dual warranty fields
      if (!database.periods || database.periods.length === 0) {
        database.periods = [...INITIAL_DATABASE_STATE.periods];
        changed = true;
      } else {
        database.periods.forEach(p => {
          if (p.standardMonths === undefined) {
            p.standardMonths = p.months;
            p.proRataMonths = 0;
            changed = true;
          }
        });
      }

      // Ensure registrations are upgraded
      if (database.registrations) {
        database.registrations.forEach(r => {
          if (r.standardMonths === undefined) {
            r.standardMonths = r.warrantyMonths || 12;
            r.proRataMonths = 0;
            changed = true;
          }
          if (!r.standardExpiryDate) {
            r.standardExpiryDate = r.expiryDate;
            changed = true;
          }
        });
      }
      
      // Upgrade existing database schemas for user accounts roles
      if (!database.admins) {
        database.admins = [...INITIAL_DATABASE_STATE.admins];
        changed = true;
      }
      database.admins.forEach(u => {
        if (!u.role) {
          u.role = u.username.toLowerCase() === "admin" ? "Admin" : "General";
          changed = true;
        }
      });

      if (changed) {
        saveDB();
      }
    } else {
      saveDB();
    }
  } catch (error) {
    console.error("Error loading database files, using local state", error);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving records to database file:", error);
  }
}

// Load database immediately on launch
loadDB();

// Setup app
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // -----------------------------------------------------
  // HELPERS: Express JWT verification Middleware
  // -----------------------------------------------------
  const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access Denied. Authenticated credentials needed." });
      return;
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = database.admins.find(u => u.id === decoded.id);
      if (!user) {
        res.status(401).json({ error: "Authenticated user account not found." });
        return;
      }
      (req as any).admin = user;
      next();
    } catch (e) {
      res.status(403).json({ error: "Invalid, expired, or corrupted token." });
    }
  };

  const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).admin;
    if (!user || user.role !== "Admin") {
      res.status(403).json({ error: "Access Denied. Only Super Administrators can perform this action." });
      return;
    }
    next();
  };

  // Helper trigger to auto recalculate active / expired state on read
  const refreshRegistrationStatuses = () => {
    const currentDate = new Date("2026-05-28"); // server persistent mock date
    let updated = false;
    database.registrations.forEach(r => {
      const expiry = new Date(r.expiryDate);
      const calculatedStatus = expiry < currentDate ? "Expired" : "Active";
      if (r.status !== calculatedStatus) {
        r.status = calculatedStatus;
        updated = true;
      }
    });
    if (updated) saveDB();
  };

  // -----------------------------------------------------
  // 1. AUTH LOGINS
  // -----------------------------------------------------
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
       res.status(400).json({ error: "Username and password are required fields." });
       return;
    }

    const admin = database.admins.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );

    if (!admin) {
       res.status(401).json({ error: "Admin account not found." });
       return;
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
       res.status(401).json({ error: "Incorrect password selection." });
       return;
    }

    // Sign complete jwt token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

     res.json({
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role, createdAt: admin.createdAt }
    });
  });

  app.get("/api/auth/me", authenticateAdmin, (req: Request, res: Response) => {
    const admin = (req as any).admin;
    if (!admin) {
       res.status(404).json({ error: "Logon user not found" });
       return;
    }
     res.json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt
    });
  });

  // Developer / test endpoint. Allows password reset back to admin123
  app.post("/api/auth/reset-password", (req: Request, res: Response) => {
    const admin = database.admins[0];
    if (admin) {
      admin.password = bcrypt.hashSync("admin123", 10);
      saveDB();
       res.json({ message: "Successfully reset admin credentials to admin/admin123!" });
       return;
    }
     res.status(404).json({ error: "Administrator seed missing." });
  });

  // -----------------------------------------------------
  // 2. DASHBOARD OVERVIEW STATS
  // -----------------------------------------------------
  app.get("/api/dashboard/stats", authenticateAdmin, (req: Request, res: Response) => {
    refreshRegistrationStatuses();

    const totalRegistered = database.registrations.length;
    const activeWarranties = database.registrations.filter(r => r.status === "Active").length;
    const expiredWarranties = database.registrations.filter(r => r.status === "Expired").length;
    
    // Sort recent registrations
    const recentRegistrations = [...database.registrations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Grouping analytics for elegant SVG diagrams
    const makeCounts: Record<string, number> = {};
    database.registrations.forEach(r => {
      makeCounts[r.makeName] = (makeCounts[r.makeName] || 0) + 1;
    });
    const makesBreakdown = Object.entries(makeCounts).map(([name, count]) => ({ name, count }));

    const dealerCounts: Record<string, number> = {};
    database.registrations.forEach(r => {
      dealerCounts[r.dealerName] = (dealerCounts[r.dealerName] || 0) + 1;
    });
    const dealersBreakdown = Object.entries(dealerCounts).map(([name, count]) => ({ name, count }));

     res.json({
      totalRegistered,
      activeWarranties,
      expiredWarranties,
      recentRegistrations,
      makesBreakdown,
      dealersBreakdown
    });
  });

  // -----------------------------------------------------
  // 3. MASTER SETTINGS: MAKES
  // -----------------------------------------------------
  app.get("/api/makes", (req: Request, res: Response) => {
    const { status, search } = req.query;
    let list = [...database.makes];
    
    if (status) {
      list = list.filter(m => m.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q));
    }
    
     res.json(list);
  });

  app.post("/api/makes", authenticateAdmin, (req: Request, res: Response) => {
    const { name, status } = req.body;
    if (!name || !name.trim()) {
       res.status(400).json({ error: "Battery Make name is required." });
       return;
    }

    const checkDup = database.makes.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
    if (checkDup) {
       res.status(400).json({ error: "A battery make with this name already exists." });
       return;
    }

    const newMake: BatteryMake = {
      id: "mk-" + Math.random().toString(36).substr(2, 9),
      name: name.trim().toUpperCase(),
      status: status === "Inactive" ? "Inactive" : "Active",
      createdAt: new Date().toISOString()
    };

    database.makes.push(newMake);
    saveDB();
     res.status(201).json(newMake);
  });

  app.put("/api/makes/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, status } = req.body;

    const makeIndex = database.makes.findIndex(m => m.id === id);
    if (makeIndex === -1) {
       res.status(404).json({ error: "Battery Make not found" });
       return;
    }

    if (name && name.trim()) {
      const checkDup = database.makes.find(m => m.id !== id && m.name.toLowerCase() === name.trim().toLowerCase());
      if (checkDup) {
         res.status(400).json({ error: "Another make with this name already exists" });
         return;
      }
      database.makes[makeIndex].name = name.trim().toUpperCase();
    }

    if (status) {
      database.makes[makeIndex].status = status;
    }

    saveDB();
     res.json(database.makes[makeIndex]);
  });

  app.delete("/api/makes/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const makeIndex = database.makes.findIndex(m => m.id === id);
    if (makeIndex === -1) {
       res.status(404).json({ error: "Battery Make not found" });
       return;
    }

    const make = database.makes[makeIndex];
    // Check if models exist under this make
    const hasModels = database.models.some(m => m.makeId === id);
    const hasRegistrations = database.registrations.some(r => r.makeId === id);

    if (hasModels || hasRegistrations) {
       res.status(400).json({ 
        error: "Cannot delete this make. It resides in active warranty models or customer registrations. Try marking it Inactive." 
      });
       return;
    }

    database.makes.splice(makeIndex, 1);
    saveDB();
     res.json({ message: "Battery Make successfully removed and purged." });
  });

  // -----------------------------------------------------
  // 4. MASTER SETTINGS: MODELS
  // -----------------------------------------------------
  app.get("/api/models", (req: Request, res: Response) => {
    const { makeId, status, search } = req.query;
    let list = [...database.models];

    if (makeId) {
      list = list.filter(m => m.makeId === makeId);
    }
    if (status) {
      list = list.filter(m => m.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.makeName.toLowerCase().includes(q));
    }

     res.json(list);
  });

  app.post("/api/models", authenticateAdmin, (req: Request, res: Response) => {
    const { makeId, name, status } = req.body;
    if (!makeId || !name || !name.trim()) {
       res.status(400).json({ error: "Both Battery Make link and Model Name are required." });
       return;
    }

    const make = database.makes.find(m => m.id === makeId);
    if (!make) {
       res.status(400).json({ error: "Selected Battery Make link is invalid or does not exist." });
       return;
    }

    const checkDup = database.models.find(
      m => m.makeId === makeId && m.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (checkDup) {
       res.status(400).json({ error: "This model name is already mapped under this make." });
       return;
    }

    const newModel: BatteryModel = {
      id: "md-" + Math.random().toString(36).substr(2, 9),
      makeId,
      makeName: make.name,
      name: name.trim(),
      status: status === "Inactive" ? "Inactive" : "Active",
      createdAt: new Date().toISOString()
    };

    database.models.push(newModel);
    saveDB();
     res.status(201).json(newModel);
  });

  app.put("/api/models/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { makeId, name, status } = req.body;

    const modelIndex = database.models.findIndex(m => m.id === id);
    if (modelIndex === -1) {
       res.status(404).json({ error: "Battery model not found" });
       return;
    }

    if (makeId) {
      const make = database.makes.find(m => m.id === makeId);
      if (!make) {
         res.status(400).json({ error: "Battery Make is invalid" });
         return;
      }
      database.models[modelIndex].makeId = makeId;
      database.models[modelIndex].makeName = make.name;
    }

    if (name && name.trim()) {
      const currentMakeId = database.models[modelIndex].makeId;
      const checkDup = database.models.find(
        m => m.id !== id && m.makeId === currentMakeId && m.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (checkDup) {
         res.status(400).json({ error: "Another model with this name is already registered under this make" });
         return;
      }
      database.models[modelIndex].name = name.trim();
    }

    if (status) {
      database.models[modelIndex].status = status;
    }

    saveDB();
     res.json(database.models[modelIndex]);
  });

  app.delete("/api/models/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const modelIndex = database.models.findIndex(m => m.id === id);
    if (modelIndex === -1) {
       res.status(404).json({ error: "Battery model not found" });
       return;
    }

    const hasRegistrations = database.registrations.some(r => r.modelId === id);
    if (hasRegistrations) {
       res.status(400).json({ 
        error: "Cannot delete this model. Active battery registrations exist for this model. Set to Inactive instead." 
      });
       return;
    }

    database.models.splice(modelIndex, 1);
    saveDB();
     res.json({ message: "Battery model successfully removed and deleted" });
  });

  // -----------------------------------------------------
  // 5. MASTER SETTINGS: WARRANTY PERIODS
  // -----------------------------------------------------
  app.get("/api/periods", (req: Request, res: Response) => {
    const { status } = req.query;
    let list = [...database.periods];
    if (status) {
      list = list.filter(p => p.status === status);
    }
    // Sort logically by months
    list.sort((a, b) => a.months - b.months);
     res.json(list);
  });

  app.post("/api/periods", authenticateAdmin, (req: Request, res: Response) => {
    const { months, standardMonths, proRataMonths, label, status } = req.body;
    
    // Fallbacks to keep compatibility
    const stdMonths = standardMonths !== undefined ? Math.max(0, Math.floor(Number(standardMonths))) : Math.max(0, Math.floor(Number(months || 0)));
    const prMonths = proRataMonths !== undefined ? Math.max(0, Math.floor(Number(proRataMonths))) : 0;
    const totalMonths = stdMonths + prMonths;

    if (totalMonths <= 0) {
       res.status(400).json({ error: "Total months standard + pro-rata must be greater than zero." });
       return;
    }

    const checkDup = database.periods.find(p => {
      const pStd = p.standardMonths !== undefined ? p.standardMonths : p.months;
      const pPr = p.proRataMonths !== undefined ? p.proRataMonths : 0;
      return pStd === stdMonths && pPr === prMonths;
    });

    if (checkDup) {
       res.status(400).json({ error: "A warranty period config with this combination standard and pro-rata already exists." });
       return;
    }

    const descLabel = label && label.trim() ? label.trim() : `${stdMonths}M Standard + ${prMonths}M Pro-Rata`;

    const newPeriod: WarrantyPeriod = {
      id: "wp-" + Math.random().toString(36).substr(2, 9),
      months: totalMonths,
      standardMonths: stdMonths,
      proRataMonths: prMonths,
      label: descLabel,
      status: status === "Inactive" ? "Inactive" : "Active",
      createdAt: new Date().toISOString()
    };

    database.periods.push(newPeriod);
    saveDB();
    res.status(201).json(newPeriod);
  });

  app.put("/api/periods/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { months, standardMonths, proRataMonths, label, status } = req.body;

    const idx = database.periods.findIndex(p => p.id === id);
    if (idx === -1) {
       res.status(404).json({ error: "Warranty Period not found" });
       return;
    }

    const oldPeriod = database.periods[idx];
    let stdMonths = oldPeriod.standardMonths !== undefined ? oldPeriod.standardMonths : (standardMonths !== undefined ? Math.floor(Number(standardMonths)) : oldPeriod.months);
    let prMonths = oldPeriod.proRataMonths !== undefined ? oldPeriod.proRataMonths : (proRataMonths !== undefined ? Math.floor(Number(proRataMonths)) : 0);

    if (standardMonths !== undefined && !isNaN(Number(standardMonths))) {
      stdMonths = Math.max(0, Math.floor(Number(standardMonths)));
    } else if (months !== undefined && !isNaN(Number(months)) && proRataMonths === undefined) {
      // Compatibility fallback
      stdMonths = Math.max(0, Math.floor(Number(months)));
    }

    if (proRataMonths !== undefined && !isNaN(Number(proRataMonths))) {
      prMonths = Math.max(0, Math.floor(Number(proRataMonths)));
    }

    const totalMonths = stdMonths + prMonths;
    if (totalMonths <= 0) {
      res.status(400).json({ error: "Combined months standard + pro-rata must be greater than zero." });
      return;
    }

    const checkDup = database.periods.find(p => {
      if (p.id === id) return false;
      const pStd = p.standardMonths !== undefined ? p.standardMonths : p.months;
      const pPr = p.proRataMonths !== undefined ? p.proRataMonths : 0;
      return pStd === stdMonths && pPr === prMonths;
    });

    if (checkDup) {
      res.status(400).json({ error: "Combination of standard and pro-rata months conflicts with another period" });
      return;
    }

    database.periods[idx].standardMonths = stdMonths;
    database.periods[idx].proRataMonths = prMonths;
    database.periods[idx].months = totalMonths;

    if (label && label.trim()) {
      database.periods[idx].label = label.trim();
    } else {
      database.periods[idx].label = `${stdMonths}M Standard + ${prMonths}M Pro-Rata`;
    }

    if (status) {
      database.periods[idx].status = status;
    }

    saveDB();
    res.json(database.periods[idx]);
  });

  app.delete("/api/periods/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = database.periods.findIndex(p => p.id === id);
    if (idx === -1) {
       res.status(404).json({ error: "Warranty period not found" });
       return;
    }

    // Check if used
    const labelUsed = database.periods[idx].label;
    const hasRegistrations = database.registrations.some(r => r.warrantyPeriodLabel === labelUsed);
    if (hasRegistrations) {
       res.status(400).json({ error: "Cannot delete. This period is linked to active customer registrations." });
       return;
    }

    database.periods.splice(idx, 1);
    saveDB();
     res.json({ message: "Warranty period configuration deleted" });
  });

  // -----------------------------------------------------
  // 6. MASTER SETTINGS: DEALERS
  // -----------------------------------------------------
  app.get("/api/dealers", (req: Request, res: Response) => {
    const { status, search } = req.query;
    let list = [...database.dealers];

    if (status) {
      list = list.filter(d => d.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.contactNumber.includes(q));
    }

     res.json(list);
  });

  app.post("/api/dealers", authenticateAdmin, (req: Request, res: Response) => {
    const { name, contactNumber, address, status } = req.body;
    
    if (!name || !name.trim() || !contactNumber || !address) {
       res.status(400).json({ error: "Dealer Name, Reachout Contact Number, and Postal Location Address are required fields." });
       return;
    }

    const checkDup = database.dealers.find(d => d.name.toLowerCase() === name.trim().toLowerCase());
    if (checkDup) {
       res.status(400).json({ error: "A dealer with this name already exists in the registry." });
       return;
    }

    const newDealer: Dealer = {
      id: "dl-" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      status: status === "Inactive" ? "Inactive" : "Active",
      createdAt: new Date().toISOString()
    };

    database.dealers.push(newDealer);
    saveDB();
     res.status(201).json(newDealer);
  });

  app.put("/api/dealers/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, contactNumber, address, status } = req.body;

    const idx = database.dealers.findIndex(d => d.id === id);
    if (idx === -1) {
       res.status(404).json({ error: "Dealer not found" });
       return;
    }

    if (name && name.trim()) {
      const checkDup = database.dealers.find(d => d.id !== id && d.name.toLowerCase() === name.trim().toLowerCase());
      if (checkDup) {
         res.status(400).json({ error: "Another dealer with this store name exists." });
         return;
      }
      database.dealers[idx].name = name.trim();
    }

    if (contactNumber !== undefined) {
      database.dealers[idx].contactNumber = contactNumber.trim();
    }
    if (address !== undefined) {
      database.dealers[idx].address = address.trim();
    }
    if (status) {
      database.dealers[idx].status = status;
    }

    saveDB();
     res.json(database.dealers[idx]);
  });

  app.delete("/api/dealers/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = database.dealers.findIndex(d => d.id === id);
    if (idx === -1) {
       res.status(404).json({ error: "Dealer not found" });
       return;
    }

    const dealer = database.dealers[idx];
    const hasRegistrations = database.registrations.some(r => r.dealerId === id || r.dealerName === dealer.name);
    if (hasRegistrations) {
       res.status(400).json({ error: "Cannot delete dealer. Linked customer sales warranties already exist under this dealer name." });
       return;
    }

    database.dealers.splice(idx, 1);
    saveDB();
     res.json({ message: "Dealer removed successfully." });
  });

  // -----------------------------------------------------
  // 7. WARRANTY REGISTRATION OPERATIONS
  // -----------------------------------------------------
  app.get("/api/registrations", authenticateAdmin, (req: Request, res: Response) => {
    refreshRegistrationStatuses();
    
    // De-structure search filters
    const { 
      makeId, 
      modelId, 
      serialNumber, 
      customerName, 
      dealerId, 
      status, 
      startDate, 
      endDate, 
      search,
      sortBy,
      sortOrder
    } = req.query;

    let list = [...database.registrations];

    // Search query parses all primary elements
    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(r => 
        r.customerName.toLowerCase().includes(q) ||
        r.serialNumber.toLowerCase().includes(q) ||
        r.customerContact.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.invoiceNumber?.toLowerCase().includes(q)
      );
    }

    // Direct Exact Filters
    if (makeId) {
      list = list.filter(r => r.makeId === makeId);
    }
    if (modelId) {
      list = list.filter(r => r.modelId === modelId);
    }
    if (serialNumber) {
      const s = (serialNumber as string).toLowerCase();
      list = list.filter(r => r.serialNumber.toLowerCase().includes(s));
    }
    if (customerName) {
      const c = (customerName as string).toLowerCase();
      list = list.filter(r => r.customerName.toLowerCase().includes(c));
    }
    if (dealerId) {
      list = list.filter(r => r.dealerId === dealerId);
    }
    if (status) {
      list = list.filter(r => r.status === status);
    }
    if (startDate) {
      list = list.filter(r => new Date(r.purchaseDate) >= new Date(startDate as string));
    }
    if (endDate) {
      list = list.filter(r => new Date(r.purchaseDate) <= new Date(endDate as string));
    }

    // Sorting columns
    if (sortBy) {
      const field = sortBy as keyof BatteryRegistration;
      const order = sortOrder === "desc" ? -1 : 1;
      list.sort((a, b) => {
        const valA = (a[field] || "").toString().toLowerCase();
        const valB = (b[field] || "").toString().toLowerCase();
        return valA < valB ? -1 * order : valA > valB ? 1 * order : 0;
      });
    } else {
      // Default: sort by purchase date descending to fetch recent cards
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

     res.json(list);
  });

  // Fast2SMS Automatic Outbound SMS Utility
  async function sendSmsViaFast2Sms(phoneNumber: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.warn("[Fast2SMS] FAST2SMS_API_KEY is not defined in environment variables. Outbound SMS was skipped.");
      return { success: false, error: "FAST2SMS_API_KEY is not configured in environment." };
    }

    // Clean phone number (e.g., strip non-digit characters)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    // Take last 10 digits as Indian standard
    const targetPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    if (targetPhone.length !== 10) {
      console.error(`[Fast2SMS] Invalid phone number length: ${targetPhone}. Must be 10 digits.`);
      return { success: false, error: "Invalid phone number. Fast2SMS expects a 10-digit mobile number." };
    }

    try {
      console.log(`[Fast2SMS] Sending automatic SMS to ${targetPhone}...`);
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: targetPhone
        })
      });

      const result: any = await response.json();
      console.log("[Fast2SMS] API Response:", result);
      if (result.return === true || result.status_code === 200 || result.return === "true") {
        return { success: true, data: result };
      } else {
        return { success: false, error: result.message || "Failed to send SMS." };
      }
    } catch (error: any) {
      console.error("[Fast2SMS] Error calling API:", error);
      return { success: false, error: error.message || "Internal network error." };
    }
  }

  app.post("/api/registrations", async (req: Request, res: Response) => {
    const {
      makeId,
      modelId,
      serialNumber,
      purchaseDate,
      warrantyPeriodId,
      customerName,
      customerContact,
      customerAddress,
      dealerId,
      invoiceNumber
    } = req.body;

    // Rich fields validation checks
    if (!makeId || !modelId || !serialNumber || !purchaseDate || !warrantyPeriodId || !customerName || !customerContact || !customerAddress || !dealerId) {
       res.status(400).json({ error: "Missing required registration details. Address and Contact must be supplied." });
       return;
    }

    // Duplicate serial check
    const checkDup = database.registrations.find(
      r => r.serialNumber.toLowerCase().trim() === serialNumber.toLowerCase().trim()
    );
    if (checkDup) {
       res.status(400).json({ error: `Battery Serial '${serialNumber}' has already been registered! Check status or contact assistance.` });
       return;
    }

    // Resolve entities linked relations
    const make = database.makes.find(m => m.id === makeId);
    const model = database.models.find(m => m.id === modelId);
    const period = database.periods.find(p => p.id === warrantyPeriodId);
    const dealer = database.dealers.find(d => d.id === dealerId);

    if (!make || !model || !period || !dealer) {
       res.status(400).json({ error: "Mismatched selections: Please ensure Make, Model, Warranty, and Dealer choices exist." });
       return;
    }

    // 100% relational integrity check
    if (model.makeId !== makeId) {
       res.status(400).json({ error: "Chosen battery model is not manufactured by selected battery maker." });
       return;
    }

    // Auto Warranty Expiry Calculation: Adds months to purchase timestamp
    const dateObj = new Date(purchaseDate);
    if (isNaN(dateObj.getTime())) {
       res.status(400).json({ error: "Invalid purchase date specified" });
       return;
    }
    
    const stdMonths = period.standardMonths !== undefined ? period.standardMonths : period.months;
    const prMonths = period.proRataMonths !== undefined ? period.proRataMonths : 0;

    const stdExpiryObj = new Date(dateObj);
    stdExpiryObj.setMonth(stdExpiryObj.getMonth() + stdMonths);
    const standardExpiryDate = stdExpiryObj.toISOString().split("T")[0];

    const expiryObj = new Date(dateObj);
    expiryObj.setMonth(expiryObj.getMonth() + (stdMonths + prMonths));
    const expiryDate = expiryObj.toISOString().split("T")[0];

    // Status is Dynamic relative to current server date 2026-05-28
    const isExpired = new Date(expiryDate) < new Date("2026-05-28");
    const status: 'Active' | 'Expired' = isExpired ? "Expired" : "Active";

    // Generate readable registration reference: REG-YYYYMM-6 random alphanumeric
    const datePrefix = purchaseDate.replace(/-/g, "").substr(0, 6); // YYYYMM
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
    const id = `REG-${datePrefix}-${randomHex}`;

    const newRegistration: BatteryRegistration = {
      id,
      makeId,
      makeName: make.name,
      modelId,
      modelName: model.name,
      serialNumber: serialNumber.trim().toUpperCase(),
      purchaseDate,
      warrantyMonths: stdMonths + prMonths,
      standardMonths: stdMonths,
      proRataMonths: prMonths,
      warrantyPeriodLabel: period.label,
      expiryDate,
      standardExpiryDate,
      customerName: customerName.trim(),
      customerContact: customerContact.trim(),
      customerAddress: customerAddress.trim(),
      dealerId,
      dealerName: dealer.name,
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : undefined,
      status,
      createdAt: new Date().toISOString()
    };

    // Construct automatic confirmation message using company details master setting name context
    const hasProRata = prMonths > 0;
    const stdExpiryFormatted = standardExpiryDate;
    const totalExpiryFormatted = expiryDate;
    const warrantyMsg = hasProRata
      ? `Standard Free Replacement runs until ${stdExpiryFormatted} (${stdMonths}M), followed by a Pro-Rata discount period until ${totalExpiryFormatted} (${prMonths}M)`
      : `Standard Free Replacement runs until ${totalExpiryFormatted} (${stdMonths}M)`;

    const companyShortName = database.company?.shortName || "PowerMax";
    const automaticMessageText = `Hello ${newRegistration.customerName}, your ${newRegistration.makeName} ${newRegistration.modelName} battery warranty has been successfully registered! Ref ID: ${newRegistration.id}, Serial: ${newRegistration.serialNumber}. Coverage: ${warrantyMsg}. Powered by ${companyShortName} Care.`;

    let smsSendingStatus = "Skipped (API key not configured)";
    let smsError = undefined;

    if (process.env.FAST2SMS_API_KEY) {
      const smsRes = await sendSmsViaFast2Sms(newRegistration.customerContact, automaticMessageText);
      if (smsRes.success) {
        smsSendingStatus = "Sent successfully";
        newRegistration.lastSmsSentAt = new Date().toISOString();
        newRegistration.lastSmsType = "Registration";
      } else {
        smsSendingStatus = "Failed to send";
        smsError = smsRes.error;
      }
    }

    database.registrations.unshift(newRegistration);
    saveDB();

    res.status(201).json({
      message: "Warranty created successfully!",
      registration: newRegistration,
      smsStatus: smsSendingStatus,
      smsError
    });
  });

  // Edit fields
  app.put("/api/registrations/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      makeId,
      modelId,
      serialNumber,
      purchaseDate,
      warrantyMonths,
      warrantyPeriodLabel,
      customerName,
      customerContact,
      customerAddress,
      dealerId,
      invoiceNumber
    } = req.body;

    const idx = database.registrations.findIndex(r => r.id === id);
    if (idx === -1) {
       res.status(404).json({ error: "Registration record not found" });
       return;
    }

    const reg = database.registrations[idx];

    if (serialNumber) {
      const serialClean = serialNumber.trim().toUpperCase();
      const checkDup = database.registrations.find(r => r.id !== id && r.serialNumber.toUpperCase() === serialClean);
      if (checkDup) {
         res.status(400).json({ error: "Another registered battery is already assigned this specific chemical serial number" });
         return;
      }
      reg.serialNumber = serialClean;
    }

    if (makeId) {
      const make = database.makes.find(m => m.id === makeId);
      if (make) {
        reg.makeId = makeId;
        reg.makeName = make.name;
      }
    }

    if (modelId) {
      const model = database.models.find(m => m.id === modelId);
      if (model) {
        reg.modelId = modelId;
        reg.modelName = model.name;
      }
    }

    if (dealerId) {
      const dealer = database.dealers.find(d => d.id === dealerId);
      if (dealer) {
        reg.dealerId = dealerId;
        reg.dealerName = dealer.name;
      }
    }

    if (customerName) reg.customerName = customerName.trim();
    if (customerContact) reg.customerContact = customerContact.trim();
    if (customerAddress) reg.customerAddress = customerAddress.trim();
    if (invoiceNumber !== undefined) reg.invoiceNumber = invoiceNumber.trim() || undefined;

    const oldStd = reg.standardMonths !== undefined ? reg.standardMonths : reg.warrantyMonths;
    const oldPr = reg.proRataMonths !== undefined ? reg.proRataMonths : 0;

    // Recalculating dates if change occurs
    if (purchaseDate) {
      reg.purchaseDate = purchaseDate;
    }
    
    const standardMonthsInput = req.body.standardMonths;
    const proRataMonthsInput = req.body.proRataMonths;
    
    if (standardMonthsInput !== undefined) {
      reg.standardMonths = Number(standardMonthsInput);
    } else if (warrantyMonths && proRataMonthsInput === undefined) {
      reg.standardMonths = Number(warrantyMonths);
      reg.proRataMonths = 0;
    } else if (reg.standardMonths === undefined) {
      reg.standardMonths = oldStd;
    }

    if (proRataMonthsInput !== undefined) {
      reg.proRataMonths = Number(proRataMonthsInput);
    } else if (reg.proRataMonths === undefined) {
      reg.proRataMonths = oldPr;
    }

    reg.warrantyMonths = reg.standardMonths + reg.proRataMonths;

    if (warrantyPeriodLabel) {
      reg.warrantyPeriodLabel = warrantyPeriodLabel;
    } else if (standardMonthsInput !== undefined || proRataMonthsInput !== undefined) {
      reg.warrantyPeriodLabel = `${reg.standardMonths}M Standard + ${reg.proRataMonths}M Pro-Rata`;
    }

    const dateObj = new Date(reg.purchaseDate);
    const stdExpiryObj = new Date(dateObj);
    stdExpiryObj.setMonth(stdExpiryObj.getMonth() + reg.standardMonths);
    reg.standardExpiryDate = stdExpiryObj.toISOString().split("T")[0];

    const expiryObj = new Date(dateObj);
    expiryObj.setMonth(expiryObj.getMonth() + reg.warrantyMonths);
    reg.expiryDate = expiryObj.toISOString().split("T")[0];

    const isExpired = new Date(reg.expiryDate) < new Date("2026-05-28");
    reg.status = isExpired ? "Expired" : "Active";

    saveDB();
     res.json(reg);
  });

  app.delete("/api/registrations/:id", authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = database.registrations.findIndex(r => r.id === id);
    if (idx === -1) {
       res.status(404).json({ error: "Registration record not found" });
       return;
    }

    database.registrations.splice(idx, 1);
    saveDB();
     res.json({ message: "Battery Warranty entry permanently purged successfully" });
  });

  // Log SMS/Dialer notification trigger
  app.post("/api/registrations/:id/sms-notification", authenticateAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { smsType, customBody } = req.body;

    const idx = database.registrations.findIndex(r => r.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Registration record not found" });
      return;
    }

    const registration = database.registrations[idx];
    let fast2smsResult = null;

    if (customBody && process.env.FAST2SMS_API_KEY) {
      const smsRes = await sendSmsViaFast2Sms(registration.customerContact, customBody);
      fast2smsResult = {
        success: smsRes.success,
        error: smsRes.error
      };
      if (smsRes.success) {
        registration.lastSmsSentAt = new Date().toISOString();
        registration.lastSmsType = smsType || "Alert";
      }
    } else {
      registration.lastSmsSentAt = new Date().toISOString();
      registration.lastSmsType = smsType || "Manual";
    }

    saveDB();

    res.json({
      message: "SMS notification logged successfully.",
      registration,
      fast2smsResult
    });
  });

  // -----------------------------------------------------
  // 8. PUBLIC WARRANTY STATUS SERVICE
  // -----------------------------------------------------
  app.get("/api/public/warranty-check", (req: Request, res: Response) => {
    refreshRegistrationStatuses();

    const { serialNumber, makeId, modelId } = req.query;

    if (!serialNumber || !serialNumber.toString().trim()) {
       res.status(400).json({ error: "A valid serial number must be keyed in." });
       return;
    }

    const cleanSerial = serialNumber.toString().toUpperCase().trim();

    // Query match
    let matches = database.registrations.filter(r => r.serialNumber.toUpperCase() === cleanSerial);

    if (makeId) {
      matches = matches.filter(r => r.makeId === makeId);
    }
    if (modelId) {
      matches = matches.filter(r => r.modelId === modelId);
    }

    if (matches.length === 0) {
       res.status(404).json({ 
        error: "No warranty records found matches this Serial Number inside our database." 
      });
       return;
    }

    // Match exact card
    const card = matches[0];
     res.json(card);
  });

  // -----------------------------------------------------
  // 9. COMPANY DETAILS MANAGER SERVICE
  // -----------------------------------------------------
  app.get("/api/company", (req: Request, res: Response) => {
    res.json(database.company || {
      name: "PowerMax Industries Ltd.",
      shortName: "PowerMax",
      appTitleLabel: "Warranty Portal",
      contactPhone: "+91 98765 43210",
      contactEmail: "support@powermax.com",
      address: "Shop 12, Metro Plaza, New Delhi, India"
    });
  });

  app.put("/api/company", authenticateAdmin, (req: Request, res: Response) => {
    const { name, shortName, appTitleLabel, contactPhone, contactEmail, address, logoDataUrl } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Company name is required." });
      return;
    }

    database.company = {
      name: name.trim(),
      shortName: (shortName || "").trim() || "PowerMax",
      appTitleLabel: (appTitleLabel || "").trim() || "Warranty Portal",
      contactPhone: (contactPhone || "").trim(),
      contactEmail: (contactEmail || "").trim(),
      address: (address || "").trim(),
      logoDataUrl: logoDataUrl || ""
    };

    saveDB();
    res.json(database.company);
  });

  // -----------------------------------------------------
  // 10. USER ACCCOUNTS / CREATION MANAGEMENT SERVICE (Admin only)
  // -----------------------------------------------------
  app.get("/api/users", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    // Return all users excluding passwords
    const users = database.admins.map(({ password, ...u }) => u);
    res.json(users);
  });

  app.post("/api/users", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;

    if (!username || !username.trim() || !email || !email.trim() || !password || !password.trim()) {
      res.status(400).json({ error: "Username, Email, and Password are all required." });
      return;
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    const checkDup = database.admins.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail.toLowerCase()
    );
    if (checkDup) {
      res.status(400).json({ error: "A user with this username or email already exists." });
      return;
    }

    const newUser = {
      id: "adm-" + Math.random().toString(36).substr(2, 9),
      username: cleanUsername,
      email: cleanEmail,
      password: bcrypt.hashSync(password, 10),
      role: role === "Admin" ? "Admin" : "General",
      createdAt: new Date().toISOString()
    };

    database.admins.push(newUser);
    saveDB();

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  });

  app.put("/api/users/:id", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    const idx = database.admins.findIndex(u => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const user = database.admins[idx];

    // Prevent changing the role of the primary 'admin' user to General to avoid lock-out
    if (user.username.toLowerCase() === "admin" && role === "General") {
      res.status(400).json({ error: "The primary 'admin' user role cannot be modified." });
      return;
    }

    if (username && username.trim()) {
      const cleanUser = username.trim();
      const checkDup = database.admins.find(u => u.id !== id && u.username.toLowerCase() === cleanUser.toLowerCase());
      if (checkDup) {
        res.status(400).json({ error: "Another user is already using this username." });
        return;
      }
      user.username = cleanUser;
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim();
      const checkDup = database.admins.find(u => u.id !== id && u.email.toLowerCase() === cleanEmail.toLowerCase());
      if (checkDup) {
        res.status(400).json({ error: "Another user is already using this email address." });
        return;
      }
      user.email = cleanEmail;
    }

    if (password && password.trim()) {
      user.password = bcrypt.hashSync(password, 10);
    }

    if (role) {
      user.role = role === "Admin" ? "Admin" : "General";
    }

    saveDB();

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.delete("/api/users/:id", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Prevent self deletion
    const currentAdmin = (req as any).admin;
    if (currentAdmin.id === id) {
      res.status(400).json({ error: "You cannot delete your own account." });
      return;
    }

    const idx = database.admins.findIndex(u => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userToDelete = database.admins[idx];
    if (userToDelete.username.toLowerCase() === "admin") {
      res.status(400).json({ error: "The primary 'admin' user profile cannot be deleted." });
      return;
    }

    database.admins.splice(idx, 1);
    saveDB();
    res.json({ message: "User account deleted successfully." });
  });

  app.get("/api/database/export", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    res.json(database);
  });

  app.post("/api/database/import", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const newDb = req.body;
      if (!newDb || !newDb.company || !newDb.admins) {
        res.status(400).json({ error: "Invalid database format. Required collections are missing." });
        return;
      }
      
      database = newDb;
      saveDB();
      res.json({ message: "Database restored successfully. You may need to login again if admin accounts were changed." });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to parse and restore database." });
    }
  });

  app.post("/api/database/clear", authenticateAdmin, requireSuperAdmin, (req: Request, res: Response) => {
    database.makes = [];
    database.models = [];
    database.periods = [];
    database.dealers = [];
    database.registrations = [];
    
    saveDB();
    res.json({ message: "Database cleared successfully. Only company settings and admin accounts remain." });
  });

  // -----------------------------------------------------
  // VITE SERVICE MIDDLEWARE & SPA FALLBACKS
  // -----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // PORT INGRESS ROUTING
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully at http://0.0.0.0:${PORT}`);
  });
}

startServer();
