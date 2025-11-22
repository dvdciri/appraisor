'use client'

import { useState } from 'react'

interface PostcodeSearchProps {
  onPostcodeSubmit: (postcode: string) => void
  onManualSubmit?: (address: string, postcode: string) => void
  loading?: boolean
  error?: string | null
}

export default function PostcodeSearch({ onPostcodeSubmit, onManualSubmit, loading = false, error }: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualPostcode, setManualPostcode] = useState('')
  const [addressNumber, setAddressNumber] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (postcode.trim()) {
      onPostcodeSubmit(postcode.trim())
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualPostcode.trim() && addressNumber.trim() && onManualSubmit) {
      // Construct address string from number and postcode
      const address = `${addressNumber.trim()}`
      onManualSubmit(address, manualPostcode.trim())
    }
  }

  const formatPostcode = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Basic UK postcode formatting (not perfect but good enough for display)
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3)
    } else {
      return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostcode(e.target.value)
    setPostcode(formatted)
  }

  const handleManualPostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostcode(e.target.value)
    setManualPostcode(formatted)
  }

  if (showManualForm) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setShowManualForm(false)
            setManualPostcode('')
            setAddressNumber('')
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 text-sm mb-2"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          Back to postcode search
        </button>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Enter Address Manually
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Enter the property number and postcode to search directly
          </p>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="addressNumber" className="block text-sm font-medium text-white mb-2">
              Property Number/Name
            </label>
            <input
              type="text"
              id="addressNumber"
              value={addressNumber}
              onChange={(e) => setAddressNumber(e.target.value)}
              placeholder="e.g., 123 or Flat 5"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="manualPostcode" className="block text-sm font-medium text-white mb-2">
              UK Postcode
            </label>
            <input
              type="text"
              id="manualPostcode"
              value={manualPostcode}
              onChange={handleManualPostcodeChange}
              placeholder="e.g., SW1A 1AA"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
              maxLength={8}
            />
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/20 border border-red-400/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !manualPostcode.trim() || !addressNumber.trim()}
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="postcode" className="block text-sm font-medium text-white mb-2">
          UK Postcode
        </label>
        <input
          type="text"
          id="postcode"
          value={postcode}
          onChange={handleInputChange}
          placeholder="e.g., SW1A 1AA"
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={loading}
          maxLength={8}
        />
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/20 border border-red-400/30 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={loading || !postcode.trim()}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Finding Addresses...
          </div>
        ) : (
          'Find Addresses'
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowManualForm(true)}
          className="text-sm text-gray-400 hover:text-white transition-colors duration-200 underline"
        >
          Can't find the address?
        </button>
      </div>
    </div>
  )
}
