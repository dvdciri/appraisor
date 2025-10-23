import { NextRequest, NextResponse } from 'next/server'
import { ensureAppReady } from '@/lib/db/startup'

export async function POST(request: NextRequest) {
  try {
    await ensureAppReady()
    return NextResponse.json({ success: true, message: 'Application ready' }, { status: 200 })
  } catch (error) {
    console.error('Error ensuring app is ready:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to ensure application is ready',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAppReady()
    return NextResponse.json({ success: true, message: 'Application ready' }, { status: 200 })
  } catch (error) {
    console.error('Error ensuring app is ready:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to ensure application is ready',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
