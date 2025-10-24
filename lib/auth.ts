import { NextRequest } from 'next/server'
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { query } from './db/client'

export async function getServerSession() {
  return await nextAuthGetServerSession()
}

export async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return null
    }
    
    // Get user_id from database using email
    const result = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [session.user.email]
    )
    
    return result.rows[0]?.user_id || null
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserId(request)
  if (!userId) {
    throw new Error('Authentication required')
  }
  return userId
}

export async function getUserByEmail(email: string) {
  try {
    const result = await query(
      'SELECT user_id, google_id, email, name, profile_picture FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}
