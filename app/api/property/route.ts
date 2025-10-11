import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { address, postcode } = await request.json()
    
    // For now, just return the data.json file regardless of input
    // const dataPath = path.join(process.cwd(), 'data.json')
    // const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

    const realData = await fetchRealPropertyDetails(address, postcode)
    
    return NextResponse.json(realData)
  } catch (error) {
    console.error('Error fetching property data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property data' },
      { status: 500 }
    )
  }
}


async function fetchRealPropertyDetails(address: string, postcode: string): Promise<any> {
  const response = await fetch('https://api.data.street.co.uk/street-data-api/v2/properties/addresses?tier=premium', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${process.env.STREET_API_KEY}`,
      },
      body: JSON.stringify({
          data: {
              address: address,
              postcode: postcode
          }
      }),
  });

  if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}