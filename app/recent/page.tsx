'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import StreetViewImage from '../components/StreetViewImage'

interface PropertyData {
  data: {
    attributes: {
      address: {
        street_group_format: {
          address_lines: string
          postcode: string
        }
      }
      tenure: {
        tenure_type: string
      }
      number_of_bedrooms: {
        value: number
      }
      number_of_bathrooms: {
        value: number
      }
      internal_area_square_metres: number
      energy_performance: {
        energy_efficiency: {
          current_rating: string
        }
      }
      location?: {
        coordinates?: {
          latitude: number
          longitude: number
        }
      }
      estimated_values?: Array<{
        estimated_market_value_rounded: number
      }>
      property_type?: {
        value: string
      }
      [key: string]: any
    }
  }
}

interface RecentAnalysis {
  id: string
  searchDate: string
  comparables: string[]
  filters: {
    propertyType: string
    minBeds: string
    maxBeds: string
    minBaths: string
    maxBaths: string
  }
}

// Component to display a single property in the recent list
function RecentPropertyItem({ analysis, index, onClick }: { analysis: RecentAnalysis, index: number, onClick: () => void }) {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)

  useEffect(() => {
    // Load property data from store
    try {
      const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
      const data = propertyDataStore[analysis.id]
      if (data) {
        setPropertyData(data)
      }
    } catch (e) {
      console.error('Failed to load property data for list item:', e)
    }
  }, [analysis.id])

  if (!propertyData) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 animate-pulse">
        <div className="h-16 bg-gray-600 rounded"></div>
      </div>
    )
  }

  const attributes = propertyData.data.attributes
  const address = attributes.address.street_group_format.address_lines
  const postcode = attributes.address.street_group_format.postcode
  const propertyType = attributes.property_type?.value || 'Unknown'
  const bedrooms = attributes.number_of_bedrooms?.value || 0
  const bathrooms = attributes.number_of_bathrooms?.value || 0
  const estimatedValue = attributes.estimated_values?.[0]?.estimated_market_value_rounded || 0
  const latitude = attributes.location?.coordinates?.latitude || 0
  const longitude = attributes.location?.coordinates?.longitude || 0

  return (
    <div
      onClick={onClick}
      className={`bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-colors border border-gray-600 hover:border-gray-500 ${
        index === 0 ? 'animate-enter-subtle-delayed-2' : 
        index === 1 ? 'animate-enter-subtle-delayed-3' : 
        'animate-enter-subtle-delayed-3'
      }`}
      style={{ animationDelay: `${0.4 + index * 0.1}s` }}
    >
      <div className="flex items-center gap-4">
        {/* Street View Image */}
        <div className="flex-shrink-0">
          <StreetViewImage
            latitude={latitude}
            longitude={longitude}
            address={address}
            className="w-20 h-16"
          />
        </div>
        
        {/* Property Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-white font-semibold text-sm truncate" title={address}>
              {address}
            </h3>
            <span className="text-gray-400 text-xs whitespace-nowrap">
              {postcode}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{propertyType}</span>
            <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
            <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
            <span className="text-green-400 font-medium">£{estimatedValue.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Date */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {new Date(analysis.searchDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function RecentPage() {
  const router = useRouter()
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])

  // Load recent analyses on mount
  useEffect(() => {
    try {
      const savedAnalyses = typeof window !== 'undefined' ? localStorage.getItem('recentAnalyses') : null
      if (savedAnalyses) {
        const analyses = JSON.parse(savedAnalyses)
        setRecentAnalyses(analyses)
      }
    } catch (e) {
      console.error('Failed to restore recent analyses', e)
    }
  }, [])

  const loadRecentAnalysis = (analysis: RecentAnalysis) => {
    console.log('Loading analysis:', analysis.id, 'with comparables:', analysis.comparables)
    router.push(`/details/${analysis.id}?ref=recent`)
  }

  const clearRecentAnalyses = () => {
    setRecentAnalyses([])
    try {
      localStorage.removeItem('recentAnalyses')
      localStorage.removeItem('propertyDataStore')
    } catch (e) {
      console.error('Failed to clear recent analyses', e)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Header 
        showBackButton={true}
        onBackClick={() => router.push('/')}
        backButtonText="Back to Home"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Page Title */}
            <div className="animate-enter-subtle">
              <h1 className="text-3xl font-bold text-white mb-2">Recent Properties</h1>
              <p className="text-gray-400">View your recently searched properties</p>
            </div>

            {/* Recent Properties List */}
            {recentAnalyses.length > 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 animate-enter-subtle-delayed">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    {recentAnalyses.length} {recentAnalyses.length === 1 ? 'Property' : 'Properties'}
                  </h2>
                  <button
                    onClick={clearRecentAnalyses}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2">
                  {recentAnalyses.map((analysis, index) => (
                    <RecentPropertyItem
                      key={analysis.id}
                      analysis={analysis}
                      index={index}
                      onClick={() => loadRecentAnalysis(analysis)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center animate-enter-subtle-delayed">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Recent Properties</h3>
                    <p className="text-gray-400 mb-6">Search for a property to get started</p>
                    <button
                      onClick={() => router.push('/')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Search Properties
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

