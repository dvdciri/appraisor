'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import StreetViewImage from './StreetViewImage'
import GenericPanel from './GenericPanel'

// Types
interface ComparableTransaction {
  street_group_property_id: string
  address: {
    street_group_format: {
      address_lines: string
      postcode: string
    }
    simplified_format: {
      street: string
    }
  }
  property_type: string
  transaction_date: string
  price: number
  internal_area_square_metres: number
  price_per_square_metre: number
  number_of_bedrooms: number
  number_of_bathrooms: number
  location: {
    coordinates: {
      longitude: number
      latitude: number
    }
  }
  distance_in_metres: number
}

interface Filters {
  bedrooms: string
  bathrooms: string
  transactionDate: string
  propertyType: string
  distance: string
}

interface ComparablesData {
  uprn: string
  selected_comparable_ids: string[]
  valuation_strategy: 'average' | 'price_per_sqm'
  calculated_valuation: number | null
}

interface ComparablesAnalysisProps {
  uprn: string
  nearbyTransactions: ComparableTransaction[]
  subjectPropertySqm: number
  subjectPropertyStreet: string
  subjectPropertyData?: {
    address?: string
    postcode?: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    internalArea?: number
  }
  onTransactionSelect?: (transaction: ComparableTransaction) => void
  onSelectedCountChange?: (count: number) => void
  onSelectedPanelOpen?: (isOpen: boolean) => void
  onSelectedTransactionsChange?: (transactions: ComparableTransaction[]) => void
  onRemoveComparable?: (transactionId: string) => void
  selectedPanelOpen?: boolean
}

// Loading Skeleton Component
const TransactionCardSkeleton = () => (
  <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4 animate-pulse">
    <div className="flex gap-4">
      {/* Image skeleton */}
      <div className="flex-shrink-0">
        <div className="w-20 h-20 bg-gray-700 rounded-lg"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="h-3 bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-700 rounded w-16"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
          </div>
          <div className="text-right">
            <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      </div>

      {/* Button skeleton */}
      <div className="flex-shrink-0 flex items-center">
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
)

// Helper component for detail rows
const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-500/40 last:border-0">
    <span className="text-gray-400">{label}</span>
    <span className="text-gray-100 font-medium">{value || 'N/A'}</span>
  </div>
)

// Helper function to get street view embed URL
const getStreetViewEmbedUrl = (latitude?: number, longitude?: number) => {
  if (!latitude || !longitude) return ''
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  // Use the correct Street View embed URL format
  return `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=0&pitch=0&fov=90`
}

// Export function to render transaction details
export const renderTransactionDetails = (transaction: ComparableTransaction) => (
  <div className="space-y-6">
    {/* Main Information Chips */}
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Property Details</h4>
      <div className="flex flex-wrap gap-4">
        {transaction.address?.street_group_format?.address_lines && (
          <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-3 w-full">
            <span className="text-gray-400 text-sm">Address:</span>
            <span className="text-gray-100 font-semibold text-base">{transaction.address.street_group_format.address_lines}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          {transaction.address?.street_group_format?.postcode && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Postcode:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.address.street_group_format.postcode}</span>
            </div>
          )}
          {transaction.property_type && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Type:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.property_type}</span>
            </div>
          )}
          {transaction.number_of_bedrooms !== undefined && transaction.number_of_bedrooms !== null && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Beds:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.number_of_bedrooms}</span>
            </div>
          )}
          {transaction.number_of_bathrooms !== undefined && transaction.number_of_bathrooms !== null && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Baths:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.number_of_bathrooms}</span>
            </div>
          )}
          {transaction.internal_area_square_metres && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Area:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.internal_area_square_metres}m²</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Street View Map */}
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-500/30">
      <iframe
        src={getStreetViewEmbedUrl(transaction.location?.coordinates?.latitude, transaction.location?.coordinates?.longitude)}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>

    {/* Transaction Details Section */}
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Transaction Details</h4>
      <div className="space-y-3">
        <DetailRow label="Sale Price" value={formatCurrency(transaction.price)} />
        <DetailRow label="Price per m²" value={`£${transaction.price_per_square_metre?.toLocaleString()}`} />
        <DetailRow label="Transaction Date" value={formatDate(transaction.transaction_date)} />
        <DetailRow label="Distance" value={getDistanceLabel(transaction.distance_in_metres)} />
      </div>
    </div>
  </div>
)

