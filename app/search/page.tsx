'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Toast from '../components/Toast'
import PostcodeSearch from '../components/PostcodeSearch'
import AddressSelector from '../components/AddressSelector'
import { 
  saveCalculatorData, 
  type CalculatorData,
  extractUPRN,
  saveGenericProperty
} from '../../lib/persistence'

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

type SearchStep = 'postcode' | 'address' | 'analyzing'

export default function SearchPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<SearchStep>('postcode')
  const [postcode, setPostcode] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPostcode, setSelectedPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState('53.4808,-2.2426') // Default to Manchester


  // Function to get coordinates from postcode
  const getCoordinatesFromPostcode = async (postcode: string) => {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`)
      if (response.ok) {
        const data = await response.json()
        if (data.result) {
          const { latitude, longitude } = data.result
          return `${latitude},${longitude}`
        }
      }
    } catch (error) {
      console.error('Error fetching coordinates for postcode:', error)
    }
    return null
  }

  const saveToRecentAnalyses = async (data: any, searchAddress: string, searchPostcode: string) => {
    const analysisId = generateUID()
    console.log('Creating new analysis with UID:', analysisId)
    
    // Extract UPRN from property data
    const uprn = extractUPRN(data)
    if (!uprn) {
      console.error('Failed to extract UPRN from property data')
      throw new Error('Property data missing UPRN')
    }

    // Save generic property data
    await saveGenericProperty(uprn, data)
    
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
    
    return analysisId
  }

  const handlePostcodeSubmit = async (submittedPostcode: string) => {
    setPostcode(submittedPostcode)
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // Get coordinates for the postcode to update map
      const coordinates = await getCoordinatesFromPostcode(submittedPostcode)
      if (coordinates) {
        setMapCenter(coordinates)
      }

      const response = await fetch(`/api/postcode/addresses?postcode=${encodeURIComponent(submittedPostcode)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to find addresses for this postcode')
        return
      }

      const data = await response.json()
      setAddresses(data.addresses || [])
      setCurrentStep('address')
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setErrorMessage('Failed to fetch addresses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = async (address: string, postcode: string) => {
    setSelectedAddress(address)
    setSelectedPostcode(postcode)
    setCurrentStep('analyzing')
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, postcode }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to find property. Please check the address and postcode and try again.')
        setCurrentStep('address')
        return
      }
      
      const data = await response.json()
      console.log('Property data received:', data)
      
      // Save to recent analyses
      const analysisId = await saveToRecentAnalyses(data, address, postcode)
      
      setSuccessMessage('Property found successfully! Redirecting to analysis...')
      
      // Redirect to analysis page
      setTimeout(() => {
        router.push(`/analyse/${analysisId}`)
      }, 1500)
      
    } catch (error) {
      console.error('Error analyzing property:', error)
      setErrorMessage('Failed to analyze property. Please try again.')
      setCurrentStep('address')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPostcode = () => {
    setCurrentStep('postcode')
    setAddresses([])
    setSelectedAddress('')
    setSelectedPostcode('')
    setErrorMessage(null)
    setMapCenter('53.4808,-2.2426') // Reset to Manchester
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'postcode':
        return (
          <div className="space-y-4">
            <PostcodeSearch
              onPostcodeSubmit={handlePostcodeSubmit}
              loading={loading}
              error={errorMessage}
            />
          </div>
        )
      
      case 'address':
        return (
          <AddressSelector
            postcode={postcode}
            addresses={addresses}
            onAddressSelect={handleAddressSelect}
            onBack={handleBackToPostcode}
            loading={loading}
          />
        )
      
      case 'analyzing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-bg-subtle border-t-accent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-fg-primary mb-2">Analyzing Property</h2>
            <p className="text-fg-muted">Please wait while we gather property information...</p>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Google Maps Static API Background - Ultra High Definition */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter}&zoom=12&size=3840x2160&maptype=roadmap&scale=2&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY})`,
          imageRendering: 'crisp-edges'
        }}
      />
      
      {/* Cosmic dark purple overlay for map */}
      <div className="absolute inset-0 z-10">
        {/* Deep Space Base - more visible */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-gray-900/60 to-purple-900/65" />
        
        {/* Nebula Core - more visible */}
        <div className="absolute inset-0 bg-gradient-radial from-purple-700/50 via-purple-900/30 to-transparent" />
        
        {/* Swirling Nebula Effect - more visible */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(ellipse 90% 55% at 22% 32%, rgba(139, 92, 246, 0.35) 0%, transparent 55%),
              radial-gradient(ellipse 70% 45% at 78% 68%, rgba(59, 130, 246, 0.25) 0%, transparent 55%),
              radial-gradient(ellipse 75% 65% at 52% 18%, rgba(168, 85, 247, 0.2) 0%, transparent 55%),
              radial-gradient(ellipse 55% 85% at 12% 78%, rgba(236, 72, 153, 0.15) 0%, transparent 55%)
            `
          }}
        />
        
        {/* Animated Cosmic Dust - more visible */}
        <div 
          className="absolute inset-0 opacity-50 animate-pulse"
          style={{
            background: `
              radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.08), transparent),
              radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.05), transparent),
              radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.08), transparent),
              radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.05), transparent),
              radial-gradient(2px 2px at 160px 30px, rgba(255, 255, 255, 0.08), transparent)
            `,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 100px'
          }}
        />
        
        {/* Dark Nebula Clouds - more visible */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 0% 0%, rgba(0, 0, 0, 0.4) 0%, transparent 70%),
              radial-gradient(ellipse 80% 100% at 100% 100%, rgba(0, 0, 0, 0.3) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0, 0, 0, 0.2) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Cosmic Glow Effects - more visible */}
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-gradient-radial from-purple-500/25 via-purple-600/15 to-transparent animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-[24rem] h-[24rem] bg-gradient-radial from-blue-500/20 via-blue-600/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[22rem] h-[22rem] bg-gradient-radial from-pink-500/18 via-pink-600/8 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Final overlay - transparent and blurry */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>
      
      {/* Floating Top Menu Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="relative rounded-2xl px-6 py-4 shadow-2xl overflow-hidden">
          {/* Solid transparent purple background for top bar */}
          <div className="absolute inset-0">
            {/* Solid transparent purple base */}
            <div className="absolute inset-0 bg-accent-foreground" />
            
            {/* Transparent blurry overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          </div>
          
          {/* Content with proper z-index */}
          <div className="relative z-10">
          <div className="flex items-center justify-between">
            {/* Left side - Appraisor branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Appraisor Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-white">Appraisor</span>
            </div>
            
            {/* Right side - Credits indicator and Profile avatar */}
            <div className="flex items-center gap-6">
              {/* Credits indicator */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span className="text-white font-medium text-sm">30 Credits available</span>
              </div>
              
              {/* Profile avatar with dropdown hint */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          </div>
        </div>
      </header>

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
      
      {/* Main Content */}
      <main className={`relative z-50 h-screen flex px-6 py-6 pt-32 pb-6 ${
        currentStep === 'postcode' ? 'items-center justify-center' : 'items-start justify-center'
      }`}>
        <div className="w-full max-w-2xl h-full flex flex-col">
          {/* Search Form */}
          <div className={`relative rounded-2xl p-8 shadow-2xl animate-search-enter-fast flex flex-col overflow-hidden ${
            currentStep === 'postcode' ? 'h-auto' : 'h-full'
          }`}>
            {/* Solid transparent purple background for search box */}
            <div className="absolute inset-0">
              {/* Solid transparent purple base */}
              <div className="absolute inset-0 bg-accent-foreground" />
              
              {/* Transparent blurry overlay */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            </div>
            
            {/* Content with proper z-index */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-center mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white mb-2">Search for a property</h1>
                <p className="text-gray-300 text-sm">
                  {currentStep === 'postcode' && 'Find comprehensive insights for any property'}
                  {currentStep === 'address' && 'Find comprehensive insights for any property'}
                  {currentStep === 'analyzing' && 'Analyzing your property...'}
                </p>
              </div>
              
              <div className={currentStep === 'postcode' ? 'flex flex-col' : 'flex-1 flex flex-col min-h-0'}>
                {renderCurrentStep()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
