'use client'

import { useState } from 'react'

interface StreetViewImageProps {
  latitude: number
  longitude: number
  address: string
  className?: string
}

export default function StreetViewImage({ latitude, longitude, address, className = '' }: StreetViewImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Get API key from environment variable (must be set)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured')
    return (
      <div className={`bg-gray-700 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-1">🏠</div>
          <div className="text-xs">Preview not available</div>
        </div>
      </div>
    )
  }
  
  // Google Street View Static API URL (matching PropertyDetails parameters)
  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x250&location=${latitude},${longitude}&fov=80&pitch=0&key=${apiKey}`

  if (imageError) {
    return (
      <div className={`bg-gray-700 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-1">🏠</div>
          <div className="text-xs">No street view</div>
        </div>
      </div>
    )
  }

  // Determine if we should use rounded corners (default true, unless className includes rounded-none)
  const useRoundedCorners = !className.includes('rounded-none')
  const imageRoundedClass = useRoundedCorners ? 'rounded-lg' : 'rounded-none'

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className={`absolute inset-0 bg-gray-700 ${imageRoundedClass} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={streetViewUrl}
        alt={`Street view of ${address}`}
        className={`w-full h-full object-cover ${imageRoundedClass}`}
        onLoad={() => setImageLoading(false)}
        onError={(e) => {
          setImageError(true)
          setImageLoading(false)
          // Set a fallback image like in PropertyDetails
          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCOUIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+U3RyZWV0IFZpZXc8L3RleHQ+Cjwvc3ZnPg=='
        }}
      />
    </div>
  )
}
