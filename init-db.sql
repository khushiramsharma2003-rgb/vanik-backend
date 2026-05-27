-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deals table
CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  trade_type VARCHAR(50) NOT NULL, -- 'Domestic' or 'International'
  deal_type VARCHAR(50) NOT NULL, -- 'Purchase' or 'Sale'
  date_of_entry DATE NOT NULL,
  contract_month VARCHAR(20) NOT NULL,
  commodity VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  broker VARCHAR(255),
  party_name VARCHAR(255),
  apmc_mandi VARCHAR(100),
  port_of_origin VARCHAR(100),
  port_of_destination VARCHAR(100),
  shipping_terms VARCHAR(50),
  address TEXT,
  container_number VARCHAR(100),
  payment_date DATE,
  payment_amount DECIMAL(15, 2),
  balance_to_pay DECIMAL(15, 2),
  delivery_date DATE,
  currency VARCHAR(10) DEFAULT '₹',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prices table (for tracking global, domestic, international prices)
CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL, -- 'NCDEX', 'APMC', 'CBOT', 'FAO', etc.
  commodity VARCHAR(100) NOT NULL,
  contract_month VARCHAR(20),
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  commodity VARCHAR(100) NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'Buy', 'Sell', 'Hold'
  confidence_score DECIMAL(3, 2),
  suggested_price DECIMAL(12, 2),
  rationale TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rates table
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(10),
  to_currency VARCHAR(10),
  rate DECIMAL(12, 4),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_commodity ON deals(commodity);
CREATE INDEX idx_deals_contract_month ON deals(contract_month);
CREATE INDEX idx_prices_commodity ON prices(commodity);
CREATE INDEX idx_prices_source ON prices(source);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);