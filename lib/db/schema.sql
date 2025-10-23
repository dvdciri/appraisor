-- PostgreSQL Schema for Estimo Property Analysis App
-- Designed to support future multi-user functionality with user_id column

-- Properties table: Generic property data keyed by UPRN (shared across users)
CREATE TABLE IF NOT EXISTS properties (
    uprn VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    last_fetched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fetched_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL -- For future multi-user support
);

-- Calculator data table: Financial calculations per property (keyed by UPRN)
CREATE TABLE IF NOT EXISTS calculator_data (
    uprn VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL -- For future multi-user support
);

-- Comparables data table: Selected comparables and valuation strategy per property
CREATE TABLE IF NOT EXISTS comparables_data (
    uprn VARCHAR(50) PRIMARY KEY,
    selected_comparable_ids JSONB DEFAULT '[]'::jsonb,
    valuation_strategy VARCHAR(20) DEFAULT 'average' CHECK (valuation_strategy IN ('average', 'price_per_sqm')),
    calculated_valuation DECIMAL(15,2) NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL -- For future multi-user support
);

-- Subscriptions table: Track email subscriptions for early access
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_first_n_subscriber BOOLEAN DEFAULT FALSE,
    sendfox_contact_id VARCHAR(255) NULL, -- Store SendFox contact ID for reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_last_fetched ON properties(last_fetched);
CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id);
CREATE INDEX IF NOT EXISTS idx_comparables_data_user_id ON comparables_data(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculator_data_updated_at BEFORE UPDATE ON calculator_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparables_data_updated_at BEFORE UPDATE ON comparables_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
