// Persistence utilities for localStorage
const STORAGE_KEYS = {
  PROPERTY_DATA: 'estimo_property_data',
  CALCULATOR_DATA: 'estimo_calculator_data'
} as const

export interface PersistedPropertyData {
  data: any
  lastUpdated: number
}

export interface CalculatorData {
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
