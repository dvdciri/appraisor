import { query } from './client'

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...')
    
    // Embedded schema to avoid file system issues in production
    const schema = `
CREATE TABLE IF NOT EXISTS properties (
    uprn VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    last_fetched BIGINT NOT NULL,
    fetched_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_analyses (
    analysis_id VARCHAR(255) PRIMARY KEY,
    uprn VARCHAR(255) NOT NULL REFERENCES properties(uprn) ON DELETE CASCADE,
    search_address TEXT,
    search_postcode VARCHAR(20),
    timestamp BIGINT NOT NULL,
    selected_comparables JSONB DEFAULT '[]'::jsonb,
    calculated_valuation NUMERIC,
    valuation_based_on_comparables INT,
    last_valuation_update BIGINT,
    calculated_rent NUMERIC,
    rent_based_on_comparables INT,
    last_rent_update BIGINT,
    calculated_yield NUMERIC,
    last_yield_update BIGINT,
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculator_data (
    analysis_id VARCHAR(255) PRIMARY KEY REFERENCES user_analyses(analysis_id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recent_analyses (
    analysis_id VARCHAR(255) PRIMARY KEY REFERENCES user_analyses(analysis_id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id column to tables for future multi-user support
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE calculator_data ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE recent_analyses ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_uprn ON properties(uprn);
CREATE INDEX IF NOT EXISTS idx_user_analyses_uprn ON user_analyses(uprn);
CREATE INDEX IF NOT EXISTS idx_user_analyses_timestamp ON user_analyses(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_recent_analyses_timestamp ON recent_analyses(timestamp DESC);
    `
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement)
      }
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Check if database is properly initialized
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Check if all required tables exist
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('properties', 'user_analyses', 'calculator_data', 'recent_analyses')
    `)
    
    const expectedTables = ['properties', 'user_analyses', 'calculator_data', 'recent_analyses']
    const existingTables = result.rows.map((row: any) => row.table_name)
    
    const allTablesExist = expectedTables.every(table => existingTables.includes(table))
    
    if (!allTablesExist) {
      console.warn('Some required tables are missing:', {
        expected: expectedTables,
        existing: existingTables
      })
      return false
    }
    
    console.log('Database health check passed')
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
