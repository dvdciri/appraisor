// Persistence utilities for localStorage
const STORAGE_KEYS = {
  PROPERTY_DATA: 'estimo_property_data', // DEPRECATED - kept for migration
  CALCULATOR_DATA: 'estimo_calculator_data',
  PROPERTY_LISTS: 'estimo_property_lists',
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
  
  // Selected comparables for this analysis
  selectedComparables: string[]
  
  // Calculated values specific to this analysis
  calculatedValuation?: number
  valuationBasedOnComparables?: number
  lastValuationUpdate?: number
  
  calculatedRent?: number
  rentBasedOnComparables?: number
  lastRentUpdate?: number
  
  calculatedYield?: number
  lastYieldUpdate?: number
  
  // Filter settings used
  filters: {
    propertyType: string
    minBeds: string
    maxBeds: string
    minBaths: string
    maxBaths: string
  }
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

// Extended property data stored in propertyDataStore
// This includes the full property data plus additional calculated fields
export interface PropertyDataStoreItem {
  data: {
    attributes: any
  }
  // Calculated valuation based on selected comparable sales
  calculatedValuation?: number
  // Number of comparables used for the valuation calculation
  valuationBasedOnComparables?: number
  // Timestamp of when the valuation was last calculated
  lastValuationUpdate?: number
  // Calculated rental value based on rental comparables
  calculatedRent?: number
  // Number of rental comparables used for rent calculation
  rentBasedOnComparables?: number
  // Timestamp of when the rent was last calculated
  lastRentUpdate?: number
  // Calculated yield percentage (annual return)
  calculatedYield?: number
  // Timestamp of when the yield was last calculated
  lastYieldUpdate?: number
  [key: string]: any
}

export interface PropertyDataStore {
  [propertyId: string]: PropertyDataStoreItem
}

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

export interface PropertyList {
  id: string
  name: string
  propertyIds: string[]
  createdAt: number
  updatedAt: number
  order?: number
}

export interface PropertyLists {
  [listId: string]: PropertyList
}

// Generic storage functions
export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error)
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error)
    return defaultValue
  }
}


// Property data persistence
export function savePropertyData(propertyData: any): void {
  const data: PersistedPropertyData = {
    data: propertyData,
    lastUpdated: Date.now()
  }
  saveToStorage(STORAGE_KEYS.PROPERTY_DATA, data)
}

export function loadPropertyData(): any | null {
  const data = loadFromStorage<PersistedPropertyData>(STORAGE_KEYS.PROPERTY_DATA, {
    data: null,
    lastUpdated: 0
  })
  return data.data
}


// Calculator data persistence (per property)
export function saveCalculatorData(propertyId: string, calculatorData: CalculatorData): void {
  if (!propertyId) return
  
  const allData = loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  
  allData[propertyId] = {
    data: calculatorData,
    lastUpdated: Date.now()
  }
  
  saveToStorage(STORAGE_KEYS.CALCULATOR_DATA, allData)
}

export function loadCalculatorData(propertyId: string): CalculatorData | null {
  if (!propertyId) return null
  
  const allData = loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  
  return allData[propertyId]?.data || null
}

