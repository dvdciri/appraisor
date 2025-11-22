'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import StreetViewImage from '../../components/StreetViewImage'
import { extractUPRN, saveCalculatorData, type CalculatorData } from '../../../lib/persistence'

interface Address {
  id: string
  address: string
  postcode: string
  full_address: string
  uprn: string
  building_name?: string
  building_number?: string
  line_1: string
  line_2?: string
  line_3?: string
  post_town: string
  county: string
}

interface RecentSearch {
  uprn: string
  address: string
  searched_at: string
  latitude?: number
  longitude?: number
}

// UK postcode validation function
const isValidUKPostcode = (postcode: string): boolean => {
  // Remove spaces and convert to uppercase
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase()
  
  // UK postcode patterns:
  // Format: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
  // Where A is a letter and 9 is a digit
  const ukPostcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/i
  
  return ukPostcodePattern.test(cleaned) && cleaned.length >= 5 && cleaned.length <= 7
}

interface PropertySearchProps {
  onPropertySelected?: (uprn: string, address: string) => void
}

export default function PropertySearch({ onPropertySelected }: PropertySearchProps) {
  const [postcode, setPostcode] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [houseNumber, setHouseNumber] = useState('')
  const [showHouseNumberField, setShowHouseNumberField] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [loadingRecentSearches, setLoadingRecentSearches] = useState(true)
  const [showAllRecentSearches, setShowAllRecentSearches] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePostcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedPostcode = postcode.trim()
    if (!trimmedPostcode) {
      setError('Please enter a postcode')
      return
    }

    // Validate UK postcode format
    if (!isValidUKPostcode(trimmedPostcode)) {
      setError('Please enter a valid UK postcode (e.g., SW1A 1AA)')
      return
    }

    setLoading(true)
    setError(null)
    setAddresses([])
    setSelectedAddress('')
    setShowHouseNumberField(false)
    setHouseNumber('')

    try {
      const response = await fetch(`/api/postcode/addresses?postcode=${encodeURIComponent(trimmedPostcode)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('Failed to fetch addresses for postcode:', trimmedPostcode, errorData.error || 'Unknown error')
        setShowHouseNumberField(true)
        return
      }

      const data = await response.json()
      const fetchedAddresses = data.addresses || []
      
      if (fetchedAddresses.length === 0) {
        console.log('No addresses found for postcode:', trimmedPostcode)
        setShowHouseNumberField(true)
        return
      }

      setAddresses(fetchedAddresses)
      setShowHouseNumberField(false)
    } catch (error) {
      console.error('Error fetching addresses for postcode:', trimmedPostcode, error)
      setShowHouseNumberField(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addressId = e.target.value
    setSelectedAddress(addressId)
  }

  const saveToRecentAnalyses = async (data: any) => {
    // Extract UPRN from property data
    const uprn = extractUPRN(data)
    if (!uprn) {
      console.error('Failed to extract UPRN from property data')
      throw new Error('Property data missing UPRN')
    }

    // Create calculator data with default values
    const calculatorData: CalculatorData = {
      notes: '',
      purchaseType: 'mortgage',
      includeFeesInLoan: false,
      bridgingDetails: {
        loanType: 'serviced',
        duration: '12',
        grossLoanPercent: '70',
        monthlyInterest: '0.75',
        applicationFee: '1500'
      },
      exitStrategy: null,
      refinanceDetails: {
        expectedGDV: '0',
        newLoanLTV: '75',
        interestRate: '5.5',
        brokerFees: '0',
        legalFees: '0'
      },
      saleDetails: {
        expectedSalePrice: '0',
        agencyFeePercent: '1.5',
        legalFees: '0'
      },
      refurbItems: [],
      fundingSources: [],
      initialCosts: {
        refurbRepair: '0',
        legal: '0',
        stampDutyPercent: '0',
        ila: '0',
        brokerFees: '0',
        auctionFees: '0',
        findersFee: '0'
      },
      purchaseFinance: {
        purchasePrice: '0',
        deposit: '0',
        ltv: '75',
        loanAmount: '0',
        productFee: '0',
        interestRate: '5.5'
      },
      monthlyIncome: {
        rent1: '0',
        rent2: '0',
        rent3: '0',
        rent4: '0',
        rent5: '0'
      },
      monthlyExpenses: {
        serviceCharge: '0',
        groundRent: '0',
        maintenancePercent: '10',
        managementPercent: '10',
        insurance: '0',
        mortgagePayment: '0'
      },
      propertyValue: '0'
    }

    // Save calculator data
    await saveCalculatorData(uprn, calculatorData)
    
    return uprn
  }

  const handlePropertySearch = async (address: string, postcode: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/property/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, postcode }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to find property. Please check the address and postcode and try again.')
        return
      }
      
      const data = await response.json()
      console.log('Property data received:', data)
      
      // Check if this was cached data
      const wasCached = data._cached
      console.log('Data was cached:', wasCached)
      
      // Only save to recent analyses if this was fresh data (not cached)
      if (!wasCached) {
        console.log('Saving fresh data to recent analyses...')
        await saveToRecentAnalyses(data)
      } else {
        console.log('Skipping save to recent analyses - using cached data')
      }
      
      // Extract UPRN and address
      const uprn = extractUPRN(data)
      if (!uprn) {
        console.error('Failed to extract UPRN from property data')
        setError('Failed to process property data. Please try again.')
        return
      }

      // Extract house_number and street from simplified_format for tab title
      const simplifiedFormat = data?.data?.attributes?.address?.simplified_format
      const houseNumber = simplifiedFormat?.house_number || ''
      const street = simplifiedFormat?.street || ''
      const tabTitle = houseNumber && street ? `${houseNumber} ${street}` : address
      
      // Call the callback with UPRN and formatted title
      if (onPropertySelected) {
        onPropertySelected(uprn, tabTitle)
      }
      
    } catch (error) {
      console.error('Error analyzing property:', error)
      setError('Failed to analyze property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow any input without formatting or truncation
    setPostcode(e.target.value)
  }

  const handleHouseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHouseNumber(e.target.value)
  }

  const handleHouseNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (houseNumber.trim() && postcode.trim()) {
      await handlePropertySearch(houseNumber.trim(), postcode.trim())
    }
  }

  // Fetch recent searches on mount
  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const response = await fetch('/api/user/search-history')
        if (response.ok) {
          const data = await response.json()
          setRecentSearches(data)
        }
      } catch (error) {
        console.error('Error fetching recent searches:', error)
      } finally {
        setLoadingRecentSearches(false)
      }
    }

    fetchRecentSearches()
  }, [])

  // Show maximum 4 items (1 row) at all times
  const itemsPerPage = 4
  const displayedSearches = recentSearches.slice(0, itemsPerPage)
  const hasMoreSearches = recentSearches.length > itemsPerPage

  // Filter searches for modal
  const filteredSearches = searchFilter.trim()
    ? recentSearches.filter(search => 
        search.address.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : recentSearches

  return (
    <div className="w-full max-w-7xl mx-auto mt-36 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Analyze Your Next Property Investment</h2>
            <p className="text-gray-300 text-sm">Enter a postcode to find a property</p>
          </div>
        <div className="space-y-4">
        <form onSubmit={handlePostcodeSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            id="postcode"
            value={postcode}
            onChange={handleInputChange}
            placeholder="e.g. 'SE5 8EB'"
            className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-400/50 focus:ring-red-500' : 'border-white/20'
            }`}
            disabled={loading}
            title={error || ''}
          />
          {error && (
            <div className="absolute left-0 top-full mt-1 px-3 py-2 text-sm text-white bg-red-500 rounded-lg shadow-lg z-10 pointer-events-none">
              {error}
              <div className="absolute left-4 -top-1 w-2 h-2 bg-red-500 transform rotate-45"></div>
            </div>
          )}
        </div>

        {!showHouseNumberField && addresses.length === 0 && (
          <button
            type="submit"
            disabled={loading || !postcode.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Finding Addresses...
              </div>
            ) : (
              'Find Address'
            )}
          </button>
        )}
        </form>

        {/* House Number Field - appears when postcode search fails */}
        {showHouseNumberField && (
          <form onSubmit={handleHouseNumberSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                id="houseNumber"
                value={houseNumber}
                onChange={handleHouseNumberChange}
                placeholder="e.g., 123 or Flat 5"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !houseNumber.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                'Search Property'
              )}
            </button>
          </form>
        )}

        {/* Address Dropdown - appears after addresses are fetched */}
        {addresses.length > 0 && (
          <>
            <div className="space-y-2">
              <select
                id="addressSelect"
                value={selectedAddress}
                onChange={handleAddressSelect}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" disabled className="bg-gray-800 text-white">
                  Select your address
                </option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id} className="bg-gray-800 text-white">
                    {address.full_address}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={async () => {
                const selectedAddr = addresses.find(addr => addr.id === selectedAddress)
                if (selectedAddr) {
                  await handlePropertySearch(selectedAddr.full_address, selectedAddr.postcode)
                }
              }}
              disabled={loading || !selectedAddress}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                'Search Property'
              )}
            </button>
          </>
        )}
        </div>
      </div>

      {/* Recent Searches Grid */}
      {loadingRecentSearches && (
        <div className="mt-24 w-full max-w-4xl mx-auto">
          <div className="h-7 bg-gray-700/30 rounded w-48 mb-4 animate-pulse mx-auto"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden"
              >
                <div className="relative w-full h-full flex flex-col">
                  <div className="flex-1 bg-gray-700/30 animate-pulse"></div>
                  <div className="p-2 bg-black/20">
                    <div className="h-3 bg-gray-700/30 rounded mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-700/30 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingRecentSearches && recentSearches.length > 0 && (
        <div className="mt-24 w-full max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Recent Analyses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedSearches.map((search) => (
              <div
                key={search.uprn}
                onClick={async () => {
                  // For recent searches, property is already in database - fetch to get simplified format
                  if (onPropertySelected) {
                    try {
                      const response = await fetch(`/api/properties/${encodeURIComponent(search.uprn)}`)
                      if (response.ok) {
                        const data = await response.json()
                        // Extract house_number and street from simplified_format
                        const simplifiedFormat = data?.data?.data?.attributes?.address?.simplified_format
                        const houseNumber = simplifiedFormat?.house_number || ''
                        const street = simplifiedFormat?.street || ''
                        const tabTitle = houseNumber && street ? `${houseNumber} ${street}` : search.address
                        onPropertySelected(search.uprn, tabTitle)
                      } else {
                        // Fallback to address if fetch fails
                        onPropertySelected(search.uprn, search.address)
                      }
                    } catch (error) {
                      console.error('Error fetching property data for recent search:', error)
                      // Fallback to address if fetch fails
                      onPropertySelected(search.uprn, search.address)
                    }
                  }
                }}
                className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden hover:border-purple-400/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="relative w-full h-full flex flex-col">
                  {/* Street View Image */}
                  {search.latitude && search.longitude ? (
                    <div className="flex-1 overflow-hidden rounded-t-lg">
                      <StreetViewImage
                        latitude={search.latitude}
                        longitude={search.longitude}
                        address={search.address}
                        className="w-full h-full rounded-none"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center rounded-t-lg">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Address and Date */}
                  <div className="p-2 bg-black/20">
                    <p className="text-white text-sm font-medium truncate group-hover:text-purple-300 transition-colors">
                      {search.address}
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">
                      {new Date(search.searched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMoreSearches && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all duration-200"
              >
                See All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal for All Recent Searches - Rendered at document body level */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false)
              setSearchFilter('')
            }}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-black/90 backdrop-blur-xl border border-gray-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-500/30">
              <h2 className="text-2xl font-bold text-white">Recent Analyses</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSearchFilter('')
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-500/30">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by address..."
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Grid Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredSearches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No properties found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredSearches.map((search) => (
                    <div
                      key={search.uprn}
                      onClick={async () => {
                        // For recent searches, property is already in database - fetch to get simplified format
                        if (onPropertySelected) {
                          try {
                            const response = await fetch(`/api/properties/${encodeURIComponent(search.uprn)}`)
                            if (response.ok) {
                              const data = await response.json()
                              // Extract house_number and street from simplified_format
                              const simplifiedFormat = data?.data?.data?.attributes?.address?.simplified_format
                              const houseNumber = simplifiedFormat?.house_number || ''
                              const street = simplifiedFormat?.street || ''
                              const tabTitle = houseNumber && street ? `${houseNumber} ${street}` : search.address
                              onPropertySelected(search.uprn, tabTitle)
                            } else {
                              // Fallback to address if fetch fails
                              onPropertySelected(search.uprn, search.address)
                            }
                          } catch (error) {
                            console.error('Error fetching property data for recent search:', error)
                            // Fallback to address if fetch fails
                            onPropertySelected(search.uprn, search.address)
                          }
                        }
                        setShowModal(false)
                        setSearchFilter('')
                      }}
                      className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden hover:border-purple-400/50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="relative w-full h-full flex flex-col">
                        {/* Street View Image */}
                        {search.latitude && search.longitude ? (
                          <div className="flex-1 overflow-hidden rounded-t-lg">
                            <StreetViewImage
                              latitude={search.latitude}
                              longitude={search.longitude}
                              address={search.address}
                              className="w-full h-full rounded-none"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center rounded-t-lg">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {/* Address and Date */}
                        <div className="p-2 bg-black/20">
                          <p className="text-white text-sm font-medium truncate group-hover:text-purple-300 transition-colors">
                            {search.address}
                          </p>
                          <p className="text-gray-400 text-[10px] mt-1">
                            {new Date(search.searched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

