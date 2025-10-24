'use client'

import { useState } from 'react'

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

interface AddressSelectorProps {
  postcode: string
  addresses: Address[]
  onAddressSelect: (address: string, postcode: string) => void
  onBack: () => void
  loading?: boolean
}

export default function AddressSelector({ 
  postcode, 
  addresses, 
  onAddressSelect, 
  onBack, 
  loading = false 
}: AddressSelectorProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAddressId) {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)
      if (selectedAddress) {
        onAddressSelect(selectedAddress.address, selectedAddress.postcode)
      }
    }
  }

  const handleAddressClick = (addressId: string) => {
    setSelectedAddressId(addressId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
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
            Back to postcode
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Select Address
          </h3>
          <p className="text-gray-300 mb-4">
            Found {addresses.length} address{addresses.length !== 1 ? 'es' : ''} for postcode <span className="font-medium text-white">{postcode}</span>
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏠</div>
            <p className="text-gray-400">No addresses found for this postcode</p>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-gray-600 hover:border-purple-400/50 hover:bg-white/5'
                }`}
                onClick={() => handleAddressClick(address.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    selectedAddressId === address.id
                      ? 'border-purple-400 bg-purple-400'
                      : 'border-gray-500'
                  }`}>
                    {selectedAddressId === address.id && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">
                      {address.address}
                    </div>
                    <div className="text-xs text-gray-300">
                      {address.post_town}{address.county && `, ${address.county}`} • {address.postcode}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Button */}
      <div className="flex-shrink-0 pt-4">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading || !selectedAddressId}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing Property...
            </div>
          ) : (
            'Analyze Property'
          )}
        </button>
      </div>
    </div>
  )
}
