import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '../../../../lib/db/client'
import { ensureAppReady } from '@/lib/db/startup'

// GET - fetch calculator data by UPRN
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
    const uprn = searchParams.get('uprn') || searchParams.get('id') // Backward compatibility

    if (!uprn) {
      return NextResponse.json(
        { error: 'UPRN is required' },
        { status: 400 }
      )
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
      'SELECT data, last_updated FROM calculator_data WHERE user_id = $1 AND uprn = $2',
      [userId, uprn]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Calculator data not found' },
        { status: 404 }
      )
    }

    const calculatorData = result.rows[0]
    return NextResponse.json({
      data: calculatorData.data,
      lastUpdated: calculatorData.last_updated
    })
  } catch (error) {
    console.error('Error fetching calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - save/update calculator data
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
    
    const { uprn, analysisId, data } = await request.json()
    const propertyUprn = uprn || analysisId // Backward compatibility

    if (!propertyUprn || !data) {
      return NextResponse.json(
        { error: 'UPRN and data are required' },
        { status: 400 }
      )
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

    // Use upsert (INSERT ... ON CONFLICT UPDATE)
    const result = await query(`
      INSERT INTO calculator_data (user_id, uprn, data, last_updated)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, uprn) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        last_updated = NOW()
      RETURNING *
    `, [userId, propertyUprn, data])

    const calculatorData = result.rows[0]
    return NextResponse.json({
      data: calculatorData.data,
      lastUpdated: calculatorData.last_updated
    })
  } catch (error) {
    console.error('Error saving calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - delete calculator data
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const uprn = searchParams.get('uprn') || searchParams.get('id') // Backward compatibility

    if (!uprn) {
      return NextResponse.json(
        { error: 'UPRN is required' },
        { status: 400 }
      )
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

    await query(
      'DELETE FROM calculator_data WHERE user_id = $1 AND uprn = $2',
      [userId, uprn]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
