import { NextRequest, NextResponse } from 'next/server'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if SendFox API key is available
    const sendFoxApiKey = process.env.SEND_FOX_API_KEY
    if (!sendFoxApiKey) {
      console.error('SEND_FOX_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      )
    }

    // Call SendFox API to create contact
    const sendFoxResponse = await fetch('https://api.sendfox.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendFoxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        lists: [607123] // List ID for early access signups
      }),
    })

    if (!sendFoxResponse.ok) {
      const errorData = await sendFoxResponse.json().catch(() => ({}))
      console.error('SendFox API error:', {
        status: sendFoxResponse.status,
        statusText: sendFoxResponse.statusText,
        error: errorData
      })

      // Handle specific error cases
      if (sendFoxResponse.status === 422) {
        // Email already exists or validation error
        return NextResponse.json(
          { error: 'This email is already registered or invalid' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: 500 }
      )
    }

    const sendFoxData = await sendFoxResponse.json()
    console.log('Successfully added contact to SendFox:', sendFoxData)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you! We\'ll be in touch soon with your free credits.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in SendFox API route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
