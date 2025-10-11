'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from './components/Header'
import { saveCalculatorData, type CalculatorData } from '../lib/persistence'

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

export default function Home() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)

  const saveToRecentAnalyses = (data: any, searchAddress: string, searchPostcode: string) => {
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

    try {
      const savedAnalyses = localStorage.getItem('recentAnalyses')
      const analyses = savedAnalyses ? JSON.parse(savedAnalyses) : []
      // Add to the beginning and limit to 10 most recent
      const updated = [analysis, ...analyses].slice(0, 10)
      localStorage.setItem('recentAnalyses', JSON.stringify(updated))
      console.log('Saved lightweight analysis list to localStorage')
    } catch (e) {
      console.error('Failed to save recent analyses:', e)
    }
    
    return analysisId
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

              {/* Action Menu Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-enter-subtle-delayed">
                {/* Recent Searches */}
                <button
                  type="button"
                  onClick={() => router.push('/recent')}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors border-2 border-gray-700 hover:border-blue-600 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Recent Searches</h3>
                      <p className="text-gray-400 text-sm mt-1">View search history</p>
                    </div>
                  </div>
                </button>

                {/* Manage Lists */}
                <button
                  type="button"
                  onClick={() => router.push('/lists')}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors border-2 border-gray-700 hover:border-green-600 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 group-hover:bg-green-500 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Manage Lists</h3>
                      <p className="text-gray-400 text-sm mt-1">Organize properties</p>
                    </div>
                  </div>
                </button>

                {/* Tasks */}
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement Tasks action
                    console.log('Tasks clicked')
                  }}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors border-2 border-gray-700 hover:border-red-600 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-600 group-hover:bg-red-500 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Tasks</h3>
                      <p className="text-gray-400 text-sm mt-1">Powered by Todoist</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
        </div>
      </div>
    </main>
  )
}
