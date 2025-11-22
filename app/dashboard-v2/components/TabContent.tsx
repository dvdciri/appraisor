'use client'

import { useState, useEffect } from 'react'
import PropertySearch from './PropertySearch'

interface TabContentProps {
  propertyUPRN?: string | null
  propertyData?: any // Cached property data from parent
  onPropertySelected?: (uprn: string, address: string) => void
}

export default function TabContent({ propertyUPRN, propertyData, onPropertySelected }: TabContentProps) {
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // If propertyUPRN is null/undefined, show search
  // If propertyUPRN has value, show property view
  const isSearchMode = !propertyUPRN

  // Extract address from cached property data or fetch if not available
  useEffect(() => {
    if (propertyUPRN) {
      if (propertyData) {
        // Use cached data - no need to fetch
        const address = propertyData?.data?.data?.attributes?.address?.street_group_format?.address_lines || null
        setPropertyAddress(address)
        setLoading(false)
      } else {
        // Fallback: fetch if cache is not available (shouldn't happen normally)
        setLoading(true)
        const fetchPropertyAddress = async () => {
          try {
            const response = await fetch(`/api/properties/${encodeURIComponent(propertyUPRN)}`)
            if (response.ok) {
              const responseData = await response.json()
              const address = responseData?.data?.data?.attributes?.address?.street_group_format?.address_lines || null
              setPropertyAddress(address)
            } else {
              console.error('Failed to fetch property:', response.status, response.statusText)
              setPropertyAddress(null)
            }
          } catch (error) {
            console.error('Error fetching property address:', error)
            setPropertyAddress(null)
          } finally {
            setLoading(false)
          }
        }
        fetchPropertyAddress()
      }
    } else {
      setPropertyAddress(null)
      setLoading(false)
    }
  }, [propertyUPRN, propertyData])

  return (
    <div className="h-full flex items-start justify-center p-8 overflow-y-auto">
      {isSearchMode ? (
        <PropertySearch onPropertySelected={onPropertySelected} />
      ) : (
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 opacity-50">🏠</div>
          <h2 className="text-2xl font-bold text-white mb-3">Property</h2>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          ) : propertyAddress ? (
            <p className="text-white text-lg font-medium">
              {propertyAddress}
            </p>
          ) : (
            <p className="text-gray-400 text-sm">
              Address not available
            </p>
          )}
        </div>
      )}
    </div>
  )
}

