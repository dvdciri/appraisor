'use client'

import { useState, useEffect } from 'react'

interface SidebarProps {
  propertyUPRN?: string | null
  propertyData?: any // Cached property data from parent
}

export default function Sidebar({ propertyUPRN, propertyData }: SidebarProps) {
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
              console.error('Failed to fetch property (Sidebar):', response.status, response.statusText)
              setPropertyAddress(null)
            }
          } catch (error) {
            console.error('Error fetching property address (Sidebar):', error)
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
    <aside className="flex-shrink-0 w-[25%] min-h-0 flex flex-col">
      <div className="h-full flex flex-col">
        <div className="h-full rounded-2xl shadow-2xl backdrop-blur-xl border border-gray-500/30 bg-black/20 p-6 overflow-y-auto hide-scrollbar">
          {propertyUPRN ? (
            <div className="h-full flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-bg-subtle border-t-accent mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading...</p>
                  </div>
                </div>
              ) : propertyAddress ? (
                <div className="text-center">
                  <div className="text-4xl mb-4 opacity-50">🏠</div>
                  <p className="text-white text-sm font-medium break-words">
                    {propertyAddress}
                  </p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4 opacity-50">🏠</div>
                    <p className="text-gray-400 text-sm">Property</p>
                    <p className="text-gray-500 text-xs mt-2">Address not available</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4 opacity-50">📋</div>
                <p className="text-gray-400 text-sm">Sidebar</p>
                <p className="text-gray-500 text-xs mt-2">Placeholder for future content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

