import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    // Check if SendFox API key is available
    const sendFoxApiKey = process.env.SEND_FOX_API_KEY
    if (!sendFoxApiKey) {
      console.error('SEND_FOX_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      )
    }

    // Get subscribers from SendFox list using the correct endpoint
    const sendFoxResponse = await fetch('https://api.sendfox.com/lists/607123/contacts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sendFoxApiKey}`,
        'Content-Type': 'application/json',
      },
    })


    if (!sendFoxResponse.ok) {
      const errorData = await sendFoxResponse.json().catch(() => ({}))
      console.error('SendFox API error:', {
        status: sendFoxResponse.status,
        statusText: sendFoxResponse.statusText,
        error: errorData
      })

      return NextResponse.json(
        { error: 'Failed to fetch subscriber count' },
        { status: 500 }
      )
    }

    const sendFoxData = await sendFoxResponse.json()
    
    // Extract subscriber count from the response
    // Note: The API 'total' field only counts CONFIRMED subscribers
    // Unconfirmed subscribers are not included in this count
    const subscriberCount = sendFoxData.total || 0
  
    
    return NextResponse.json(
      { 
        subscriber_count: subscriberCount,
        max_free_spots: CONFIG.MAX_FREE_SPOTS,
        remaining_spots: Math.max(0, CONFIG.MAX_FREE_SPOTS - subscriberCount),
        is_first_100: subscriberCount < CONFIG.MAX_FREE_SPOTS
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error fetching subscriber count:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching subscriber count.' },
      { status: 500 }
    )
  }
}
