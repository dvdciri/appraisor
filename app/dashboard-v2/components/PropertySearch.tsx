'use client'

import { useState } from 'react'
import Image from 'next/image'

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

export default function PropertySearch() {
  const [postcode, setPostcode] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [houseNumber, setHouseNumber] = useState('')
  const [showHouseNumberField, setShowHouseNumberField] = useState(false)

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
    // For now, do nothing when address is selected
    // This will be implemented later
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow any input without formatting or truncation
    setPostcode(e.target.value)
  }

  const handleHouseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHouseNumber(e.target.value)
  }

  const handleHouseNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (houseNumber.trim() && postcode.trim()) {
      // For now, do nothing when house number is submitted
      // This will be implemented later
      console.log('House number submit:', { address: houseNumber, postcode: postcode })
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-36">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/search-icon.png"
            alt="Search icon"
            width={80}
            height={80}
            className="w-20 h-20"
          />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Search Any Property</h2>
        <p className="text-gray-300 text-sm">Enter a postcode to get your property details</p>
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
              onClick={() => {
                // For now, do nothing when Search Property is clicked
                // This will be implemented later
                console.log('Search Property clicked with address:', selectedAddress)
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
  )
}

