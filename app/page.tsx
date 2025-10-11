'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from './components/Header'
import StreetViewImage from './components/StreetViewImage'
import { saveCalculatorData, type CalculatorData } from '../lib/persistence'

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

// Generate a simple UID
const generateUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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

export default function Home() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
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

  const handleReset = () => {
    setAddress('')
    setPostcode('')
  }

  const saveToRecentAnalyses = (data: PropertyData, searchAddress: string, searchPostcode: string) => {
    const analysisId = generateUID()
    console.log('Creating new analysis with UID:', analysisId)
    
    // Store full property data ONLY in propertyDataStore (single source of truth)
    try {
      const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
      propertyDataStore[analysisId] = data
      localStorage.setItem('propertyDataStore', JSON.stringify(propertyDataStore))
      console.log('Saved full property data to propertyDataStore')
    } catch (e) {
      console.error('Failed to save full property data:', e)
      // If storage is full, remove oldest entries
      try {
        const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
        const keys = Object.keys(propertyDataStore)
        if (keys.length > 5) {
          // Keep only the 5 most recent
          const recentAnalyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
          const recentIds = recentAnalyses.slice(0, 5).map((a: any) => a.id)
          const cleanedStore: any = {}
          recentIds.forEach((id: string) => {
            if (propertyDataStore[id]) {
              cleanedStore[id] = propertyDataStore[id]
            }
          })
          cleanedStore[analysisId] = data
          localStorage.setItem('propertyDataStore', JSON.stringify(cleanedStore))
          console.log('Cleaned old property data and saved new')
        }
      } catch (e2) {
        console.error('Still failed after cleaning:', e2)
      }
    }
    
    // Create default calculator data with pre-filled values
    const estimatedValue = data.data.attributes.estimated_values?.[0]?.estimated_market_value_rounded || 0
    const defaultCalculatorData: CalculatorData = {
      purchaseType: 'mortgage',
      includeFeesInLoan: false,
      bridgingDetails: {
        loanType: 'serviced',
        duration: '',
        grossLoanPercent: '75',
        monthlyInterest: '',
        applicationFee: ''
      },
      exitStrategy: null,
      refinanceDetails: {
        expectedGDV: '',
        newLoanLTV: '',
        interestRate: '',
        brokerFees: '',
        legalFees: ''
      },
      saleDetails: {
        expectedSalePrice: '',
        agencyFeePercent: '',
        legalFees: ''
      },
      refurbItems: [{ id: 1, description: '', amount: '' }],
      fundingSources: [{ id: 1, name: 'Personal', amount: '', interestRate: '', duration: '' }],
      initialCosts: {
        refurbRepair: '',
        legal: '',
        stampDutyPercent: '',
        ila: '',
        brokerFees: '',
        findersFee: ''
      },
      purchaseFinance: {
        purchasePrice: estimatedValue > 0 ? estimatedValue.toString() : '',
        deposit: '',
        ltv: '75',
        loanAmount: '',
        productFee: '',
        interestRate: ''
      },
      monthlyIncome: {
        rent1: '',
        rent2: '',
        rent3: '',
        rent4: '',
        rent5: ''
      },
      monthlyExpenses: {
        serviceCharge: '',
        groundRent: '',
        maintenancePercent: '',
        managementPercent: '',
        insurance: '',
        mortgagePayment: ''
      },
      propertyValue: ''
    }
    
    // Save default calculator data immediately
    saveCalculatorData(analysisId, defaultCalculatorData)
    console.log('Saved default calculator data with pre-filled values')
    
    // Store only user-generated data and metadata in recentAnalyses
    const analysis: RecentAnalysis = {
      id: analysisId,
      searchDate: new Date().toISOString(),
      comparables: [],
      filters: {
        propertyType: '',
        minBeds: '',
        maxBeds: '',
        minBaths: '',
        maxBaths: ''
      }
    }

    setRecentAnalyses(prev => {
      // Remove any existing analysis for the same property (by checking if data exists in propertyDataStore)
      // We can't check by address/postcode anymore since we don't store them
      // Just add to the beginning and limit to 10 most recent
      const updated = [analysis, ...prev].slice(0, 10)
      
      try {
        localStorage.setItem('recentAnalyses', JSON.stringify(updated))
        console.log('Saved lightweight analysis list to localStorage')
      } catch (e) {
        console.error('Failed to save recent analyses:', e)
      }
      
      return updated
    })
    
    return analysisId
  }

  const loadRecentAnalysis = (analysis: RecentAnalysis) => {
    console.log('Loading analysis:', analysis.id, 'with comparables:', analysis.comparables)
    
    // Navigate to the details page instead of loading on the same page
    router.push(`/details/${analysis.id}`)
  }

  const clearRecentAnalyses = () => {
    setRecentAnalyses([])
    try {
      localStorage.removeItem('recentAnalyses')
    } catch (e) {
      console.error('Failed to clear recent analyses', e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !postcode) return

    // Check if we already have this property in propertyDataStore
    const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
    const existingId = Object.keys(propertyDataStore).find(id => {
      const data = propertyDataStore[id]
      const storedAddress = data?.data?.attributes?.address?.street_group_format?.address_lines || ''
      const storedPostcode = data?.data?.attributes?.address?.street_group_format?.postcode || ''
      return storedAddress.toLowerCase().trim() === address.toLowerCase().trim() && 
             storedPostcode.toLowerCase().trim() === postcode.toLowerCase().trim()
    })

    if (existingId) {
      // Navigate to existing analysis details page
      router.push(`/details/${existingId}`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, postcode }),
      })
      
      const data = await response.json()
      
      // Save to recent analyses and get the analysis ID
      const analysisId = saveToRecentAnalyses(data, address, postcode)
      
      // Navigate to the new analysis details page
      console.log('Navigating to details page with UID:', analysisId)
      router.push(`/details/${analysisId}`)
    } catch (error) {
      console.error('Error fetching property data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <div className="space-y-6">
              {/* Search Form */}
              <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter property address"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="postcode" className="block text-sm font-medium text-gray-300 mb-2">
                        Postcode
                      </label>
                      <input
                        type="text"
                        id="postcode"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter postcode"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    {loading ? 'Finding Property...' : 'Find Property'}
                  </button>
                </form>
              </div>

              {/* Recent Analyses Section */}
              {recentAnalyses.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 animate-enter-subtle-delayed">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Recent Properties ({recentAnalyses.length})</h2>
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
              )}
            </div>
        </div>
      </div>
    </main>
  )
}
