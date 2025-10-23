import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db/init'
import { isInitialized } from '@/lib/db/startup'

export async function GET() {
  try {
    const appInitialized = isInitialized()
    const dbHealthy = await checkDatabaseHealth()
    
    const isHealthy = appInitialized && dbHealthy
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      app: appInitialized ? 'initialized' : 'not_initialized',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    }, { 
      status: isHealthy ? 200 : 503 
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      app: 'error',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 503 
    })
  }
}