// Filter Options
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+']
const BATHROOM_OPTIONS = ['Any', '1', '2', '3', '4+']
const DATE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: '730', label: 'Last 2 years' },
  { value: '1095', label: 'Last 3 years' }
]
const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'same_street', label: 'Same street' },
  { value: 'quarter_mile', label: '1/4 mile' },
  { value: 'half_mile', label: '1/2 mile' },
  { value: 'one_mile', label: '1 mile' }
]
const SORT_OPTIONS = [
  { label: 'Highest price first', value: 'price-high' },
  { label: 'Lowest price first', value: 'price-low' },
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Closest first', value: 'closest' }
]

// Utility Functions
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '£0'
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getDistanceLabel = (distance: number | null | undefined) => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return '0m'
  }
  if (distance < 100) return `${distance}m`
  return `${(distance / 1000).toFixed(1)}km`
}

const isTransactionInDateRange = (transactionDate: string, daysBack: number) => {
  if (daysBack === 0) return true
  
  // Parse the transaction date (format: YYYY-MM-DD)
  const transaction = new Date(transactionDate + 'T00:00:00.000Z') // Ensure UTC parsing
  const now = new Date()
  const cutoff = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
  
  // Set time to start of day for accurate comparison
  cutoff.setHours(0, 0, 0, 0)
  transaction.setHours(0, 0, 0, 0)
  
  // Exclude future dates (transactions should not be in the future)
  if (transaction > now) {
    return false
  }
  
  const isInRange = transaction >= cutoff
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Date filter debug:', {
      transactionDate,
      daysBack,
      transaction: transaction.toISOString().split('T')[0],
      cutoff: cutoff.toISOString().split('T')[0],
      now: now.toISOString().split('T')[0],
      isInRange,
      isFuture: transaction > now
    })
  }
  
  return isInRange
}

const isTransactionInDistanceRange = (distance: number, filter: string) => {
  switch (filter) {
    case 'quarter_mile': return distance <= 402 // 1/4 mile in meters
    case 'half_mile': return distance <= 805 // 1/2 mile in meters
    case 'one_mile': return distance <= 1609 // 1 mile in meters
    default: return true
  }
}

