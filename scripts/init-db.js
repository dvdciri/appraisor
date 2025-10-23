#!/usr/bin/env node

/**
 * Database initialization script
 * Run this script to initialize the database before starting the application
 * 
 * Usage: node scripts/init-db.js
 */

const { initializeApp } = require('../lib/db/startup')

async function main() {
  try {
    console.log('🚀 Starting database initialization...')
    await initializeApp()
    console.log('✅ Database initialization completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

main()
