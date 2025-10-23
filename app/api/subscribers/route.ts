import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { getClient } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const db = await getClient()
    
    // Get total subscription count from our database
    const result = await db.query('SELECT COUNT(*) as total FROM subscriptions')
    const subscriberCount = parseInt(result.rows[0].total) || 0
    
    // Debug logging for production
    console.log('Subscribers API Debug:', {
      environment: process.env.NODE_ENV,
      rawCount: result.rows[0].total,
      parsedCount: subscriberCount,
      maxFreeSpots: CONFIG.MAX_FREE_SPOTS,
      timestamp: new Date().toISOString()
    })
    
    const response = NextResponse.json(
      { 
        subscriber_count: subscriberCount,
        max_free_spots: CONFIG.MAX_FREE_SPOTS,
        remaining_spots: Math.max(0, CONFIG.MAX_FREE_SPOTS - subscriberCount),
        is_first_n: subscriberCount < CONFIG.MAX_FREE_SPOTS
      },
      { status: 200 }
    )

    // Add aggressive cache-busting headers for production
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('Vary', '*')
    response.headers.set('Last-Modified', new Date().toUTCString())
    response.headers.set('ETag', `"${Date.now()}"`)

    return response

  } catch (error) {
    console.error('Error fetching subscriber count from database:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching subscriber count.' },
      { status: 500 }
    )
  }
}
