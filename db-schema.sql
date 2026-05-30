-- =====================================================================
-- DATABASE SCHEMA DESIGN FOR BATTERY WARRANTY MANAGEMENT SYSTEM (MySQL)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS battery_warranty_db;
USE battery_warranty_db;

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Battery Makes Table
CREATE TABLE IF NOT EXISTS `battery_makes` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Battery Models Table (Relational - linked to Make)
CREATE TABLE IF NOT EXISTS `battery_models` (
  `id` VARCHAR(50) NOT NULL,
  `make_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_make_model` (`make_id`, `name`),
  CONSTRAINT `fk_models_make_id` FOREIGN KEY (`make_id`) REFERENCES `battery_makes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Warranty Periods Table
CREATE TABLE IF NOT EXISTS `warranty_periods` (
  `id` VARCHAR(50) NOT NULL,
  `months` INT NOT NULL UNIQUE,
  `label` VARCHAR(50) NOT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Dealers / Outlets Table
CREATE TABLE IF NOT EXISTS `dealers` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `contact_number` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Battery Registrations Table
CREATE TABLE IF NOT EXISTS `battery_registrations` (
  `id` VARCHAR(50) NOT NULL, -- Format: REG-XXXXXX (Secure auto-generated identifier)
  `make_id` VARCHAR(50) NOT NULL,
  `model_id` VARCHAR(50) NOT NULL,
  `serial_number` VARCHAR(100) NOT NULL UNIQUE, -- Unique Serial constraint
  `purchase_date` DATE NOT NULL,
  `warranty_period_id` VARCHAR(50) NOT NULL,
  `warranty_months` INT NOT NULL,
  `expiry_date` DATE NOT NULL, -- Auto calculated at insert
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_contact` VARCHAR(20) NOT NULL,
  `customer_address` TEXT NOT NULL,
  `dealer_id` VARCHAR(50) NOT NULL,
  `invoice_number` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('Active', 'Expired') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_serial_number` (`serial_number`),
  INDEX `idx_customer_name` (`customer_name`),
  INDEX `idx_expiry_date` (`expiry_date`),
  CONSTRAINT `fk_registrations_make` FOREIGN KEY (`make_id`) REFERENCES `battery_makes` (`id`),
  CONSTRAINT `fk_registrations_model` FOREIGN KEY (`model_id`) REFERENCES `battery_models` (`id`),
  CONSTRAINT `fk_registrations_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Default admin user (Password: "admin123", hashed with bcrypt as $2a$10$tM.AicUu/g2RNDn16g/i7.C4.eL8lreEksvC/oN6e93sSjJbLw0aW)
INSERT INTO `admins` (`id`, `username`, `email`, `password`) VALUES
('adm-01', 'admin', 'admin@batterywarranty.com', '$2a$10$tM.AicUu/g2RNDn16g/i7.C4.eL8lreEksvC/oN6e93sSjJbLw0aW');

-- Default Battery Makes
INSERT INTO `battery_makes` (`id`, `name`, `status`) VALUES
('mk-exide', 'EXIDE', 'Active'),
('mk-amaron', 'AMARON', 'Active'),
('mk-sfsonic', 'SF SONIC', 'Active'),
('mk-luminous', 'LUMINOUS', 'Active');

-- Default Battery Models
INSERT INTO `battery_models` (`id`, `make_id`, `name`, `status`) VALUES
('md-ex1', 'mk-exide', 'EXIDE Mile-Plus 150AH', 'Active'),
('md-ex2', 'mk-exide', 'EXIDE Tubular 200AH', 'Active'),
('md-ex3', 'mk-exide', 'EXIDE Matrix 80AH', 'Active'),
('md-am1', 'mk-amaron', 'AMARON Pro 150AH', 'Active'),
('md-am2', 'mk-amaron', 'AMARON Hi-Way 100AH', 'Active'),
('md-sf1', 'mk-sfsonic', 'SF Sonic Volt 120AH', 'Active'),
('md-lm1', 'mk-luminous', 'Luminous RedCharge 150AH', 'Active');

-- Default Warranty Periods
INSERT INTO `warranty_periods` (`id`, `months`, `label`, `status`) VALUES
('wp-12m', 12, '12 Months', 'Active'),
('wp-18m', 18, '18 Months', 'Active'),
('wp-24m', 24, '24 Months', 'Active'),
('wp-36m', 36, '36 Months', 'Active'),
('wp-48m', 48, '48 Months', 'Active'),
('wp-60m', 60, '60 Months', 'Active');

-- Default Dealers
INSERT INTO `dealers` (`id`, `name`, `contact_number`, `address`, `status`) VALUES
('dl-01', 'Spark Auto Electricals', '+91 98765 43210', 'Shop 12, Metro Plaza, New Delhi', 'Active'),
('dl-02', 'Power Source Battery House', '+91 87654 32109', 'Sector 4, Hiranandani Complex, Mumbai', 'Active'),
('dl-03', 'Energy Trade Dealers', '+91 76543 21098', 'G-14, Green Avenue, Bangalore', 'Active'),
('dl-04', 'Alpha Battery Hub', '+91 65432 10987', 'Court Road, Civil Lines, Kolkata', 'Active');