// Clear all persisted data
export function clearAllPersistedData(): void {
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

// Property lists persistence
export function loadPropertyLists(): PropertyLists {
  return loadFromStorage<PropertyLists>(STORAGE_KEYS.PROPERTY_LISTS, {})
}

export function savePropertyLists(lists: PropertyLists): void {
  saveToStorage(STORAGE_KEYS.PROPERTY_LISTS, lists)
}

export function createPropertyList(name: string): PropertyList {
  const lists = loadPropertyLists()
  const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newList: PropertyList = {
    id,
    name,
    propertyIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  lists[id] = newList
  savePropertyLists(lists)
  
  return newList
}

export function addPropertyToList(listId: string, propertyId: string): boolean {
  const lists = loadPropertyLists()
  const list = lists[listId]
  
  if (!list) return false
  
  // Don't add if already in list
  if (list.propertyIds.includes(propertyId)) return false
  
  list.propertyIds.push(propertyId)
  list.updatedAt = Date.now()
  
  savePropertyLists(lists)
  return true
}

export function removePropertyFromList(listId: string, propertyId: string): boolean {
  const lists = loadPropertyLists()
  const list = lists[listId]
  
  if (!list) return false
  
  const index = list.propertyIds.indexOf(propertyId)
  if (index === -1) return false
  
  list.propertyIds.splice(index, 1)
  list.updatedAt = Date.now()
  
  savePropertyLists(lists)
  return true
}

export function deletePropertyList(listId: string): boolean {
  const lists = loadPropertyLists()
  
  if (!lists[listId]) return false
  
  delete lists[listId]
  savePropertyLists(lists)
  return true
}

export function getPropertyList(listId: string): PropertyList | null {
  const lists = loadPropertyLists()
  return lists[listId] || null
}

export function getAllPropertyLists(): PropertyList[] {
  const lists = loadPropertyLists()
  return Object.values(lists).sort((a, b) => {
    // Sort by order if both have it, otherwise fall back to updatedAt
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    // If only one has order, prioritize it
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    // Fall back to updatedAt (most recent first)
    return b.updatedAt - a.updatedAt
  })
}

// Property data store helpers
export function loadPropertyDataStore(): PropertyDataStore {
  return loadFromStorage<PropertyDataStore>('propertyDataStore', {})
}

export function savePropertyDataStore(store: PropertyDataStore): void {
  saveToStorage('propertyDataStore', store)
}

export function getPropertyFromStore(propertyId: string): PropertyDataStoreItem | null {
  const store = loadPropertyDataStore()
  return store[propertyId] || null
}

export function updatePropertyInStore(propertyId: string, updates: Partial<PropertyDataStoreItem>): void {
  const store = loadPropertyDataStore()
  if (store[propertyId]) {
    store[propertyId] = { ...store[propertyId], ...updates }
    savePropertyDataStore(store)
  }
}

// Delete a property from all storage locations
export function deleteProperty(propertyId: string): void {
  if (typeof window === 'undefined') return
  
  // Remove from propertyDataStore (legacy)
  const store = loadPropertyDataStore()
  delete store[propertyId]
  savePropertyDataStore(store)
  
  // Remove from recentAnalyses (legacy)
  try {
    const savedAnalyses = localStorage.getItem('recentAnalyses')
    if (savedAnalyses) {
      const analyses = JSON.parse(savedAnalyses)
      const filtered = analyses.filter((a: any) => a.id !== propertyId)
      localStorage.setItem('recentAnalyses', JSON.stringify(filtered))
    }
  } catch (e) {
    console.error('Failed to remove from recentAnalyses:', e)
  }
  
  // Remove from new user analyses store
  deleteUserAnalysis(propertyId)
  
  // Remove from calculator data
  const allCalculatorData = loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  delete allCalculatorData[propertyId]
  saveToStorage(STORAGE_KEYS.CALCULATOR_DATA, allCalculatorData)
  
  // Remove from all property lists
  const lists = loadPropertyLists()
  Object.values(lists).forEach(list => {
    const index = list.propertyIds.indexOf(propertyId)
    if (index !== -1) {
      list.propertyIds.splice(index, 1)
      list.updatedAt = Date.now()
    }
  })
  savePropertyLists(lists)
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

// Generic Properties Store (keyed by UPRN)
export function loadPropertiesStore(): PropertiesStore {
  return loadFromStorage<PropertiesStore>(STORAGE_KEYS.PROPERTIES, {})
}

export function savePropertiesStore(store: PropertiesStore): void {
  saveToStorage(STORAGE_KEYS.PROPERTIES, store)
}

export function saveGenericProperty(uprn: string, propertyData: any): void {
  if (!uprn) return
  
  const store = loadPropertiesStore()
  const existing = store[uprn]
  
  store[uprn] = {
    data: propertyData,
    lastFetched: Date.now(),
    fetchedCount: (existing?.fetchedCount || 0) + 1
  }
  
  savePropertiesStore(store)
}

export function getGenericProperty(uprn: string): GenericPropertyData | null {
  if (!uprn) return null
  const store = loadPropertiesStore()
  return store[uprn] || null
}

// User Analyses Store (keyed by analysisId)
export function loadUserAnalysesStore(): UserAnalysesStore {
  return loadFromStorage<UserAnalysesStore>(STORAGE_KEYS.USER_ANALYSES, {})
}

export function saveUserAnalysesStore(store: UserAnalysesStore): void {
  saveToStorage(STORAGE_KEYS.USER_ANALYSES, store)
}

export function saveUserAnalysis(analysisId: string, analysis: UserAnalysis): void {
  if (!analysisId) return
  
  const store = loadUserAnalysesStore()
  store[analysisId] = analysis
  saveUserAnalysesStore(store)
  
  // Also update recent analyses list
  addToRecentAnalyses(analysisId)
}

export function getUserAnalysis(analysisId: string): UserAnalysis | null {
  if (!analysisId) return null
  const store = loadUserAnalysesStore()
  return store[analysisId] || null
}

export function updateUserAnalysis(analysisId: string, updates: Partial<UserAnalysis>): void {
  if (!analysisId) return
  
  const store = loadUserAnalysesStore()
  if (store[analysisId]) {
    store[analysisId] = { ...store[analysisId], ...updates }
    saveUserAnalysesStore(store)
  }
}

export function deleteUserAnalysis(analysisId: string): void {
  if (!analysisId) return
  
  const store = loadUserAnalysesStore()
  delete store[analysisId]
  saveUserAnalysesStore(store)
  
  // Also remove from recent analyses
  removeFromRecentAnalyses(analysisId)
}

// Recent Analyses List
export function loadRecentAnalyses(): RecentAnalysisItem[] {
  return loadFromStorage<RecentAnalysisItem[]>(STORAGE_KEYS.RECENT_ANALYSES, [])
}

export function saveRecentAnalyses(analyses: RecentAnalysisItem[]): void {
  saveToStorage(STORAGE_KEYS.RECENT_ANALYSES, analyses)
}

export function addToRecentAnalyses(analysisId: string): void {
  const recent = loadRecentAnalyses()
  
  // Remove if already exists
  const filtered = recent.filter(item => item.analysisId !== analysisId)
  
  // Add to beginning
  const updated = [
    { analysisId, timestamp: Date.now() },
    ...filtered
  ].slice(0, 50) // Keep last 50
  
  saveRecentAnalyses(updated)
}

export function removeFromRecentAnalyses(analysisId: string): void {
  const recent = loadRecentAnalyses()
  const filtered = recent.filter(item => item.analysisId !== analysisId)
  saveRecentAnalyses(filtered)
}

// Get full analysis data (combines property data + user analysis)
export function getFullAnalysisData(analysisId: string): { propertyData: any, userAnalysis: UserAnalysis } | null {
  const userAnalysis = getUserAnalysis(analysisId)
  if (!userAnalysis) return null
  
  const genericProperty = getGenericProperty(userAnalysis.uprn)
  if (!genericProperty) return null
  
  return {
    propertyData: genericProperty.data,
    userAnalysis
  }
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

export function migrateOldDataToNewStructure(): { success: boolean, migrated: number, errors: string[] } {
  if (typeof window === 'undefined') return { success: false, migrated: 0, errors: ['Not in browser environment'] }
  
  const errors: string[] = []
  let migrated = 0
  
  try {
    // Check if migration already done
    const migrationFlag = localStorage.getItem('estimo_migration_completed')
    if (migrationFlag === 'true') {
      console.log('Migration already completed')
      return { success: true, migrated: 0, errors: [] }
    }
    
    // Migrate propertyDataStore
    const oldStore = loadPropertyDataStore()
    const oldAnalyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
    
    console.log(`Migrating ${Object.keys(oldStore).length} properties from old structure...`)
    
    Object.entries(oldStore).forEach(([analysisId, propertyItem]) => {
      try {
        // Extract UPRN
        const uprn = extractUPRN(propertyItem)
        if (!uprn) {
          errors.push(`No UPRN found for analysis ${analysisId}`)
          return
        }
        
        // Save generic property data (only if not already saved)
        const existingProperty = getGenericProperty(uprn)
        if (!existingProperty) {
          saveGenericProperty(uprn, propertyItem.data || propertyItem)
        }
        
        // Find matching recent analysis for metadata
        const recentAnalysis = oldAnalyses.find((a: any) => a.id === analysisId)
        
        // Create user analysis
        const userAnalysis: UserAnalysis = {
          uprn,
          searchAddress: '',
          searchPostcode: '',
          timestamp: recentAnalysis?.searchDate ? new Date(recentAnalysis.searchDate).getTime() : Date.now(),
          selectedComparables: recentAnalysis?.comparables || [],
          calculatedValuation: propertyItem.calculatedValuation,
          valuationBasedOnComparables: propertyItem.valuationBasedOnComparables,
          lastValuationUpdate: propertyItem.lastValuationUpdate,
          calculatedRent: propertyItem.calculatedRent,
          rentBasedOnComparables: propertyItem.rentBasedOnComparables,
          lastRentUpdate: propertyItem.lastRentUpdate,
          calculatedYield: propertyItem.calculatedYield,
          lastYieldUpdate: propertyItem.lastYieldUpdate,
          filters: recentAnalysis?.filters || {
            propertyType: '',
            minBeds: '',
            maxBeds: '',
            minBaths: '',
            maxBaths: ''
          }
        }
        
        saveUserAnalysis(analysisId, userAnalysis)
        migrated++
      } catch (e) {
        errors.push(`Error migrating ${analysisId}: ${e}`)
      }
    })
    
    // Mark migration as complete
    localStorage.setItem('estimo_migration_completed', 'true')
    
    console.log(`Migration completed: ${migrated} properties migrated, ${errors.length} errors`)
    return { success: true, migrated, errors }
    
  } catch (e) {
    errors.push(`Migration failed: ${e}`)
    return { success: false, migrated, errors }
  }
}

// Run migration automatically on first load
export function autoMigrate(): void {
  if (typeof window === 'undefined') return
  
  const migrationFlag = localStorage.getItem('estimo_migration_completed')
  if (migrationFlag !== 'true') {
    console.log('Auto-migration starting...')
    const result = migrateOldDataToNewStructure()
    console.log('Auto-migration result:', result)
  }
}
