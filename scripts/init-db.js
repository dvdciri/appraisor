#!/usr/bin/env node

/**
 * Database initialization script
 * Run this script to initialize the database before starting the application
 * 
 * Usage: node scripts/init-db.js
 */

const { query } = require('../lib/db/client')

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...')
    
    // Create subscriptions table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            is_first_n_subscriber BOOLEAN DEFAULT FALSE,
            sendfox_contact_id VARCHAR(255) NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('Created/verified subscriptions table')
    } catch (error) {
      console.error('Error creating subscriptions table:', error)
    }
    
    // Create indexes
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email)')
      await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at)')
      console.log('Created/verified indexes')
    } catch (error) {
      console.error('Error creating indexes:', error)
    }
    
    // Create function and trigger for updated_at
    try {
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)
      await query(`
        CREATE TRIGGER update_subscriptions_updated_at 
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log('Created/verified triggers')
    } catch (error) {
      console.error('Error creating triggers:', error)
    }
    
    console.log('✅ Database initialization completed successfully!')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

async function main() {
  try {
    await initializeDatabase()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

main()
