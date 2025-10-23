import { ensureDatabaseInitialized } from './init-app'

let isAppInitialized = false

/**
 * Initialize the application database on server startup
 * This should be called once when the server starts
 */
export async function initializeApp(): Promise<void> {
  if (isAppInitialized) {
    console.log('✅ App already initialized')
    return
  }

  try {
    console.log('🚀 Initializing application...')
    await ensureDatabaseInitialized()
    isAppInitialized = true
    console.log('✅ Application initialization complete')
  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    throw error
  }
}

/**
 * Check if the application has been initialized
 */
export function isInitialized(): boolean {
  return isAppInitialized
}

/**
 * Ensure the application is ready before handling requests
 * This can be called from API routes that need database access
 */
export async function ensureAppReady(): Promise<void> {
  if (!isAppInitialized) {
    await initializeApp()
  }
}
