import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '../../../../lib/db/client'
import { ensureAppReady } from '@/lib/db/startup'

export async function GET(request: NextRequest) {
  try {
    // Ensure database is ready before processing
    await ensureAppReady()
    
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const uprn = searchParams.get('uprn')

    if (!uprn) {
      return NextResponse.json({ error: 'UPRN is required' }, { status: 400 })
    }

    // Get user_id from database
    const userResult = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].user_id

    const result = await query(
      'SELECT * FROM comparables_data WHERE user_id = $1 AND uprn = $2',
      [userId, uprn]
    )

    if (result.rows.length === 0) {
      // Return default structure if no data exists
      return NextResponse.json({
        uprn,
        selected_comparable_ids: [],
        valuation_strategy: 'average',
        calculated_valuation: null
      })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching comparables data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparables data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure database is ready before processing
    await ensureAppReady()
    
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { uprn, selected_comparable_ids, valuation_strategy, calculated_valuation } = body

    if (!uprn) {
      return NextResponse.json({ error: 'UPRN is required' }, { status: 400 })
    }

    // Validate strategy
    if (valuation_strategy && !['average', 'price_per_sqm'].includes(valuation_strategy)) {
      return NextResponse.json({ error: 'Invalid valuation strategy' }, { status: 400 })
    }

    // Use a single query with CTE to get user_id and insert/update in one go
    // This reduces database round trips
    const result = await query(
      `WITH user_lookup AS (
        SELECT user_id FROM users WHERE email = $1 LIMIT 1
      )
      INSERT INTO comparables_data (user_id, uprn, selected_comparable_ids, valuation_strategy, calculated_valuation)
      SELECT user_id, $2, $3, $4, $5
      FROM user_lookup
      ON CONFLICT (user_id, uprn) 
      DO UPDATE SET 
        selected_comparable_ids = EXCLUDED.selected_comparable_ids,
        valuation_strategy = EXCLUDED.valuation_strategy,
        calculated_valuation = EXCLUDED.calculated_valuation,
        last_updated = NOW()
      RETURNING *`,
      [
        session.user.email,
        uprn,
        JSON.stringify(selected_comparable_ids || []),
        valuation_strategy || 'average',
        calculated_valuation
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error saving comparables data:', error)
    return NextResponse.json(
      { error: 'Failed to save comparables data' },
      { status: 500 }
    )
  }
}
