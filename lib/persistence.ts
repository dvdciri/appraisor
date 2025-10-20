// Persistence utilities for database storage
const STORAGE_KEYS = {
  PROPERTY_DATA: 'estimo_property_data', // DEPRECATED - kept for migration
  CALCULATOR_DATA: 'estimo_calculator_data',
  // New storage keys
  PROPERTIES: 'estimo_properties', // Generic property data (keyed by UPRN)
  USER_ANALYSES: 'estimo_user_analyses', // User-specific analyses (keyed by analysisId)
  RECENT_ANALYSES: 'estimo_recent_analyses' // List of recent analysis IDs
} as const

// ============================================================================
// NEW DATA STRUCTURE - Separates generic property data from user-specific data
// ============================================================================

// Generic property data stored by UPRN (shared across all users)
export interface GenericPropertyData {
  data: any  // Full API response
  lastFetched: number
  fetchedCount: number
}

export interface PropertiesStore {
  [uprn: string]: GenericPropertyData
}

// User-specific analysis data
export interface UserAnalysis {
  uprn: string  // Reference to property in PropertiesStore
  searchAddress: string
  searchPostcode: string
  timestamp: number
}

export interface UserAnalysesStore {
  [analysisId: string]: UserAnalysis
}

// Recent analyses list (for quick access)
export interface RecentAnalysisItem {
  analysisId: string
  timestamp: number
}

// ============================================================================
// DEPRECATED - Kept for migration only
// ============================================================================

export interface PersistedPropertyData {
  data: any
  lastUpdated: number
}

// REMOVED: Deprecated PropertyDataStoreItem interface

// REMOVED: Deprecated PropertyDataStore interface

export interface CalculatorData {
  notes?: string
  purchaseType: 'mortgage' | 'cash' | 'bridging'
  includeFeesInLoan: boolean
  bridgingDetails: {
    loanType: 'serviced' | 'retained'
    duration: string
    grossLoanPercent: string
    monthlyInterest: string
    applicationFee: string
  }
  exitStrategy: 'just-rent' | 'refinance-rent' | 'flip-sell' | null
  refinanceDetails: {
    expectedGDV: string
    newLoanLTV: string
    interestRate: string
    brokerFees: string
    legalFees: string
  }
  saleDetails: {
    expectedSalePrice: string
    agencyFeePercent: string
    legalFees: string
  }
  refurbItems: Array<{ id: number; description: string; amount: string }>
  fundingSources: Array<{ id: number; name: string; amount: string; interestRate: string; duration: string }>
  initialCosts: {
    refurbRepair: string
    legal: string
    stampDutyPercent: string
    ila: string
    brokerFees: string
    auctionFees: string
    findersFee: string
  }
  purchaseFinance: {
    purchasePrice: string
    deposit: string
    ltv: string
    loanAmount: string
    productFee: string
    interestRate: string
  }
  monthlyIncome: {
    rent1: string
    rent2: string
    rent3: string
    rent4: string
    rent5: string
  }
  monthlyExpenses: {
    serviceCharge: string
    groundRent: string
    maintenancePercent: string
    managementPercent: string
    insurance: string
    mortgagePayment: string
  }
  propertyValue: string
}

export interface PersistedCalculatorData {
  [propertyId: string]: {
    data: CalculatorData
    lastUpdated: number
  }
}


// REMOVED: Deprecated local storage functions


// REMOVED: Deprecated property data persistence functions


// Calculator data persistence (per property) - now using API routes
export async function saveCalculatorData(propertyId: string, calculatorData: CalculatorData): Promise<void> {
  if (!propertyId) return
  
  try {
    const response = await fetch('/api/db/calculator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId: propertyId,
        data: calculatorData
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save calculator data: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to save calculator data to database:', error)
    throw error
  }
}

export async function loadCalculatorData(propertyId: string): Promise<CalculatorData | null> {
  if (!propertyId) return null
  
  try {
    const response = await fetch(`/api/db/calculator?id=${encodeURIComponent(propertyId)}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calculator data: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Failed to fetch calculator data from database:', error)
    return null
  }
}

// Clear all persisted data
export function clearAllPersistedData(): void {
  // localStorage cleanup no longer needed - using database only
}


// REMOVED: Deprecated property data store functions

// Delete a property from database
export async function deleteProperty(propertyId: string): Promise<void> {
  // Remove from user analyses (this will cascade delete calculator data)
  await deleteUserAnalysis(propertyId)
}

// ============================================================================
// NEW STORAGE FUNCTIONS
// ============================================================================

// Extract UPRN from property data
export function extractUPRN(propertyData: any): string | null {
  try {
    return propertyData?.data?.attributes?.identities?.ordnance_survey?.uprn || null
  } catch (e) {
    console.error('Failed to extract UPRN:', e)
    return null
  }
}

// Generic Properties Store (keyed by UPRN) - now using API routes
export async function loadPropertiesStore(): Promise<PropertiesStore> {
  // This function is kept for backward compatibility
  console.warn('loadPropertiesStore is deprecated, use getGenericProperty instead')
  return {}
}

export async function savePropertiesStore(store: PropertiesStore): Promise<void> {
  // This function is kept for backward compatibility
  console.warn('savePropertiesStore is deprecated, use saveGenericProperty instead')
}

export async function saveGenericProperty(uprn: string, propertyData: any): Promise<void> {
  if (!uprn) return
  
  try {
    const response = await fetch('/api/db/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uprn,
        data: propertyData,
        lastFetched: Date.now(),
        fetchedCount: 1
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save property: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to save property to database:', error)
    throw error
  }
}

export async function getGenericProperty(uprn: string): Promise<GenericPropertyData | null> {
  if (!uprn) return null
  
  try {
    const response = await fetch(`/api/db/properties?uprn=${encodeURIComponent(uprn)}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      data: data.data,
      lastFetched: new Date(data.lastFetched).getTime(),
      fetchedCount: data.fetchedCount
    }
  } catch (error) {
    console.error('Failed to fetch property from database:', error)
    return null
  }
}

// User Analyses Store (keyed by analysisId) - now using API routes
export async function loadUserAnalysesStore(): Promise<UserAnalysesStore> {
  // This function is kept for backward compatibility
  console.warn('loadUserAnalysesStore is deprecated, use getUserAnalysis instead')
  return {}
}

export async function saveUserAnalysesStore(store: UserAnalysesStore): Promise<void> {
  // This function is kept for backward compatibility
  console.warn('saveUserAnalysesStore is deprecated, use saveUserAnalysis instead')
}

export async function saveUserAnalysis(analysisId: string, analysis: UserAnalysis): Promise<void> {
  if (!analysisId) return
  
  try {
    const payload = {
      analysisId,
      uprn: analysis.uprn,
      searchAddress: analysis.searchAddress,
      searchPostcode: analysis.searchPostcode,
      timestamp: analysis.timestamp
    }
    
    
    const response = await fetch('/api/db/analyses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Analysis API error response:', errorText)
      
      throw new Error(`Failed to save analysis: ${response.statusText} - ${errorText}`)
    }
  } catch (error) {
    console.error('Failed to save analysis to database:', error)
    throw error
  }
}

