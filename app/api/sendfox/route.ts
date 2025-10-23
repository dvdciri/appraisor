import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { getClient } from '@/lib/db/client'

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

    // Get current subscriber count from our database to determine if this is one of the first N subscribers
    let isFirstNSubscriber = false
    try {
      const db = await getClient()
      const result = await db.query('SELECT COUNT(*) as total FROM subscriptions')
      const currentCount = parseInt(result.rows[0].total) || 0
      isFirstNSubscriber = currentCount < CONFIG.MAX_FREE_SPOTS
      console.log('Current subscriber count:', currentCount, `Is first ${CONFIG.MAX_FREE_SPOTS}:`, isFirstNSubscriber)
    } catch (error) {
      console.error('Error getting subscriber count from database:', error)
    }

    // Prepare contact fields array
    const contactFields = []
    if (isFirstNSubscriber) {
      contactFields.push({
        name: `first_${CONFIG.MAX_FREE_SPOTS}_subscribers`,
        value: 'true'
      })
    }

    // Prepare the contact data
    const contactData = {
      email: email.toLowerCase().trim(),
      lists: [607123], // List ID for early access signups
      contact_fields: contactFields
    }

    console.log('Creating contact with data:', JSON.stringify(contactData, null, 2))

    // Call SendFox API to create contact
    const sendFoxResponse = await fetch('https://api.sendfox.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendFoxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    })

    console.log('SendFox contact creation response status:', sendFoxResponse.status)
    console.log('SendFox contact creation response headers:', Object.fromEntries(sendFoxResponse.headers.entries()))

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
        console.log('Email already exists or validation error')
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
    console.log('Successfully added contact to SendFox:', JSON.stringify(sendFoxData, null, 2))

    // Save subscription to our database
    try {
      const db = await getClient()
      await db.query(
        'INSERT INTO subscriptions (email, is_first_n_subscriber, sendfox_contact_id) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [email.toLowerCase().trim(), isFirstNSubscriber, sendFoxData.id || null]
      )
      console.log('Successfully saved subscription to database')
    } catch (dbError) {
      console.error('Error saving subscription to database:', dbError)
      // Don't fail the request if database save fails, but log it
    }

    // Prepare success message based on whether they're in the first N subscribers
    const successMessage = isFirstNSubscriber 
      ? `Congratulations! You're one of our first ${CONFIG.MAX_FREE_SPOTS} subscribers and will receive free credits when we launch! 🎉`
      : 'Thank you! We\'ll be in touch soon with your free credits.'

    return NextResponse.json(
      { 
        success: true, 
        message: successMessage,
        is_first_n: isFirstNSubscriber
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
