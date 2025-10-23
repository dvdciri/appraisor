'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from './components/Toast'
import AddressAutocomplete from './components/AddressAutocomplete'
import { 
  saveCalculatorData, 
  type CalculatorData,
  extractUPRN,
  saveGenericProperty
} from '../lib/persistence'

// Generate a simple UID
const generateUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

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
      property_type?: {
        value: string
      }
      [key: string]: any
    }
  }
}


export default function Home() {
  const router = useRouter()
  const [fullAddress, setFullAddress] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPostcode, setSelectedPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSelectingFromAutocomplete, setIsSelectingFromAutocomplete] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [manualPostcode, setManualPostcode] = useState('')


  const saveToRecentAnalyses = async (data: any, searchAddress: string, searchPostcode: string) => {
    const analysisId = generateUID()
    console.log('Creating new analysis with UID:', analysisId)
    
    // Extract UPRN from property data
    const uprn = extractUPRN(data)
    if (!uprn) {
      console.error('Failed to extract UPRN from property data')
      throw new Error('Property data missing UPRN')
    }
    
    // Save generic property data (shared across all users)
    saveGenericProperty(uprn, data)
    
    // Create default calculator data with pre-filled values
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
        auctionFees: '',
        findersFee: ''
      },
      purchaseFinance: {
        purchasePrice: '',
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
    
    // Save default calculator data
    await saveCalculatorData(analysisId, defaultCalculatorData)
    
    return analysisId
  }

  const handleAddressSelect = (address: string, postcode: string) => {
    setIsSelectingFromAutocomplete(true)
    setSelectedAddress(address)
    setSelectedPostcode(postcode)
    // Don't change fullAddress here - let the component handle it
    console.log('Address selected:', { address, postcode })
  }

  const handleAddressChange = (value: string) => {
    setFullAddress(value)
    // Clear selected address if user types manually (not from autocomplete)
    if (!isSelectingFromAutocomplete) {
      setSelectedAddress('')
      setSelectedPostcode('')
    }
    // Reset the flag after handling the change
    setIsSelectingFromAutocomplete(false)
  }

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry)
    // Clear all form data when switching modes
    setFullAddress('')
    setSelectedAddress('')
    setSelectedPostcode('')
    setManualAddress('')
    setManualPostcode('')
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Determine which address and postcode to use based on entry mode
    const addressToUse = isManualEntry ? manualAddress.trim() : selectedAddress
    const postcodeToUse = isManualEntry ? manualPostcode.trim() : selectedPostcode
    
    console.log('Form submit - isManualEntry:', isManualEntry, 'address:', addressToUse, 'postcode:', postcodeToUse)
    
    // Validate inputs based on mode
    if (isManualEntry) {
      if (!manualAddress.trim() || !manualPostcode.trim()) {
        setErrorMessage('Please enter both address and postcode')
        return
      }
    } else {
      if (!selectedAddress || !selectedPostcode) {
        setErrorMessage('Please select an address from the suggestions')
        return
      }
    }

    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addressToUse, postcode: postcodeToUse }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to find property. Please check the address and postcode and try again.')
        return
      }
      
      const data = await response.json()
      
      // Check if data is valid
      if (!data || !data.data || !data.data.attributes) {
        setErrorMessage('Property not found. Please check the address and postcode and try again.')
        return
      }
      
      // Extract UPRN for property data storage
      const uprn = extractUPRN(data)
      
           if (uprn) {
             // Save property data to database
             await saveGenericProperty(uprn, data)
             console.log('Property data saved with UPRN:', uprn)
             // Navigate to dashboard instead of showing success message
             router.push(`/dashboard-v1/${uprn}`)
           } else {
             setErrorMessage('Failed to extract property identifier from the data.')
           }
    } catch (error) {
      console.error('Error fetching property data:', error)
      setErrorMessage('An error occurred while searching for the property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-app text-fg-primary">
      {/* Error Toast */}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Success Toast */}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Full page loading spinner */}
      {loading && (
        <div className="fixed inset-0 bg-bg-app bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-bg-subtle border-t-accent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-fg-primary mb-2">Finding Property</h2>
            <p className="text-fg-muted">Please wait while we search for your property...</p>
          </div>
        </div>
      )}
      
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Search Form */}
          <div className="bg-bg-elevated border border-border rounded-lg p-8 animate-enter-subtle">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-fg-primary mb-2">Property Analysis</h1>
              <p className="text-fg-muted">Enter a UK property address to get started</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isManualEntry ? (
                // Autocomplete mode
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-fg-primary mb-2">
                    Property Address
                  </label>
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    onChange={handleAddressChange}
                    value={fullAddress}
                    placeholder="Start typing address.."
                  />
                </div>
              ) : (
                // Manual entry mode
                <div className="space-y-4">
                  <div>
                    <label htmlFor="manual-address" className="block text-sm font-medium text-fg-primary mb-2">
                      Property Address
                    </label>
                    <input
                      type="text"
                      id="manual-address"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="e.g., 123 Main Street"
                      className="w-full px-4 py-3 bg-bg-subtle border border-border rounded-lg text-fg-primary placeholder-fg-muted focus:outline-none focus:shadow-focus"
                    />
                  </div>
                  <div>
                    <label htmlFor="manual-postcode" className="block text-sm font-medium text-fg-primary mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      id="manual-postcode"
                      value={manualPostcode}
                      onChange={(e) => setManualPostcode(e.target.value)}
                      placeholder="e.g., SW1A 1AA"
                      className="w-full px-4 py-3 bg-bg-subtle border border-border rounded-lg text-fg-primary placeholder-fg-muted focus:outline-none focus:shadow-focus"
                    />
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-fg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-opacity duration-200 focus:outline-none focus:shadow-focus"
              >
                Find Property
              </button>
              
              {/* Toggle link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleManualEntry}
                  className="text-sm text-fg-muted hover:text-fg-primary underline transition-colors duration-200"
                >
                  {isManualEntry 
                    ? "Use address autocomplete instead" 
                    : "Can't find your property? Enter details manually"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