// Transaction Card Component
function TransactionCard({ 
  transaction, 
  isSelected, 
  onSelect, 
  onDeselect,
  onViewDetails,
  dragProps 
}: {
  transaction: ComparableTransaction
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onViewDetails: () => void
  dragProps?: any
}) {
  return (
    <div
      {...dragProps}
      onClick={onViewDetails}
      className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-700/40 hover:border-gray-500/50 ${
        isSelected
          ? 'bg-purple-500/20 border-purple-400/50 shadow-lg'
          : 'bg-gray-800/30 border-gray-600/30'
      }`}
    >
      <div className="flex gap-4">
        {/* Street View Image - Left Side */}
        <div className="flex-shrink-0 relative">
          <StreetViewImage
            address={transaction.address?.street_group_format?.address_lines || ''}
            postcode={transaction.address?.street_group_format?.postcode || ''}
            latitude={transaction.location?.coordinates?.latitude}
            longitude={transaction.location?.coordinates?.longitude}
            className="w-20 h-20 object-cover rounded-lg"
            size="150x150"
          />
          {isSelected && (
            <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Property Details - Middle */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-100 mb-1">
                {transaction.address?.street_group_format?.address_lines || 'Address not available'}
              </h4>
              <p className="text-xs text-gray-400">
                {transaction.address?.street_group_format?.postcode || 'Postcode not available'}
              </p>
            </div>
            <div className="text-right ml-4">
              <div className="text-lg font-bold text-white">
                {formatCurrency(transaction.price)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div className="flex gap-4">
              <span>{transaction.number_of_bedrooms || 0} bed</span>
              <span>{transaction.number_of_bathrooms || 0} bath</span>
              <span>{transaction.property_type || 'Unknown'}</span>
              <span>{transaction.internal_area_square_metres || 0}m²</span>
            </div>
            <div className="text-right">
              <div>{formatDate(transaction.transaction_date)}</div>
              <div>{getDistanceLabel(transaction.distance_in_metres)}</div>
            </div>
          </div>
        </div>

        {/* Action Button - Right Side */}
        <div className="flex-shrink-0 flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              isSelected ? onDeselect() : onSelect()
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm ${
              isSelected 
                ? 'bg-red-500/80 text-white hover:bg-red-400/80' 
                : 'bg-green-500/80 text-white hover:bg-green-400/80'
            }`}
            title={isSelected ? 'Remove from comparables' : 'Add to comparables'}
          >
            {isSelected ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Filter Controls Component
function FilterControls({ 
  filters, 
  onFiltersChange, 
  propertyTypes,
  totalCount,
  filteredCount
}: {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  propertyTypes: string[]
  totalCount: number
  filteredCount: number
}) {
  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-black/20 border border-gray-500/30 rounded-xl p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-200">Filters</h3>
        <button
          onClick={() => onFiltersChange({
            bedrooms: 'Any',
            bathrooms: 'Any',
            transactionDate: 'any',
            propertyType: 'Any',
            distance: 'any'
          })}
          className="px-3 py-1 bg-gray-600/50 hover:bg-gray-600 text-white rounded-md text-xs font-medium transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Distance</label>
          <div className="relative">
            <select
              value={filters.distance}
              onChange={(e) => updateFilter('distance', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {DISTANCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Bedrooms</label>
          <div className="relative">
            <select
              value={filters.bedrooms}
              onChange={(e) => updateFilter('bedrooms', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {BEDROOM_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Bathrooms</label>
          <div className="relative">
            <select
              value={filters.bathrooms}
              onChange={(e) => updateFilter('bathrooms', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {BATHROOM_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Property Type</label>
          <div className="relative">
            <select
              value={filters.propertyType}
              onChange={(e) => updateFilter('propertyType', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              <option value="Any">Any</option>
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Transaction Date</label>
          <div className="relative">
            <select
              value={filters.transactionDate}
              onChange={(e) => updateFilter('transactionDate', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {DATE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}


// Valuation Display Component
function ValuationDisplay({ 
  valuation, 
  strategy, 
  onStrategyChange, 
  selectedCount,
  isLoading = false,
  onOpenSelectedPanel,
  subjectPropertyData,
  hasLoadedInitialData
}: {
  valuation: number | null
  strategy: 'average' | 'price_per_sqm'
  onStrategyChange: (strategy: 'average' | 'price_per_sqm') => void
  selectedCount: number
  isLoading?: boolean
  onOpenSelectedPanel?: () => void
  subjectPropertyData?: ComparablesAnalysisProps['subjectPropertyData']
  hasLoadedInitialData: boolean
}) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Trigger animation when selectedCount changes
  useEffect(() => {
    if (selectedCount > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [selectedCount])
  return (
    <div className="flex gap-6 mb-6">
      {/* Left half - Property Info Box */}
      <div className="flex-1 bg-black/20 border border-gray-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Your Property</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4">
            {subjectPropertyData?.address && (
              <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs">Address:</span>
                <span className="text-gray-100 font-medium text-sm">{subjectPropertyData.address}</span>
              </div>
            )}
            {subjectPropertyData?.propertyType && (
              <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs">Type:</span>
                <span className="text-gray-100 font-medium text-sm">{subjectPropertyData.propertyType}</span>
              </div>
            )}
            {subjectPropertyData?.bedrooms !== undefined && (
              <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs">Beds:</span>
                <span className="text-gray-100 font-medium text-sm">{subjectPropertyData.bedrooms}</span>
              </div>
            )}
            {subjectPropertyData?.bathrooms !== undefined && (
              <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs">Baths:</span>
                <span className="text-gray-100 font-medium text-sm">{subjectPropertyData.bathrooms}</span>
              </div>
            )}
            {subjectPropertyData?.internalArea && (
              <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs">Area:</span>
                <span className="text-gray-100 font-medium text-sm">{subjectPropertyData.internalArea}m²</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right half - Valuation Box */}
      <div className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 flex flex-col">
        <div className="mb-4">
          <div className="bg-black/20 border border-gray-600 rounded-md p-0.5 flex w-fit">
            <button
              onClick={() => onStrategyChange('average')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                strategy === 'average'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Simple Average
            </button>
            <button
              onClick={() => onStrategyChange('price_per_sqm')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                strategy === 'price_per_sqm'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Price per SQM
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          {/* Valuation */}
          <div className="flex-1">
            {isLoading ? (
              <>
                <div className="h-12 bg-gray-700/30 rounded mb-2 animate-pulse w-48"></div>
                <div className="h-4 bg-gray-700/30 rounded w-64 animate-pulse"></div>
              </>
            ) : valuation !== null && selectedCount > 0 ? (
              <>
                <div className="text-4xl font-bold text-white mb-1">
                  {formatCurrency(valuation)}
                </div>
                <div className="text-sm text-gray-300">
                  Based on {selectedCount} comparable{selectedCount !== 1 ? 's' : ''} using {strategy === 'average' ? 'simple average' : 'price per square metre'}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl text-gray-400 mb-1">No valuation available</div>
                <div className="text-sm text-gray-500">
                  Select comparables to calculate valuation
                </div>
              </>
            )}
          </div>

          {/* Selected Comparables Button - Aligned to bottom */}
          {!hasLoadedInitialData ? (
            // Button Skeleton
            <div className="mt-auto pt-4">
              <div className="bg-gray-700/30 rounded-lg px-4 py-2 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-600/30 rounded w-32"></div>
                  <div className="w-4 h-4 bg-gray-600/30 rounded"></div>
                </div>
              </div>
            </div>
          ) : selectedCount > 0 ? (
            <div className="mt-auto pt-4">
              <button
                onClick={() => {
                  if (onOpenSelectedPanel) {
                    onOpenSelectedPanel()
                  }
                }}
                className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 text-sm font-medium ${
                  isAnimating ? 'animate-pulse' : ''
                }`}
                style={{
                  animation: isAnimating ? 'buttonPulse 0.6s ease-in-out' : 'none'
                }}
              >
                <div className="flex items-center gap-2">
                  <span>View {selectedCount} selected comparables</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function ComparablesAnalysis({ 
  uprn, 
  nearbyTransactions, 
  subjectPropertySqm,
  subjectPropertyStreet,
  subjectPropertyData,
  onTransactionSelect,
  onSelectedCountChange,
  onSelectedPanelOpen,
  onSelectedTransactionsChange,
  onRemoveComparable,
  selectedPanelOpen = false
}: ComparablesAnalysisProps) {
  // State
  const [selectedComparableIds, setSelectedComparableIds] = useState<string[]>([])
  const [valuationStrategy, setValuationStrategy] = useState<'average' | 'price_per_sqm'>('average')
  const [filters, setFilters] = useState<Filters>({
    bedrooms: 'Any',
    bathrooms: 'Any',
    transactionDate: 'any',
    propertyType: 'Any',
    distance: 'any'
  })
  const [sortBy, setSortBy] = useState<string>('newest')
  const [savedData, setSavedData] = useState<ComparablesData | null>(null)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)
  const [isLoadingValuation, setIsLoadingValuation] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Deduplicate transactions - keep only most recent per property
  const deduplicatedTransactions = useMemo(() => {
    const transactionMap = new Map<string, ComparableTransaction>()
    
    nearbyTransactions.forEach(transaction => {
      const id = transaction.street_group_property_id
      const existing = transactionMap.get(id)
      
      if (!existing) {
        transactionMap.set(id, transaction)
      } else {
        // Keep the most recent transaction
        const existingDate = new Date(existing.transaction_date + 'T00:00:00.000Z')
        const currentDate = new Date(transaction.transaction_date + 'T00:00:00.000Z')
        
        if (currentDate > existingDate) {
          transactionMap.set(id, transaction)
        }
      }
    })
    
    return Array.from(transactionMap.values())
  }, [nearbyTransactions])

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      setIsLoadingValuation(true)
      try {
        const response = await fetch(`/api/db/comparables?uprn=${uprn}`)
        if (response.ok) {
          const data = await response.json()
          setSavedData(data)
          setSelectedComparableIds(data.selected_comparable_ids || [])
          setValuationStrategy(data.valuation_strategy || 'average')
        }
        // Mark that we've loaded initial data, regardless of whether we got data or not
        setHasLoadedInitialData(true)
      } catch (error) {
        console.error('Error loading saved comparables data:', error)
        // Still mark as loaded even if there was an error
        setHasLoadedInitialData(true)
      } finally {
        setIsLoadingValuation(false)
      }
    }
    
    loadSavedData()
  }, [uprn])

  // Notify parent when selected count changes
  useEffect(() => {
    if (onSelectedCountChange) {
      onSelectedCountChange(selectedComparableIds.length)
    }
  }, [selectedComparableIds.length, onSelectedCountChange])

  // Notify parent when selected transactions change
  useEffect(() => {
    if (onSelectedTransactionsChange) {
      const selectedTransactions = deduplicatedTransactions.filter(t => 
        selectedComparableIds.includes(t.street_group_property_id)
      )
      onSelectedTransactionsChange(selectedTransactions)
    }
  }, [selectedComparableIds, deduplicatedTransactions, onSelectedTransactionsChange])

  // Show loading when valuation strategy or selected comparables change
  useEffect(() => {
    if (hasLoadedInitialData && selectedComparableIds.length > 0) {
      setIsLoadingValuation(true)
      const timer = setTimeout(() => {
        setIsLoadingValuation(false)
      }, 500) // Short delay to show loading state
      return () => clearTimeout(timer)
    }
  }, [valuationStrategy, selectedComparableIds, hasLoadedInitialData])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const filtered = deduplicatedTransactions.filter(transaction => {
      // Bedrooms filter
      if (filters.bedrooms !== 'Any') {
        const transactionBeds = transaction.number_of_bedrooms || 0
        const filterBeds = filters.bedrooms === '5+' ? 5 : parseInt(filters.bedrooms)
        
        if (filters.bedrooms === '5+') {
          if (transactionBeds < 5) return false
        } else {
          if (transactionBeds !== filterBeds) return false
        }
      }

      // Bathrooms filter
      if (filters.bathrooms !== 'Any') {
        const transactionBaths = transaction.number_of_bathrooms || 0
        const filterBaths = filters.bathrooms === '4+' ? 4 : parseInt(filters.bathrooms)
        
        if (filters.bathrooms === '4+') {
          if (transactionBaths < 4) return false
        } else {
          if (transactionBaths !== filterBaths) return false
        }
      }

      // Date filter
      if (filters.transactionDate !== 'any') {
        const daysBack = parseInt(filters.transactionDate)
        if (!isTransactionInDateRange(transaction.transaction_date, daysBack)) return false
      }

      // Property type filter
      if (filters.propertyType !== 'Any') {
        const transactionType = transaction.property_type || 'Unknown'
        if (transactionType !== filters.propertyType) {
          return false
        }
      }

      // Distance filter
      if (filters.distance !== 'any') {
        if (filters.distance === 'same_street') {
          const transactionStreet = transaction.address?.simplified_format?.street || ''
          if (transactionStreet !== subjectPropertyStreet) {
            return false
          }
        } else {
          const distance = transaction.distance_in_metres || 0
          if (!isTransactionInDistanceRange(distance, filters.distance)) {
            return false
          }
        }
      }

      return true
    })

    // Sort based on selected sort option
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'newest':
          const dateA = new Date(a.transaction_date + 'T00:00:00.000Z')
          const dateB = new Date(b.transaction_date + 'T00:00:00.000Z')
          return dateB.getTime() - dateA.getTime()
        case 'oldest':
          const dateAOld = new Date(a.transaction_date + 'T00:00:00.000Z')
          const dateBOld = new Date(b.transaction_date + 'T00:00:00.000Z')
          return dateAOld.getTime() - dateBOld.getTime()
        case 'closest':
          return (a.distance_in_metres || 0) - (b.distance_in_metres || 0)
        default:
          return 0
      }
    })
  }, [deduplicatedTransactions, filters, subjectPropertyStreet, sortBy])

  // Get unique property types for filter
  const propertyTypes = useMemo(() => {
    return Array.from(new Set(deduplicatedTransactions.map(t => t.property_type || 'Unknown'))).sort()
  }, [deduplicatedTransactions])

  // Calculate valuation
  const calculatedValuation = useMemo(() => {
    if (selectedComparableIds.length === 0) return null

    const selectedTransactions = deduplicatedTransactions.filter(t => 
      selectedComparableIds.includes(t.street_group_property_id)
    )

    if (selectedTransactions.length === 0) return null

    if (valuationStrategy === 'average') {
      const totalPrice = selectedTransactions.reduce((sum, t) => sum + (t.price || 0), 0)
      return totalPrice / selectedTransactions.length
    } else {
      // Price per sqm strategy
      if (subjectPropertySqm <= 0) return null
      
      const validTransactions = selectedTransactions.filter(t => t.price_per_square_metre && t.price_per_square_metre > 0)
      if (validTransactions.length === 0) return null
      
      const totalPricePerSqm = validTransactions.reduce((sum, t) => sum + (t.price_per_square_metre || 0), 0)
      const avgPricePerSqm = totalPricePerSqm / validTransactions.length
      return avgPricePerSqm * subjectPropertySqm
    }
  }, [selectedComparableIds, deduplicatedTransactions, valuationStrategy, subjectPropertySqm])

  // Save data with debouncing - only save when user makes changes, not on initial load
  useEffect(() => {
    const saveData = async () => {
      if (!hasLoadedInitialData || !hasUserInteracted) return // Don't save until we've loaded initial data AND user has interacted
      
      try {
        console.log('Saving comparables data:', {
          uprn,
          selected_comparable_ids: selectedComparableIds,
          valuation_strategy: valuationStrategy
        })
        
        const response = await fetch('/api/db/comparables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uprn,
            selected_comparable_ids: selectedComparableIds,
            valuation_strategy: valuationStrategy,
            calculated_valuation: calculatedValuation
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Successfully saved comparables data:', data)
          setSavedData(data)
        } else {
          console.error('Failed to save comparables data:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error saving comparables data:', error)
      }
    }

    const timeoutId = setTimeout(saveData, 1000) // Debounce to 1 second
    return () => clearTimeout(timeoutId)
  }, [uprn, selectedComparableIds, valuationStrategy, hasLoadedInitialData, hasUserInteracted, calculatedValuation])

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Comparables Debug:', {
        totalTransactions: nearbyTransactions.length,
        deduplicatedCount: deduplicatedTransactions.length,
        duplicatesRemoved: nearbyTransactions.length - deduplicatedTransactions.length,
        filteredCount: filteredTransactions.length,
        selectedCount: selectedComparableIds.length
      })
    }
  }, [nearbyTransactions, deduplicatedTransactions, filteredTransactions, selectedComparableIds])

  // Handlers
  const handleSelectComparable = useCallback((id: string) => {
    setSelectedComparableIds(prev => [...prev, id])
    setHasUserInteracted(true)
  }, [])

  const handleDeselectComparable = useCallback((id: string) => {
    setSelectedComparableIds(prev => prev.filter(selectedId => selectedId !== id))
    setHasUserInteracted(true)
    // Call the parent callback to remove from selected transactions
    if (onRemoveComparable) {
      onRemoveComparable(id)
    }
  }, [onRemoveComparable])

  const handleStrategyChange = useCallback((strategy: 'average' | 'price_per_sqm') => {
    setValuationStrategy(strategy)
    setHasUserInteracted(true)
  }, [])

  const handleViewDetails = useCallback((transaction: ComparableTransaction) => {
    if (onTransactionSelect) {
      onTransactionSelect(transaction)
    }
  }, [onTransactionSelect])


  const handleCloseSelectedPanel = useCallback(() => {
    if (onSelectedPanelOpen) {
      onSelectedPanelOpen(false)
    }
  }, [onSelectedPanelOpen])

  const handleClearAllSelected = useCallback(() => {
    setSelectedComparableIds([])
  }, [])



  // Get selected and available transactions
  const availableTransactions = filteredTransactions.filter(t => 
    !selectedComparableIds.includes(t.street_group_property_id)
  )
  const selectedTransactions = deduplicatedTransactions
    .filter(t => selectedComparableIds.includes(t.street_group_property_id))
    .sort((a, b) => {
      const dateA = new Date(a.transaction_date + 'T00:00:00.000Z')
      const dateB = new Date(b.transaction_date + 'T00:00:00.000Z')
      return dateB.getTime() - dateA.getTime() // Most recent first
    })

  // Show loading state
  if (!nearbyTransactions || nearbyTransactions.length === 0) {
    return (
      <>
        {/* Valuation Hero Section */}
        <ValuationDisplay
          valuation={null}
          strategy={valuationStrategy}
          onStrategyChange={handleStrategyChange}
          selectedCount={0}
          isLoading={true}
          onOpenSelectedPanel={() => {
            if (onSelectedPanelOpen) {
              onSelectedPanelOpen(true)
            }
          }}
          subjectPropertyData={subjectPropertyData}
          hasLoadedInitialData={hasLoadedInitialData}
        />

        {/* Two-Column Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-72 flex-shrink-0">
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              propertyTypes={propertyTypes}
              totalCount={0}
              filteredCount={0}
            />
          </div>

          {/* Right Content - Loading Skeletons */}
          <div className="flex-1 min-w-0">
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TransactionCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Show empty state
  if (deduplicatedTransactions.length === 0) {
    return (
      <>
        {/* Valuation Hero Section */}
        <ValuationDisplay
          valuation={null}
          strategy={valuationStrategy}
          onStrategyChange={handleStrategyChange}
          selectedCount={0}
          isLoading={false}
          onOpenSelectedPanel={() => {
            if (onSelectedPanelOpen) {
              onSelectedPanelOpen(true)
            }
          }}
          subjectPropertyData={subjectPropertyData}
          hasLoadedInitialData={hasLoadedInitialData}
        />

        {/* Two-Column Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-72 flex-shrink-0">
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              propertyTypes={propertyTypes}
              totalCount={0}
              filteredCount={0}
            />
          </div>

          {/* Right Content - Empty State */}
          <div className="flex-1 min-w-0">
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6">
              <div className="text-center py-12">
                <div className="text-4xl mb-4 opacity-50">🏘️</div>
                <h3 className="text-xl font-semibold text-gray-200 mb-3">No Nearby Transactions</h3>
                <p className="text-gray-400">No comparable transactions found for this property.</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
        {/* Valuation Hero Section */}
        <ValuationDisplay
          valuation={calculatedValuation}
          strategy={valuationStrategy}
          onStrategyChange={handleStrategyChange}
          selectedCount={selectedComparableIds.length}
          isLoading={isLoadingValuation}
          onOpenSelectedPanel={() => {
            if (onSelectedPanelOpen) {
              onSelectedPanelOpen(true)
            }
          }}
          subjectPropertyData={subjectPropertyData}
          hasLoadedInitialData={hasLoadedInitialData}
        />

      {/* Two-Column Layout */}
      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-72 flex-shrink-0">
          {!hasLoadedInitialData ? (
            // Filters Skeleton
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4">
              <div className="space-y-4">
                <div className="h-5 bg-gray-700/30 rounded w-20 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700/30 rounded w-16 animate-pulse"></div>
                  <div className="h-8 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700/30 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700/30 rounded w-24 animate-pulse"></div>
                  <div className="h-8 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700/30 rounded w-18 animate-pulse"></div>
                  <div className="h-8 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              propertyTypes={propertyTypes}
              totalCount={deduplicatedTransactions.length}
              filteredCount={filteredTransactions.length}
            />
          )}
          
          {/* Rightmove House Prices Button */}
          {subjectPropertyData?.postcode && (
            <div className="mt-4">
              <a
                href={`https://www.rightmove.co.uk/house-prices/${subjectPropertyData.postcode.toLowerCase().replace(/\s+/g, '-')}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 hover:border-blue-400/70 rounded-lg px-4 py-3 text-blue-300 hover:text-blue-200 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Rightmove House Prices
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Right Content - Transaction List */}
        <div className="flex-1 min-w-0">
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                {!hasLoadedInitialData ? (
                  <>
                    <div className="h-6 bg-gray-700/30 rounded w-64 animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-700/30 rounded w-48 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-100">
                      Nearby Completed Transactions ({availableTransactions.length})
                    </h3>
                    <div className="text-xs text-gray-400 mt-1">
                      Showing {filteredTransactions.length} of {deduplicatedTransactions.length} transactions
                      {deduplicatedTransactions.length > filteredTransactions.length && (
                        <span className="ml-1 text-orange-400">
                          ({deduplicatedTransactions.length - filteredTransactions.length} filtered out)
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Sort Dropdown */}
              {hasLoadedInitialData && (
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-black/40 border border-gray-600 rounded-md px-3 py-2 pr-10 text-xs font-medium text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {!hasLoadedInitialData ? (
                // Skeleton loading state
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-black/20 border border-gray-500/30 rounded-lg p-4 animate-pulse">
                    <div className="flex gap-4">
                      {/* Street View Image Skeleton */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-700/30 rounded-lg"></div>
                      </div>
                      
                      {/* Property Details Skeleton */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700/30 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-1/2"></div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="h-6 bg-gray-700/30 rounded w-20 mb-1"></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-4">
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-16"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                          </div>
                          <div className="text-right">
                            <div className="h-3 bg-gray-700/30 rounded w-16 mb-1"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {availableTransactions.map(transaction => (
                    <TransactionCard
                      key={transaction.street_group_property_id}
                      transaction={transaction}
                      isSelected={selectedComparableIds.includes(transaction.street_group_property_id)}
                      onSelect={() => handleSelectComparable(transaction.street_group_property_id)}
                      onDeselect={() => handleDeselectComparable(transaction.street_group_property_id)}
                      onViewDetails={() => handleViewDetails(transaction)}
                    />
                  ))}
                  {availableTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No transactions match the current filters
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>



    </>
  )
}
