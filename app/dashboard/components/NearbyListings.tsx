'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'

interface Listing {
  street_group_property_id: string
  address: {
    royal_mail_format: {
      thoroughfare: string
      post_town: string
      postcode: string
    }
  }
  location: {
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  property_type: {
    value: string
  }
  price: number
  number_of_bedrooms: number
  number_of_bathrooms: number
  internal_area_square_metres: number
  distance_in_metres: number
  main_image_url: string
  images: string[]
  listing_id: string
  source: string
  listed_date: string
  agent?: {
    branch_name: string
    company_name: string
  }
}

interface NearbyListingsProps {
  listings: {
    sale_listings: Listing[]
    rental_listings: Listing[]
  }
  mainPropertyLocation?: {
    latitude: number
    longitude: number
  }
}

const SALE_PRICE_OPTIONS = [
  'Any',
  '£50,000',
  '£60,000',
  '£70,000',
  '£80,000',
  '£90,000',
  '£100,000',
  '£110,000',
  '£120,000',
  '£130,000',
  '£140,000',
  '£150,000',
  '£175,000',
  '£200,000',
  '£225,000',
  '£250,000',
  '£275,000',
  '£300,000',
  '£325,000',
  '£350,000',
  '£400,000',
  '£450,000',
  '£500,000',
  '£600,000',
  '£700,000',
  '£800,000',
  '£900,000',
  '£1,000,000',
  '£1,250,000',
  '£1,500,000',
  '£2,000,000',
]

const RENT_PRICE_OPTIONS = [
  'Any',
  '£100',
  '£150',
  '£200',
  '£250',
  '£300',
  '£350',
  '£400',
  '£450',
  '£500',
  '£600',
  '£700',
  '£800',
  '£900',
  '£1,000',
  '£1,250',
  '£1,500',
  '£2,000',
  '£2,500',
  '£3,000',
]

const DISTANCE_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'This area only', value: 200 },
  { label: 'Within 1/4 mile', value: 402 },
  { label: 'Within 1/2 mile', value: 804 },
  { label: 'Within 1 mile', value: 1609 },
  { label: 'Within 2 miles', value: 3218 },
]

  const BED_OPTIONS = ['Any', '1', '2', '3', '4', '5', '6+']
  const BATH_OPTIONS = ['Any', '1', '2', '3', '4', '5+']

const SORT_OPTIONS = [
  { label: 'Highest price', value: 'price-high' },
  { label: 'Lowest price', value: 'price-low' },
  { label: 'Newest listed', value: 'newest' },
  { label: 'Oldest listed', value: 'oldest' },
]

// Helper functions
const metersToMiles = (meters: number): string => {
  const miles = meters / 1609.34
  return miles.toFixed(2)
}

const formatPrice = (price: number, type: 'sale' | 'rent'): string => {
  if (type === 'rent') {
    return `£${price.toLocaleString()} pcm`
  }
  return `£${price.toLocaleString()}`
}

const formatArea = (sqm: number): string => {
  const sqft = Math.round(sqm * 10.764)
  return `${sqm}m² (${sqft.toLocaleString()} sq ft)`
}

const getRightmoveUrl = (listingId: string): string => {
  const numericId = listingId.replace(/^r/, '')
  return `https://www.rightmove.co.uk/properties/${numericId}`
}

// Helper function to calculate approximate coordinates for nearby listings
const calculateNearbyCoordinates = (
  mainLat: number, 
  mainLng: number, 
  distanceInMeters: number,
  listingId: string
): { latitude: number; longitude: number } => {
  // Convert meters to degrees (rough approximation)
  // 1 degree latitude ≈ 111,000 meters
  // 1 degree longitude ≈ 111,000 * cos(latitude) meters
  
  // Use listing ID to create deterministic but varied positions
  const hash = listingId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180) // Convert to radians
  const distanceInDegrees = distanceInMeters / 111000
  
  const latOffset = distanceInDegrees * Math.cos(angle) * 0.5
  const lngOffset = distanceInDegrees * Math.sin(angle) * 0.5 / Math.cos(mainLat * Math.PI / 180)
  
  return {
    latitude: mainLat + latOffset,
    longitude: mainLng + lngOffset
  }
}

