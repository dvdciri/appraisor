import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '../../../../lib/db/client'

// GET - fetch analysis by ID or list recent analyses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')
    const recent = searchParams.get('recent')

    if (recent === 'true') {
      // Get recent analyses (ordered by timestamp, limit 50)
      const result = await query(`
        SELECT ra.analysis_id, ra.timestamp
        FROM recent_analyses ra
        ORDER BY ra.timestamp DESC
        LIMIT 50
      `)

      return NextResponse.json(result.rows.map((row: any) => ({
        analysis_id: row.analysis_id,
        timestamp: parseInt(row.timestamp)
      })))
    }

    if (analysisId) {
      // Get specific analysis
      const result = await query(`
        SELECT 
          ua.analysis_id,
          ua.uprn,
          ua.search_address,
          ua.search_postcode,
          ua.timestamp,
          ua.selected_comparables,
          ua.calculated_valuation,
          ua.valuation_based_on_comparables,
          ua.last_valuation_update,
          ua.calculated_rent,
          ua.rent_based_on_comparables,
          ua.last_rent_update,
          ua.calculated_yield,
          ua.last_yield_update,
          ua.filters
        FROM user_analyses ua
        WHERE ua.analysis_id = $1
      `, [analysisId])

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      const analysis = result.rows[0]
      return NextResponse.json({
        uprn: analysis.uprn,
        searchAddress: analysis.search_address,
        searchPostcode: analysis.search_postcode,
        timestamp: analysis.timestamp
      })
    }

    return NextResponse.json(
      { error: 'Either id or recent parameter is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - save/update user analysis
export async function POST(request: NextRequest) {
  try {
    const {
      analysisId,
      uprn,
      searchAddress,
      searchPostcode,
      timestamp
    } = await request.json()


    if (!analysisId || !uprn) {
      return NextResponse.json(
        { error: 'analysisId and uprn are required' },
        { status: 400 }
      )
    }

    await withTransaction(async (client) => {
      try {
        // First, ensure the property exists (create a dummy entry if needed)
        await client.query(`
          INSERT INTO properties (uprn, data, last_fetched, fetched_count)
          VALUES ($1, '{}', $2, 1)
          ON CONFLICT (uprn) DO NOTHING
        `, [uprn, Date.now()])
        

      // Insert or update user analysis
      
      await client.query(`
        INSERT INTO user_analyses (
          analysis_id, uprn, search_address, search_postcode, timestamp
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (analysis_id) 
        DO UPDATE SET 
          search_address = EXCLUDED.search_address,
          search_postcode = EXCLUDED.search_postcode,
          updated_at = NOW()
      `, [
        analysisId, uprn, searchAddress, searchPostcode, timestamp
      ])

      // Update recent analyses list (remove if exists, then add to top)
      await client.query(
        'DELETE FROM recent_analyses WHERE analysis_id = $1',
        [analysisId]
      )
      
      await client.query(
        'INSERT INTO recent_analyses (analysis_id, timestamp) VALUES ($1, $2)',
        [analysisId, timestamp ? parseInt(timestamp.toString()) : Date.now()]
      )

      // Keep only the most recent 50 analyses
      await client.query(`
        DELETE FROM recent_analyses 
        WHERE analysis_id NOT IN (
          SELECT analysis_id FROM recent_analyses 
          ORDER BY timestamp DESC 
          LIMIT 50
        )
      `)
      
      } catch (transactionError) {
        console.error('Transaction error for analysis:', analysisId, transactionError)
        throw transactionError
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - delete analysis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    await withTransaction(async (client) => {
      // Delete from recent analyses first (foreign key constraint)
      await client.query(
        'DELETE FROM recent_analyses WHERE analysis_id = $1',
        [analysisId]
      )
      
      // Delete the analysis (this will cascade to calculator_data)
      await client.query(
        'DELETE FROM user_analyses WHERE analysis_id = $1',
        [analysisId]
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
