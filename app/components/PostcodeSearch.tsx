'use client'

import { useState } from 'react'

interface PostcodeSearchProps {
  onPostcodeSubmit: (postcode: string) => void
  loading?: boolean
  error?: string | null
}

export default function PostcodeSearch({ onPostcodeSubmit, loading = false, error }: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (postcode.trim()) {
      onPostcodeSubmit(postcode.trim())
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
    </div>
  )
}
