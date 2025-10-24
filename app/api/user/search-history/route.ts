import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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

    // Get user's search history with property details
    const searchHistoryResult = await query(`
      SELECT 
        ush.uprn,
        ush.searched_at,
        p.data->'data'->'attributes'->'address'->'street_group_format'->>'address_lines' as address
      FROM user_search_history ush
      JOIN properties p ON ush.uprn = p.uprn
      WHERE ush.user_id = $1
      ORDER BY ush.searched_at DESC
      LIMIT 50
    `, [userId])

    const searches = searchHistoryResult.rows.map(row => ({
      uprn: row.uprn,
      address: row.address || 'Address not available',
      searched_at: row.searched_at
    }))

    return NextResponse.json(searches)
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
