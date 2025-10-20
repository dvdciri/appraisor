import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

// GET - fetch calculator data by analysis ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT data, updated_at FROM calculator_data WHERE analysis_id = $1',
      [analysisId]
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
      lastUpdated: calculatorData.updated_at
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
    const { analysisId, data } = await request.json()

    if (!analysisId || !data) {
      return NextResponse.json(
        { error: 'Analysis ID and data are required' },
        { status: 400 }
      )
    }

    // First, check if the analysis exists, if not create a dummy one
    const analysisCheck = await query(
      'SELECT analysis_id FROM user_analyses WHERE analysis_id = $1',
      [analysisId]
    )

    if (analysisCheck.rows.length === 0) {
      // First ensure the property exists
      await query(`
        INSERT INTO properties (uprn, data, last_fetched, fetched_count)
        VALUES ('temp-uprn', '{}', $1, 1)
        ON CONFLICT (uprn) DO NOTHING
      `, [Date.now()])
      
      // Create a dummy analysis entry to satisfy foreign key constraint
      await query(`
        INSERT INTO user_analyses (analysis_id, uprn, timestamp, search_address, search_postcode)
        VALUES ($1, 'temp-uprn', $2, 'Temporary Analysis', '')
        ON CONFLICT (analysis_id) DO NOTHING
      `, [analysisId, Date.now()])
    }

    // Use upsert (INSERT ... ON CONFLICT UPDATE)
    const result = await query(`
      INSERT INTO calculator_data (analysis_id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (analysis_id) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        updated_at = NOW()
      RETURNING *
    `, [analysisId, data])

    const calculatorData = result.rows[0]
    return NextResponse.json({
      data: calculatorData.data,
      lastUpdated: calculatorData.updated_at
    })
  } catch (error) {
    console.error('Error saving calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
