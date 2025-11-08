'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [subscriberCount, setSubscriberCount] = useState<{
    subscriber_count: number
    max_free_spots: number
    remaining_spots: number
    is_first_100: boolean
  } | null>(null)
  const [loadingCount, setLoadingCount] = useState(true)
  const [isPricingVisible, setIsPricingVisible] = useState(false)
  const [heroCardsVisible, setHeroCardsVisible] = useState(false)
  const [showEmailTooltip, setShowEmailTooltip] = useState(false)
  const [visibleSectionTitles, setVisibleSectionTitles] = useState<string[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresHeadingVisible, setFeaturesHeadingVisible] = useState(false)
  const pricingRef = useRef<HTMLDivElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const sectionTitleRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const featuresHeadingRef = useRef<HTMLHeadingElement | null>(null)

  // Fetch subscriber count on component mount
  useEffect(() => {
    const fetchSubscriberCount = async () => {
      try {
        const response = await fetch(`/api/subscribers?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        if (response.ok) {
          const data = await response.json()
          setSubscriberCount(data)
        }
      } catch (error) {
        console.error('Error fetching subscriber count:', error)
      } finally {
        setLoadingCount(false)
      }
    }

    fetchSubscriberCount()
  }, [])

  // Trigger hero cards animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroCardsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.getAttribute('data-pricing-section')) {
              setIsPricingVisible(true)
            } else if (entry.target.getAttribute('data-section-title')) {
              const titleId = entry.target.getAttribute('data-section-title') || ''
              setVisibleSectionTitles(prev => prev.includes(titleId) ? prev : [...prev, titleId])
            } else if (entry.target.getAttribute('data-features-heading')) {
              setFeaturesHeadingVisible(true)
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (pricingRef.current) {
      observer.observe(pricingRef.current)
    }

    // Observe section titles
    Object.values(sectionTitleRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    // Observe features heading
    if (featuresHeadingRef.current) {
      observer.observe(featuresHeadingRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/sendfox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      
      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setEmail('') // Clear form after successful submission
        
        // Refresh subscriber count after successful subscription
        const countResponse = await fetch(`/api/subscribers?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        if (countResponse.ok) {
          const countData = await countResponse.json()
          setSubscriberCount(countData)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      console.error('Error submitting email:', error)
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGetFreeCreditsClick = () => {
    // Scroll to the email form
    emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Focus the email input after a short delay to ensure scroll completes
    setTimeout(() => {
      emailInputRef.current?.focus()
      setShowEmailTooltip(true)
      // Hide tooltip after 5 seconds
      setTimeout(() => {
        setShowEmailTooltip(false)
      }, 5000)
    }, 300)
  }

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark blue-purple background with subtle circular patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-black" />
      
      {/* Subtle circular patterns overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation Bar - Fixed with Glass Effect */}
        <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4" role="banner">
          <nav className="max-w-[95vw] xl:max-w-[1400px] mx-auto flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-4 md:px-6 py-4 shadow-lg">
            {/* Logo */}
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Scroll to top"
            >
              <div className="w-10 h-10 rounded-lg shadow-lg overflow-hidden" aria-label="Appraisor logo">
                <Image
                  src="/logo.png"
                  alt="Appraisor Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-white">Appraisor</span>
            </button>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#customers" className="text-white hover:text-purple-300 transition-colors scroll-smooth">Customers</a>
              <a href="#why-appraisor" className="text-white hover:text-purple-300 transition-colors scroll-smooth">Why Appraisor?</a>
              <a href="#pricing" className="text-white hover:text-purple-300 transition-colors scroll-smooth">Pricing</a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={handleGetFreeCreditsClick}
                className="hidden md:block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-sm md:text-base"
              >
                Get free credits
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:text-purple-300 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 mx-4 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg">
              <div className="flex flex-col gap-4">
                <a 
                  href="#customers" 
                  onClick={handleNavClick}
                  className="text-white hover:text-purple-300 transition-colors scroll-smooth py-2"
                >
                  Customers
                </a>
                <a 
                  href="#why-appraisor" 
                  onClick={handleNavClick}
                  className="text-white hover:text-purple-300 transition-colors scroll-smooth py-2"
                >
                  Why Appraisor?
                </a>
                <a 
                  href="#pricing" 
                  onClick={handleNavClick}
                  className="text-white hover:text-purple-300 transition-colors scroll-smooth py-2"
                >
                  Pricing
                </a>
                <button 
                  onClick={() => {
                    handleGetFreeCreditsClick()
                    handleNavClick()
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-center"
                >
                  Get free credits
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 md:px-12 py-12 md:py-24 pt-32 md:pt-48" role="main">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row gap-12 md:gap-28 items-center">
              {/* Left Column - Title, Subtitle */}
              <div className="text-left w-full lg:w-[55%]">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight mt-8 md:mt-16">
                  Smarter property investing insights, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">instantly</span>.
                </h1>
                <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8">
                  Cut your analysis time in half. Get instant AI valuations, data-backed insights, and full transparency in every search.
                </p>
                {/* Open Source Badge */}
                <a 
                  href="https://github.com/dvdciri/appraisor" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full text-white hover:text-purple-300 hover:border-purple-400/30 hover:bg-black/30 transition-all duration-200 shadow-lg text-sm"
                  aria-label="View on GitHub - Open Source"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">Appraisor is Open Source</span>
                </a>
              </div>

              {/* Right Column - Form */}
              <div className="text-center w-full lg:w-[45%] mt-8 md:mt-16">
                {/* Coming Soon Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Coming soon
                </h2>
                
                {/* Free Credits Message */}
                <p className="text-base text-white mb-4">
                  Join the waiting list to get <span className="font-bold">30 free credits</span> — unlock AI valuations, comparables, and refurb cost estimates.
                </p>
                
                {/* Success Message - Above Badge */}
                {message && message.type === 'success' && (
                  <div className="mb-3 p-3 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm">
                    {message.text}
                  </div>
                )}
                
                {/* Subscriber Counter */}
                <div className="mb-4 min-h-[40px] flex items-center justify-center">
                  {!loadingCount && subscriberCount ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-full px-3 py-1.5">
                      <span className="text-orange-300 text-sm font-medium">
                        🔥 {subscriberCount.subscriber_count}/{subscriberCount.max_free_spots} free credit spots taken
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-400/20 rounded-full px-3 py-1.5">
                      <div className="w-3 h-3 bg-orange-400/30 rounded-full animate-pulse"></div>
                      <div className="w-16 h-3 bg-orange-400/30 rounded animate-pulse"></div>
                    </div>
                  )}
                  {!loadingCount && subscriberCount && subscriberCount.remaining_spots === 0 && (
                    <p className="text-orange-300 text-xs ml-3 font-medium">
                      All free spots claimed! You can still join the waitlist to get early access.
                    </p>
                  )}
                </div>

                {/* Email Form - Hidden on Success */}
                {(!message || message.type !== 'success') && (
                  <>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-3 justify-center relative" aria-label="Sign up for early access">
                      <label htmlFor="email-input" className="sr-only">Email address</label>
                      {showEmailTooltip && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10 transition-opacity duration-300">
                          Enter email to get free credits
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-purple-500"></div>
                          </div>
                        </div>
                      )}
                      <input
                        ref={emailInputRef}
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (showEmailTooltip) {
                            setShowEmailTooltip(false)
                          }
                        }}
                        placeholder="Enter your email address"
                        className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm max-w-xs"
                        disabled={loading}
                        required
                        aria-describedby="email-help"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                        aria-label={loading ? 'Signing up, please wait' : 'Reserve my spot'}
                      >
                        {loading ? 'Signing Up...' : 'Reserve my spot'}
                      </button>
                    </form>
                    <p id="email-help" className="sr-only">Enter your email address to receive free credits when we launch</p>
                    <p className="text-gray-400 text-xs mt-2 text-center">No spam, unsubscribe anytime.</p>
                  </>
                )}

                {/* Error Message Display - Below Badge */}
                {message && message.type === 'error' && (
                  <div className="mt-3 p-2 rounded-lg text-xs bg-red-500/20 border border-red-400/30 text-red-300">
                    {message.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Feature Cards Section */}
        <section className="px-4 md:px-8 pb-12 md:pb-16 mt-12 md:mt-24" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto">
            <h2 
              ref={featuresHeadingRef}
              data-features-heading
              className={`text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12 text-center transition-all duration-700 ease-out ${
                featuresHeadingVisible
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              Powerful tools to make <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">smarter property decisions</span>.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative items-start">
              {/* Card 1: 45+ Data Points */}
              <div className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-3xl p-6 hover:bg-black/30 transition-all duration-700 ease-out transform hover:scale-105 h-auto ${
                heroCardsVisible 
                  ? 'opacity-100 -translate-y-4 scale-100' 
                  : 'opacity-0 translate-y-8 scale-95'
              }`} style={{ transitionDelay: '0ms' }}>
                <h3 className="text-lg font-bold text-white mb-2">45+ data points</h3>
                <p className="text-sm text-gray-300 mb-4">Get instant access to comparables, market data, and key property metrics.</p>
                <div className="mb-4">
                  <div className="w-full flex flex-col items-center justify-center">
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">🏠</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">Sold Prices</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">📈</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">Rental Yields</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">⚡</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">EPC</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">📐</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">Plot Data</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">🔍</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">Crime Rate</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">📊</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">Comparables</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">🏘️</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">For Sale</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">🏠</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">To Rent</div>
                      </div>
                      <div className="bg-white/10 rounded p-1.5 text-center min-h-[60px] flex flex-col justify-center overflow-hidden">
                        <div className="text-lg mb-0.5">🚇</div>
                        <div className="text-[10px] text-gray-300 leading-tight break-words px-0.5">Transport</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Auto comparables & valuation */}
              <div className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-3xl p-6 hover:bg-black/30 transition-all duration-700 ease-out transform hover:scale-105 h-auto ${
                heroCardsVisible 
                  ? 'opacity-100 translate-y-8 scale-100' 
                  : 'opacity-0 translate-y-8 scale-95'
              }`} style={{ transitionDelay: '200ms' }}>
                <h3 className="text-lg font-bold text-white mb-2">Auto comparables & valuation</h3>
                <p className="text-sm text-gray-300 mb-4">See accurate comparables and valuations in seconds, with transparent data on how we got there.</p>
                <div className="mb-4">
                  <div className="w-full flex flex-col justify-center">
                    <div className="bg-white/10 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-300">Property Value</span>
                        <span className="text-xs text-white font-bold">£425,000</span>
                      </div>
                      <div className="text-[10px] text-gray-400">AI Valuation</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="bg-white/10 rounded p-2 text-center">
                        <div className="text-[8px] text-gray-300">Comp 1</div>
                        <div className="text-[8px] text-white font-medium">£420k</div>
                        <div className="mt-2 w-full p-1">
                          <Image src="/comp1.png" alt="Comparable 1" width={80} height={80} className="w-full aspect-square object-cover rounded" />
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2 text-center">
                        <div className="text-[8px] text-gray-300">Comp 2</div>
                        <div className="text-[8px] text-white font-medium">£430k</div>
                        <div className="mt-2 w-full p-1">
                          <Image src="/comp2.png" alt="Comparable 2" width={80} height={80} className="w-full aspect-square object-cover rounded" />
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2 text-center">
                        <div className="text-[8px] text-gray-300">Comp 3</div>
                        <div className="text-[8px] text-white font-medium">£428k</div>
                        <div className="mt-2 w-full p-1">
                          <Image src="/comp3.png" alt="Comparable 3" width={80} height={80} className="w-full aspect-square object-cover rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: AI refurbishment estimator */}
              <div className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-3xl p-6 hover:bg-black/30 transition-all duration-700 ease-out transform hover:scale-105 h-auto ${
                heroCardsVisible 
                  ? 'opacity-100 translate-y-4 scale-100' 
                  : 'opacity-0 translate-y-8 scale-95'
              }`} style={{ transitionDelay: '400ms' }}>
                <h3 className="text-lg font-bold text-white mb-2">AI refurbishment estimator</h3>
                <p className="text-sm text-gray-300 mb-4">Upload property photos and get AI-generated schedule of works with cost breakdowns.</p>
                <div className="mb-4">
                  <div className="w-full flex flex-col justify-center">
                    {/* Schedule of Work List */}
                    <div className="space-y-2">
                      <div className="bg-white/10 rounded p-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🔧</div>
                          <div className="text-xs text-gray-300">Replace boiler</div>
                        </div>
                        <div className="text-xs text-white font-medium">£2,500</div>
                      </div>
                      
                      <div className="bg-white/10 rounded p-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🪟</div>
                          <div className="text-xs text-gray-300">New windows</div>
                        </div>
                        <div className="text-xs text-white font-medium">£4,200</div>
                      </div>
                      
                      <div className="bg-white/10 rounded p-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🎨</div>
                          <div className="text-xs text-gray-300">Paint & decorate</div>
                        </div>
                        <div className="text-xs text-white font-medium">£1,800</div>
                      </div>
                      
                      <div className="bg-white/10 rounded p-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">⚡</div>
                          <div className="text-xs text-gray-300">Rewire electrics</div>
                        </div>
                        <div className="text-xs text-white font-medium">£3,100</div>
                      </div>
                      
                      <div className="bg-white/10 rounded p-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🚿</div>
                          <div className="text-xs text-gray-300">Bathroom refit</div>
                        </div>
                        <div className="text-xs text-white font-medium">£5,500</div>
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="mt-3 pt-2 border-t border-gray-500/30">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-purple-300 font-medium">Total Estimate</div>
                        <div className="text-sm text-white font-bold">£17,100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Multi-exit calculators with AI assistant */}
              <div className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-3xl p-6 hover:bg-black/30 transition-all duration-700 ease-out transform hover:scale-105 h-auto ${
                heroCardsVisible 
                  ? 'opacity-100 -translate-y-4 scale-100' 
                  : 'opacity-0 translate-y-8 scale-95'
              }`} style={{ transitionDelay: '600ms' }}>
                <h3 className="text-lg font-bold text-white mb-2">Multi-exit calculators with AI assistant</h3>
                <p className="text-sm text-gray-300 mb-4">Run scenarios for multiple exit strategies with AI-driven guidance and ROI projections.</p>
                <div className="mb-4">
                  <div className="w-full flex flex-col justify-center">
                    {/* Exit Strategy Options */}
                    <div className="space-y-2">
                      <div className="bg-white/10 rounded p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🏠</div>
                          <div className="text-xs text-gray-300">BTL</div>
                        </div>
                        <div className="text-xs text-white font-medium">ROI: 8.5%</div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded p-2 flex items-center justify-between border border-purple-400/30">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🔄</div>
                          <div className="text-xs text-white font-medium">Flip</div>
                        </div>
                        <div className="text-xs text-white font-bold">ROI: 12.3%</div>
                      </div>
                      
                      <div className="bg-white/10 rounded p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">🏗️</div>
                          <div className="text-xs text-gray-300">BRRR</div>
                        </div>
                        <div className="text-xs text-white font-medium">ROI: 15.2%</div>
                      </div>
                    </div>
                    
                    {/* AI Recommendation */}
                    <div className="mt-3 pt-2 border-t border-gray-500/30">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-purple-300 font-medium">AI Recommendation</div>
                        <div className="text-xs text-white font-bold">Flip</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="flex flex-col items-center mt-8 md:mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
                {/* Market Insights */}
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 hover:bg-black/30 transition-all">
                  <h3 className="text-xl font-bold text-white mb-3">Market Insights</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Stay ahead with local trends, price changes, and investment opportunities. Spot opportunities before your competition does.
                  </p>
                </div>

                {/* Environmental Risk Assessment */}
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 hover:bg-black/30 transition-all">
                  <h3 className="text-xl font-bold text-white mb-3">Risk Assessment</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Automatically detect flood, contamination, and energy risks before you buy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customers Section */}
        <section id="customers" className="px-4 md:px-8 pb-12 md:pb-16 mt-16 md:mt-28 scroll-mt-24 md:scroll-mt-28" aria-labelledby="customers-heading">
          <div className="max-w-7xl mx-auto">
            <h2 
              ref={(el) => { sectionTitleRefs.current['customers'] = el }}
              data-section-title="customers"
              id="customers-heading" 
              className={`text-3xl font-bold text-white mb-12 text-center transition-all duration-700 ease-out ${
                visibleSectionTitles.includes('customers')
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              Built for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">clarity</span> before you commit.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative items-start">
              {/* Landlords */}
              <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:bg-black/30 hover:border-purple-400/50 transition-all relative overflow-hidden group h-full">
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tl-full"></div>
                <div className="text-3xl mb-4">🏘️</div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Landlords</h3>
                <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                  Understand your property's true value, yields, and potential before refinancing or expanding your portfolio.
                </p>
              </div>

              {/* Property Investors */}
              <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:bg-black/30 hover:border-purple-400/50 transition-all relative overflow-hidden group h-full">
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tl-full"></div>
                <div className="text-3xl mb-4">📈</div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Property Investors</h3>
                <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                  Run instant valuations, refurbishment estimates, and ROI scenarios to make data-backed decisions.
                </p>
              </div>

              {/* Developers & Sourcers */}
              <div className="bg-black/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 hover:bg-black/30 hover:border-pink-400/50 transition-all relative overflow-hidden group h-full">
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-tl-full"></div>
                <div className="text-3xl mb-4">🏗️</div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Developers & Sourcers</h3>
                <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                  Validate comparables and assess project feasibility in minutes.
                </p>
              </div>

              {/* Home Buyers */}
              <div className="bg-black/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 hover:bg-black/30 hover:border-pink-400/50 transition-all relative overflow-hidden group h-full">
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-tl-full"></div>
                <div className="text-3xl mb-4">🔑</div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Home Buyers</h3>
                <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                  See beyond the listing with transparent data and AI-powered valuations.
                </p>
              </div>
            </div>

            <p className="text-center text-gray-200 text-lg max-w-2xl mx-auto mt-8 md:mt-12">
              If you're evaluating property in the UK — Appraisor gives you the facts, fast.
            </p>
          </div>
        </section>

        {/* Why Appraisor Section */}
        <section id="why-appraisor" className="px-4 md:px-8 pb-12 md:pb-16 mt-16 md:mt-28 scroll-mt-24 md:scroll-mt-28" aria-labelledby="why-appraisor-heading">
          <div className="max-w-7xl mx-auto">
            <h2 
              id="why-appraisor-heading" 
              className="text-3xl font-bold text-white mb-12 text-center"
            >
              Built to bring <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">everything together</span>.
            </h2>

            <div className="max-w-4xl mx-auto">
              {/* Our Mission */}
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 md:p-12 hover:bg-black/30 transition-all relative overflow-hidden">
                {/* Subtle panel glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                {/* Decorative dashed arcs */}
                <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 600" fill="none" aria-hidden="true">
                  <path d="M50 120 C400 420, 800 420, 1150 120" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="6 8" />
                  <path d="M50 260 C400 520, 800 520, 1150 260" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="6 8" />
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8b5cf6" stopOpacity="0.35" />
                      <stop stopColor="#ec4899" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative z-10">
                  <div className="flex flex-col items-center text-center mb-8">
                    <Image
                      src="https://avatars.githubusercontent.com/u/3275819?v=4"
                      alt="Founder portrait"
                      width={128}
                      height={128}
                      className="rounded-full ring-2 ring-white/10 shadow-lg mb-4"
                    />
                    <p className="text-gray-300 text-sm">Property Investor & Software Engineer</p>
                  </div>

                  <figure className="max-w-xl mx-auto">
                    <blockquote className="text-gray-300 leading-relaxed space-y-4 text-base md:text-lg text-center italic">
                      <p>
                        "I built Appraisor to make property analysis faster, simpler, and accessible to everyone.
                      </p>
                      <p>
                        Too many investors still rely on clunky spreadsheets, endless tabs, and scattered data just to answer one question: is this property worth it?
                      </p>
                      <p>
                        As a software engineer, I knew we could automate valuations, comparables, and refurb estimates — all in one place.
                      </p>
                      <p>
                        Property insights should be affordable and accurate — not locked behind expensive tools or big teams."
                      </p>            
                    </blockquote>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section 
          id="pricing"
          ref={pricingRef}
          data-pricing-section
          className={`px-4 md:px-8 pb-12 md:pb-16 mt-16 md:mt-28 scroll-mt-24 md:scroll-mt-28 transition-all duration-700 ${
            isPricingVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
          aria-labelledby="pricing-heading"
        >
          <div className="max-w-7xl mx-auto">
            <h2 
              ref={(el) => { sectionTitleRefs.current['pricing'] = el }}
              data-section-title="pricing"
              id="pricing-heading" 
              className={`text-3xl font-bold text-white mb-12 text-center transition-all duration-700 ease-out ${
                visibleSectionTitles.includes('pricing')
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              Pay-as-you-go pricing, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">no subscriptions</span>, ever.
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left hover:bg-black/30 transition-all">
                  <div className="text-purple-400 text-2xl mb-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg leading-relaxed">Buy credits and use them for searches, AI analysis, valuations, and more</p>
                </div>
                
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left hover:bg-black/30 transition-all">
                  <div className="text-purple-400 text-2xl mb-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg leading-relaxed">Set up automatic top-ups to never run out of credits</p>
                </div>
                
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left hover:bg-black/30 transition-all">
                  <div className="text-purple-400 text-2xl mb-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg leading-relaxed">Add a balance warning reminder to keep you informed when you're running low</p>
                </div>
                
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left hover:bg-black/30 transition-all">
                  <div className="text-purple-400 text-2xl mb-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg leading-relaxed">We promise, no subscriptions, minimum periods, or hidden fees, you pay for what you use and can cancel anytime</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 md:px-8 py-6 md:py-8 mt-6 md:mt-8 text-center" role="contentinfo">
          <p className="text-gray-400 text-base mb-8">
            Built by Property Investors for Property Investors ❤️
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Questions? Contact us at{' '}
            <a 
              href="mailto:info@doorlyproperties.com" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
              aria-label="Contact us via email"
            >
              info@doorlyproperties.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
