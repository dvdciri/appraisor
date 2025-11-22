'use client'

import { X, Search } from 'lucide-react'
import { useRef, useEffect } from 'react'

export interface Tab {
  id: string
  title: string
  propertyUPRN?: string | null
}

export interface TabMeasurements {
  width: number
  left: number
}

interface DashboardTabsProps {
  tabs: Tab[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string, e: React.MouseEvent) => void
  onAddTab: () => void
  onActiveTabMeasure?: (measurements: TabMeasurements | null) => void
}

export default function DashboardTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onAddTab,
  onActiveTabMeasure,
}: DashboardTabsProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLDivElement | null>(null)

  // Measure active tab dimensions
  useEffect(() => {
    const measureActiveTab = () => {
      if (!activeTabRef.current || !tabsContainerRef.current || !onActiveTabMeasure) {
        onActiveTabMeasure?.(null)
        return
      }

      const tabRect = activeTabRef.current.getBoundingClientRect()
      const containerRect = tabsContainerRef.current.getBoundingClientRect()

      // Calculate left position relative to container's visible area
      // Round to ensure pixel-perfect alignment and avoid sub-pixel rendering issues
      const left = tabRect.left - containerRect.left
      const width = tabRect.width
      
      const measurements: TabMeasurements = {
        width: Math.round(width),
        left: Math.round(left),
      }

      onActiveTabMeasure(measurements)
    }

    // Measure immediately and on resize
    measureActiveTab()

    const handleResize = () => {
      measureActiveTab()
    }

    const handleScroll = () => {
      measureActiveTab()
    }

    window.addEventListener('resize', handleResize)
    
    // Listen to scroll events on the tabs container
    const tabsContainer = tabsContainerRef.current
    if (tabsContainer) {
      tabsContainer.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    // Also measure after a short delay to catch any layout changes
    const timeoutId = setTimeout(measureActiveTab, 100)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (tabsContainer) {
        tabsContainer.removeEventListener('scroll', handleScroll)
      }
      clearTimeout(timeoutId)
    }
  }, [activeTabId, tabs, onActiveTabMeasure])

  // Get icon for tab based on title
  const getTabIcon = (title: string) => {
    if (title === 'Search') {
      return <Search className="w-3.5 h-3.5 text-white" />
    }
    return null
  }

  return (
    <div 
      ref={tabsContainerRef}
      className="flex items-end bg-transparent overflow-x-auto hide-scrollbar mb-0"
    >
      <div className="flex items-end h-full flex-shrink-0 gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onTabClick(tab.id)}
              className={`
                group relative flex items-center gap-2 pl-4 pr-2 h-10 cursor-pointer min-w-[120px] max-w-[200px] flex-shrink-0
                border-l border-r border-t border-gray-500/30
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-black/20 backdrop-blur-xl rounded-t-lg border-b-0 z-10 shadow-2xl'
                    : 'bg-gray-800/40 hover:bg-gray-700/50 rounded-t-lg border-b-0'
                }
              `}
            >
              {/* Tab icon */}
              {getTabIcon(tab.title)}
              
              {/* Tab title */}
              <span
                className={`
                  text-sm truncate flex-1 min-w-0
                  ${isActive ? 'text-white font-medium' : 'text-gray-500 group-hover:text-gray-400'}
                `}
                title={tab.title}
              >
                {tab.title}
              </span>

              {/* Close button - always visible like Chrome */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => onTabClose(tab.id, e)}
                  className={`
                    transition-colors
                    p-1 rounded hover:bg-gray-700/50
                    ${isActive ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-500'}
                  `}
                  aria-label="Close tab"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
        
        {/* Plus button to add new tab - appears right after the last tab */}
        <button
          onClick={onAddTab}
          className="
            flex items-center justify-center w-8 h-10 flex-shrink-0
            rounded-t-lg
            text-gray-500 hover:text-white
            transition-colors
          "
          aria-label="Add new tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