export default function NearbyListings({ listings, mainPropertyLocation }: NearbyListingsProps) {
  const [activeTab, setActiveTab] = useState<'sale' | 'rent'>('sale')
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({})
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedProperty, setSelectedProperty] = useState<Listing | null>(null)
  
  // Filter states
  const [distanceFilter, setDistanceFilter] = useState(DISTANCE_OPTIONS[0].value)
  const [beds, setBeds] = useState('Any')
  const [baths, setBaths] = useState('Any')
  const [propertyType, setPropertyType] = useState('All types')
  const [sortBy, setSortBy] = useState('newest')

  // Get available property types and enhance with coordinates
  const availableListings = useMemo(() => {
    const baseListings = activeTab === 'sale' ? listings.sale_listings : listings.rental_listings
    
    if (!mainPropertyLocation) return baseListings
    
    return baseListings.map(listing => ({
      ...listing,
      location: {
        coordinates: calculateNearbyCoordinates(
          mainPropertyLocation.latitude,
          mainPropertyLocation.longitude,
          listing.distance_in_metres,
          listing.listing_id
        )
      }
    }))
  }, [listings, activeTab, mainPropertyLocation])
  const uniquePropertyTypes = useMemo(() => {
    const types = new Set(availableListings.map(listing => listing.property_type?.value))
    return Array.from(types).filter(Boolean).sort()
  }, [availableListings])

  const PROPERTY_TYPE_OPTIONS = ['All types', ...uniquePropertyTypes]


  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[£,]/g, '')) || 0
  }

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = [...availableListings]

    // Distance filter
    if (distanceFilter !== null) {
      filtered = filtered.filter(listing => listing.distance_in_metres <= distanceFilter)
    }

    // Beds filter
    if (beds !== 'Any') {
      if (beds === '6+') {
        filtered = filtered.filter(listing => listing.number_of_bedrooms >= 6)
      } else {
        const bedsValue = parseInt(beds)
        filtered = filtered.filter(listing => listing.number_of_bedrooms === bedsValue)
      }
    }

    // Baths filter
    if (baths !== 'Any') {
      if (baths === '5+') {
        filtered = filtered.filter(listing => listing.number_of_bathrooms >= 5)
      } else {
        const bathsValue = parseInt(baths)
        filtered = filtered.filter(listing => 
          listing.number_of_bathrooms === bathsValue || listing.number_of_bathrooms === 0
        )
      }
    }

    // Property type filter
    if (propertyType !== 'All types') {
      filtered = filtered.filter(listing => listing.property_type?.value === propertyType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return b.price - a.price
        case 'price-low':
          return a.price - b.price
        case 'newest':
          return new Date(b.listed_date).getTime() - new Date(a.listed_date).getTime()
        case 'oldest':
          return new Date(a.listed_date).getTime() - new Date(b.listed_date).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [availableListings, distanceFilter, beds, baths, propertyType, sortBy])

  const handleImageNavigation = (listingId: string, direction: 'prev' | 'next', totalImages: number) => {
    const currentIndex = currentImageIndex[listingId] || 0
    let newIndex: number

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1
    }

    setCurrentImageIndex(prev => ({
      ...prev,
      [listingId]: newIndex
    }))
  }

  const ListingCard = ({ listing }: { listing: Listing }) => {
    const imageIndex = currentImageIndex[listing.listing_id] || 0
    const allImages = [...listing.images].slice(0, 10) // Limit to first 10 images
    const currentImage = allImages[imageIndex] || listing.main_image_url
    const hasMultipleImages = allImages.length > 1

    return (
      <div className="bg-black/20 border border-gray-500/30 rounded-xl p-6 mb-6 hover:bg-black/30 transition-all duration-200">
        <div className="flex gap-6">
          {/* Left Side - Image Carousel */}
          <div className="w-[40%] relative group">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={currentImage}
                alt={`${listing.address.royal_mail_format.thoroughfare}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              
              {/* Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => handleImageNavigation(listing.listing_id, 'prev', allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleImageNavigation(listing.listing_id, 'next', allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Dot Indicators */}
            {hasMultipleImages && (
              <div className="flex justify-center gap-1 mt-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(prev => ({ ...prev, [listing.listing_id]: index }))}
                    className={`w-2 h-2 rounded-full transition-all ${
                      imageIndex === index ? 'bg-purple-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Property Details */}
          <div className="flex-1">
            {/* Address */}
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              {listing.address.royal_mail_format.thoroughfare}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {listing.address.royal_mail_format.post_town}, {listing.address.royal_mail_format.postcode}
            </p>

            {/* Price */}
            <div className="text-2xl font-bold text-purple-400 mb-4">
              {formatPrice(listing.price, activeTab)}
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm">{listing.property_type?.value}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  {/* Headboard */}
                  <rect x="2" y="4" width="4" height="16" rx="2" />
                  {/* Pillow */}
                  <rect x="3" y="6" width="2" height="3" rx="1" />
                  {/* Mattress/Bed frame */}
                  <rect x="6" y="12" width="14" height="8" rx="1" />
                  {/* Footboard */}
                  <rect x="18" y="8" width="4" height="12" rx="2" />
                </svg>
                <span className="text-sm">{listing.number_of_bedrooms} beds, {listing.number_of_bathrooms} baths</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-sm">{formatArea(listing.internal_area_square_metres || 0)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{metersToMiles(listing.distance_in_metres)} miles</span>
              </div>
            </div>

            {/* Agent Info */}
            {listing.agent && (
              <p className="text-xs text-gray-500 mb-4">
                {listing.agent.company_name} - {listing.agent.branch_name}
              </p>
            )}

            {/* Rightmove Button */}
            {listing.source === 'rightmove' && (
              <a
                href={getRightmoveUrl(listing.listing_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                View on Rightmove
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('sale')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'sale'
              ? 'bg-purple-500/20 text-purple-100 border border-purple-400/30'
              : 'bg-black/20 text-gray-300 hover:text-gray-100 hover:bg-gray-500/10 border border-transparent'
          }`}
        >
          For Sale
        </button>
        <button
          onClick={() => setActiveTab('rent')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'rent'
              ? 'bg-purple-500/20 text-purple-100 border border-purple-400/30'
              : 'bg-black/20 text-gray-300 hover:text-gray-100 hover:bg-gray-500/10 border border-transparent'
          }`}
        >
          For Rent
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="bg-black/20 border border-gray-500/30 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Distance Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Distance</label>
            <div className="relative">
              <select
                value={distanceFilter || ''}
                onChange={(e) => setDistanceFilter(Number(e.target.value) || null)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {DISTANCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value || ''}>{option.label}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Beds */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Beds</label>
            <div className="relative">
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {BED_OPTIONS.map(bed => (
                  <option key={bed} value={bed}>{bed}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Baths */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Baths</label>
            <div className="relative">
              <select
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {BATH_OPTIONS.map(bath => (
                  <option key={bath} value={bath}>{bath}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Property Type</label>
            <div className="relative">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {PROPERTY_TYPE_OPTIONS.map(type => (
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
        </div>

        {/* Sort and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            Showing {filteredAndSortedListings.length} {filteredAndSortedListings.length === 1 ? 'property' : 'properties'}
          </div>
          <div className="flex items-center gap-4">
            
            {/* Sort */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Sort by:</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
                >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle - Compact */}
      <div className="flex items-center my-4">
        <div className="bg-black/20 border border-gray-600 rounded-lg p-0.5 flex">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            List view
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'map'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Map view
          </button>
        </div>
      </div>

      {/* Listings */}
      <div>
        {filteredAndSortedListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-50">🏠</div>
            <p className="text-gray-400">No properties found matching your filters</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === 'list' ? (
          filteredAndSortedListings.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} />
          ))
        ) : (
          <MapView 
            listings={filteredAndSortedListings} 
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
            activeTab={activeTab}
            mainPropertyLocation={mainPropertyLocation}
            ListingCard={ListingCard}
          />
        )}
      </div>
    </div>
  )
}

// MapView Component
function MapView({ 
  listings, 
  selectedProperty, 
  onPropertySelect,
  activeTab,
  mainPropertyLocation,
  ListingCard
}: { 
  listings: Listing[]
  selectedProperty: Listing | null
  onPropertySelect: (property: Listing | null) => void
  activeTab: 'sale' | 'rent'
  mainPropertyLocation?: { latitude: number; longitude: number }
  ListingCard: React.ComponentType<{ listing: Listing }>
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [radiusCircle, setRadiusCircle] = useState<any>(null)
  const [selectedMarker, setSelectedMarker] = useState<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return

    const initMap = () => {
      // Find first listing with valid coordinates
      const listingWithCoords = listings.find(listing => 
        listing.location?.coordinates?.latitude && listing.location?.coordinates?.longitude
      )
      
      const center = listingWithCoords
        ? { lat: listingWithCoords.location.coordinates.latitude, lng: listingWithCoords.location.coordinates.longitude }
        : { lat: 51.5074, lng: -0.1278 } // Default to London

      const newMap = new (window as any).google.maps.Map(mapRef.current!, {
        zoom: 13,
        center,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#000000', weight: 2 }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#10b981' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#374151' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d1d5db' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#4b5563' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#374151' }]
          },
          {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#1e40af' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#60a5fa' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#000000' }]
          }
        ]
      })

      setMap(newMap)
    }

    // Load Google Maps script if not already loaded
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [listings, map])

  // Update markers and radius circle when listings change
  useEffect(() => {
    if (!map || !listings.length) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    
    // Clear existing radius circle
    if (radiusCircle) {
      radiusCircle.setMap(null)
    }
    
    // Clear selected marker
    setSelectedMarker(null)

    const newMarkers = listings
      .filter(listing => listing.location?.coordinates?.latitude && listing.location?.coordinates?.longitude)
      .map(listing => {
        const isSelected = selectedProperty && selectedProperty.listing_id === listing.listing_id
        
        const marker = new (window as any).google.maps.Marker({
          position: { lat: listing.location.coordinates.latitude, lng: listing.location.coordinates.longitude },
          map,
          title: `${listing.address.royal_mail_format.thoroughfare}, ${listing.address.royal_mail_format.post_town}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${isSelected ? '#7c3aed' : '#ec4899'}"/>
                <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
                ${isSelected ? '<circle cx="12" cy="9" r="4" fill="none" stroke="#7c3aed" stroke-width="2"/>' : ''}
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(40, 40),
            anchor: new (window as any).google.maps.Point(20, 40)
          }
        })

        marker.addListener('click', () => {
          onPropertySelect(listing)
          setSelectedMarker(marker)
        })

        return marker
      })

    setMarkers(newMarkers)

            // Create radius circle around the main property
            if (mainPropertyLocation && listings.length > 0) {
              const maxDistance = Math.max(...listings.map(l => l.distance_in_metres))
              
              const circle = new (window as any).google.maps.Circle({
                strokeColor: '#ec4899',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#ec4899',
                fillOpacity: 0.1,
                map: map,
                center: {
                  lat: mainPropertyLocation.latitude,
                  lng: mainPropertyLocation.longitude
                },
                radius: maxDistance
              })
              
              setRadiusCircle(circle)
            }

            // Fit map to show all markers with padding around the radius circle
            if (newMarkers.length > 0) {
              const bounds = new (window as any).google.maps.LatLngBounds()
              
              // Always include the main property location in bounds
              if (mainPropertyLocation) {
                bounds.extend(new (window as any).google.maps.LatLng(mainPropertyLocation.latitude, mainPropertyLocation.longitude))
              }
              
              // Add all marker positions
              newMarkers.forEach(marker => bounds.extend(marker.getPosition()!))
              
              // For small areas, ensure we show the full radius circle
              const maxDistance = Math.max(...listings.map(l => l.distance_in_metres))
              if (maxDistance < 1000 && mainPropertyLocation) {
                // Convert meters to degrees (rough approximation)
                const radiusInDegrees = maxDistance / 111000
                
                // Extend bounds to include the full radius circle
                bounds.extend(new (window as any).google.maps.LatLng(
                  mainPropertyLocation.latitude + radiusInDegrees,
                  mainPropertyLocation.longitude + radiusInDegrees
                ))
                bounds.extend(new (window as any).google.maps.LatLng(
                  mainPropertyLocation.latitude - radiusInDegrees,
                  mainPropertyLocation.longitude - radiusInDegrees
                ))
              }
              
              // Add padding to ensure the radius circle is fully visible
              const padding = 0.5 // 50% padding
              const ne = bounds.getNorthEast()
              const sw = bounds.getSouthWest()
              const latDiff = ne.lat() - sw.lat()
              const lngDiff = ne.lng() - sw.lng()
              
              bounds.extend({
                lat: ne.lat() + (latDiff * padding),
                lng: ne.lng() + (lngDiff * padding)
              })
              bounds.extend({
                lat: sw.lat() - (latDiff * padding),
                lng: sw.lng() - (lngDiff * padding)
              })
              
              map.fitBounds(bounds)
            }
  }, [map, listings, onPropertySelect])

  // Update marker styles when selectedProperty changes
  useEffect(() => {
    if (!markers.length) return

    markers.forEach(marker => {
      const listing = listings.find(l => 
        l.location?.coordinates?.latitude === marker.getPosition()?.lat() &&
        l.location?.coordinates?.longitude === marker.getPosition()?.lng()
      )
      
      if (listing) {
        const isSelected = selectedProperty && selectedProperty.listing_id === listing.listing_id
        
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${isSelected ? '#7c3aed' : '#ec4899'}"/>
              <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
              ${isSelected ? '<circle cx="12" cy="9" r="4" fill="none" stroke="#7c3aed" stroke-width="2"/>' : ''}
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(40, 40),
          anchor: new (window as any).google.maps.Point(20, 40)
        })
      }
    })
  }, [selectedProperty, markers, listings])

  return (
    <div className="relative">
      {/* Property Info Area - Always Visible */}
      <div className="mb-4">
        {selectedProperty ? (
          <ListingCard listing={selectedProperty} />
        ) : (
          <div className="bg-black/20 border border-gray-500/30 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4 opacity-50">📍</div>
            <p className="text-gray-400 text-lg">Select a property on the map to view details</p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full aspect-square rounded-xl overflow-hidden border border-gray-500/30"
        style={{ minHeight: '500px' }}
      />
    </div>
  )
}
