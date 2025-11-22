'use client'

import PropertySearch from './PropertySearch'

interface TabContentProps {
  propertyUPRN?: string | null
}

export default function TabContent({ propertyUPRN }: TabContentProps) {
  // If propertyUPRN is null/undefined, show search
  // If propertyUPRN has value, show property placeholder
  const isSearchMode = !propertyUPRN

  return (
    <div className="h-full flex items-start justify-center p-8 overflow-y-auto">
      {isSearchMode ? (
        <PropertySearch />
      ) : (
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 opacity-50">🏠</div>
          <h2 className="text-2xl font-bold text-white mb-3">Property</h2>
          <p className="text-gray-400 text-sm mb-2">
            Property placeholder for UPRN:
          </p>
          <p className="font-mono text-purple-400 text-sm mb-4 break-all">
            {propertyUPRN}
          </p>
          <p className="text-gray-500 text-xs">
            Will be replaced with actual property details
          </p>
        </div>
      )}
    </div>
  )
}