export async function getUserAnalysis(analysisId: string): Promise<UserAnalysis | null> {
  if (!analysisId) return null
  
  try {
    const response = await fetch(`/api/db/analyses?id=${encodeURIComponent(analysisId)}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: ${response.statusText}`)
    }
    
    const data = await response.json()
    // Helper function to safely convert timestamp
    const safeTimestamp = (ts: any): number | undefined => {
      if (!ts) return undefined
      try {
        const timestamp = typeof ts === 'number' ? ts : parseInt(ts)
        if (isNaN(timestamp) || timestamp <= 0) return undefined
        // Validate timestamp is reasonable
        const now = Date.now()
        const minTimestamp = now - (10 * 365 * 24 * 60 * 60 * 1000) // 10 years ago
        const maxTimestamp = now + (1 * 365 * 24 * 60 * 60 * 1000) // 1 year from now
        if (timestamp < minTimestamp || timestamp > maxTimestamp) return undefined
        return timestamp
      } catch {
        return undefined
      }
    }

    return {
      uprn: data.uprn,
      searchAddress: data.searchAddress,
      searchPostcode: data.searchPostcode,
      timestamp: safeTimestamp(data.timestamp) || Date.now()
    }
  } catch (error) {
    console.error('Failed to fetch analysis from database:', error)
    return null
  }
}

export async function updateUserAnalysis(analysisId: string, updates: Partial<UserAnalysis>): Promise<void> {
  if (!analysisId) return
  
  // Get existing analysis and merge with updates
  const existing = await getUserAnalysis(analysisId)
  if (existing) {
    const updated = { ...existing, ...updates }
    await saveUserAnalysis(analysisId, updated)
  }
}

export async function deleteUserAnalysis(analysisId: string): Promise<void> {
  if (!analysisId) return
  
  try {
    const response = await fetch(`/api/db/analyses?id=${encodeURIComponent(analysisId)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete analysis: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to delete analysis from database:', error)
    throw error
  }
}

// Recent Analyses List - now using API routes
export async function loadRecentAnalyses(): Promise<RecentAnalysisItem[]> {
  try {
    const response = await fetch('/api/db/analyses?recent=true')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent analyses: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.map((item: any) => ({
      analysisId: item.analysis_id,
      timestamp: new Date(item.timestamp).getTime()
    }))
  } catch (error) {
    console.error('Failed to fetch recent analyses from database:', error)
    return []
  }
}

export async function saveRecentAnalyses(analyses: RecentAnalysisItem[]): Promise<void> {
  // This function is kept for backward compatibility
  console.warn('saveRecentAnalyses is deprecated, recent analyses are managed automatically')
}

export async function addToRecentAnalyses(analysisId: string): Promise<void> {
  // Recent analyses are now managed automatically by the saveUserAnalysis function
  console.warn('addToRecentAnalyses is deprecated, recent analyses are managed automatically')
}

export async function removeFromRecentAnalyses(analysisId: string): Promise<void> {
  // Recent analyses are now managed automatically by the deleteUserAnalysis function
  console.warn('removeFromRecentAnalyses is deprecated, recent analyses are managed automatically')
}

// Get full analysis data (combines property data + user analysis) - now async
export async function getFullAnalysisData(analysisId: string): Promise<{ propertyData: any, userAnalysis: UserAnalysis } | null> {
  try {
    const userAnalysis = await getUserAnalysis(analysisId)
    if (!userAnalysis) return null
    
    const genericProperty = await getGenericProperty(userAnalysis.uprn)
    if (!genericProperty) return null
    
    return {
      propertyData: genericProperty.data,
      userAnalysis
    }
  } catch (error) {
    console.error('Failed to fetch full analysis data from database:', error)
    return null
  }
}

