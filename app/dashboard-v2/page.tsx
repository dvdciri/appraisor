'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardHeader from './components/DashboardHeader'
import Sidebar from './components/Sidebar'
import DashboardTabs, { type Tab, type TabMeasurements } from './components/DashboardTabs'
import TabContent from './components/TabContent'

export default function DashboardV2Page() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'tab-1', title: 'Search', propertyUPRN: null }
  ])
  const [activeTabId, setActiveTabId] = useState<string>('tab-1')
  const [activeTabMeasurements, setActiveTabMeasurements] = useState<TabMeasurements | null>(null)
  const [isLoadingTabs, setIsLoadingTabs] = useState(true)
  const hasLoadedTabs = useRef(false)
  // Cache property data by UPRN to avoid refetching when switching tabs
  const [propertyDataCache, setPropertyDataCache] = useState<Map<string, any>>(new Map())
  const fetchingUPRNs = useRef<Set<string>>(new Set())

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // Load tabs from database on mount
  useEffect(() => {
    if (status === 'loading' || !session || hasLoadedTabs.current) return

    const loadTabs = async () => {
      try {
        const response = await fetch('/api/db/tabs')
        if (response.ok) {
          const data = await response.json()
          if (data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
            setTabs(data.tabs)
            if (data.activeTabId) {
              setActiveTabId(data.activeTabId)
            }
          }
        }
      } catch (error) {
        console.error('Error loading tabs:', error)
      } finally {
        setIsLoadingTabs(false)
        hasLoadedTabs.current = true
      }
    }

    loadTabs()
  }, [session, status])

  // Save tabs to database whenever they change
  useEffect(() => {
    if (status === 'loading' || !session || !hasLoadedTabs.current) return

    const saveTabs = async () => {
      try {
        await fetch('/api/db/tabs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tabs,
            activeTabId,
          }),
        })
      } catch (error) {
        console.error('Error saving tabs:', error)
      }
    }

    // Debounce saves to avoid too many requests
    const timeoutId = setTimeout(saveTabs, 300)
    return () => clearTimeout(timeoutId)
  }, [tabs, activeTabId, session, status])

  // Get the active tab (needed for the useEffect below)
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0]

  // Fetch property data for active tab if not in cache
  useEffect(() => {
    const uprn = activeTab?.propertyUPRN
    if (!uprn) return

    // Check if data is already in cache or currently being fetched
    const cacheHasData = propertyDataCache.has(uprn)
    const isFetching = fetchingUPRNs.current.has(uprn)
    
    if (cacheHasData || isFetching) {
      return
    }

    // Mark as fetching
    fetchingUPRNs.current.add(uprn)

    // Fetch property data from database
    const fetchPropertyData = async () => {
      try {
        const response = await fetch(`/api/properties/${encodeURIComponent(uprn)}`)
        if (response.ok) {
          const data = await response.json()
          // Cache the property data
          setPropertyDataCache(prev => {
            const newCache = new Map(prev)
            newCache.set(uprn, data)
            return newCache
          })
        }
      } catch (error) {
        console.error('Error fetching property data:', error)
      } finally {
        // Remove from fetching set
        fetchingUPRNs.current.delete(uprn)
      }
    }

    fetchPropertyData()
    // Only depend on propertyUPRN - cache check happens inside effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.propertyUPRN])

  // Get cached property data for active tab
  const activeTabPropertyData = activeTab?.propertyUPRN 
    ? propertyDataCache.get(activeTab.propertyUPRN) 
    : null

  // Show loading while checking authentication or loading tabs
  if (status === 'loading' || isLoadingTabs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-bg-subtle border-t-accent"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  // Generate unique tab ID
  const generateTabId = () => {
    return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Add a new tab
  const handleAddTab = () => {
    const newTab: Tab = {
      id: generateTabId(),
      title: 'Search',
      propertyUPRN: null
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  // Remove a tab
  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent tab click event
    
    if (tabs.length === 1) {
      // Don't allow closing the last tab
      return
    }

    const tabIndex = tabs.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return

    const newTabs = tabs.filter(tab => tab.id !== tabId)
    setTabs(newTabs)

    // If we closed the active tab, switch to another tab
    if (activeTabId === tabId) {
      // Try to activate the next tab, or previous tab if we closed the last one
      const newActiveTab = newTabs[tabIndex] || newTabs[tabIndex - 1] || newTabs[0]
      setActiveTabId(newActiveTab.id)
    }
  }

  // Switch to a tab
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId)
  }

  // Handle property selection
  const handlePropertySelected = (uprn: string, address: string) => {
    // Update the active tab with the property UPRN and set title to address only
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, propertyUPRN: uprn, title: address }
          : tab
      )
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900">
      {/* Background effects similar to search page */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-700/30 via-purple-900/20 to-transparent" />
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 22% 32%, rgba(139, 92, 246, 0.25) 0%, transparent 55%),
            radial-gradient(ellipse 70% 45% at 78% 68%, rgba(59, 130, 246, 0.20) 0%, transparent 55%)
          `
        }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Header */}
        <DashboardHeader />

        {/* Main Layout: Sidebar (25%) + Tabbed Area (75%) */}
        <div className="flex flex-1 min-h-0 gap-6 px-6 pb-6">
          {/* Left Sidebar - 25% */}
          <Sidebar propertyUPRN={activeTab?.propertyUPRN} propertyData={activeTabPropertyData} />

          {/* Right Tabbed Area - 75% */}
          <main className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="h-full w-full flex flex-col min-h-0 min-w-0">
              {/* Tab Bar - Floating at top */}
              <DashboardTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={handleTabClick}
                onTabClose={handleTabClose}
                onAddTab={handleAddTab}
                onActiveTabMeasure={setActiveTabMeasurements}
              />

              {/* Main Panel Container - Borders on all sides, top-right rounded corner */}
              <div 
                className="flex-1 flex flex-col min-h-0 rounded-b-2xl rounded-tr-2xl shadow-2xl backdrop-blur-xl border border-gray-500/30 bg-black/20 overflow-hidden relative"
              >
               
                {/* Tab Content Area */}
                <div className="flex-1 overflow-hidden bg-black/20">
                  <TabContent 
                    key={activeTabId} 
                    propertyUPRN={activeTab?.propertyUPRN} 
                    propertyData={activeTabPropertyData}
                    onPropertySelected={handlePropertySelected}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

