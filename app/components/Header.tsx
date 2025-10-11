'use client'

interface HeaderProps {
  showBackButton?: boolean
  onBackClick?: () => void
  backButtonText?: string
}

export default function Header({ 
  showBackButton = false, 
  onBackClick, 
  backButtonText = "Back" 
}: HeaderProps) {
  return (
    <div className="h-20 px-4 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm flex items-center justify-between flex-shrink-0 sticky top-0 z-20 animate-enter-subtle">
      {/* Left side - Back button or empty space */}
      <div className="flex items-center min-w-0 flex-1">
        {showBackButton && onBackClick && (
          <button
            type="button"
            onClick={onBackClick}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M20 12a1 1 0 01-1 1H8.414l3.293 3.293a1 1 0 11-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 11H19a1 1 0 011 1z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">{backButtonText}</span>
            <span className="sm:hidden">Back</span>
          </button>
        )}
      </div>

      {/* Center - Logo and Slogan */}
      <div className="flex flex-col items-center text-center flex-1 min-w-0">
        <h1 className="text-xl font-bold text-white">Estimo</h1>
        <p className="text-xs text-gray-400 mt-1 hidden sm:block">Analyse UK Property Investments</p>
        <p className="text-xs text-gray-400 mt-1 sm:hidden">Property Investment Analysis</p>
      </div>

      {/* Right side - Empty for now, can be used for user menu, settings, etc. */}
      <div className="flex-1 min-w-0"></div>
    </div>
  )
}
