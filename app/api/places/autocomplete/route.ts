import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')

    if (!input || input.length < 3) {
      return NextResponse.json({ suggestions: [] })
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found. Please configure your API key.')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['gb'], // Restrict to UK addresses
        languageCode: 'en-GB',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Places API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch address suggestions' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Log the complete autocomplete response
    console.log('🔍 Places API Autocomplete Response:')
    console.log('  Input Query:', input)
    console.log('  Full Response:', JSON.stringify(data, null, 2))
    
    // Transform the response to a simpler format
    const suggestions = data.suggestions?.map((suggestion: any) => ({
      place_id: suggestion.placePrediction.placeId,
      description: suggestion.placePrediction.text.text,
    })) || []

    console.log('📋 Processed Suggestions:')
    console.log('  Number of suggestions:', suggestions.length)
    console.log('  Suggestions:', suggestions)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching address suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
