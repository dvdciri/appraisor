'use client'

import { useEffect } from 'react'

export default function DatabaseInitializer() {
  useEffect(() => {
    // Initialize database on app startup via API call
    const initializeDatabase = async () => {
      try {
        // Call the database initialization API endpoint
        const response = await fetch('/api/db/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          console.log('Database initialized successfully on startup')
        } else {
          const errorData = await response.json()
          console.error('Database initialization failed on startup:', errorData)
        }
      } catch (error) {
        console.error('Database initialization error on startup:', error)
      }
    }

    // Initialize database automatically on every app startup
    initializeDatabase()
  }, [])

  return null // This component doesn't render anything
}
