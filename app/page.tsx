'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import Image from 'next/image'
import { CONFIG } from '@/lib/config'

export default function LandingPage() {
  const router = useRouter()
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
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([])
  const [isPricingVisible, setIsPricingVisible] = useState(false)
  const featureRefs = useRef<(HTMLElement | null)[]>([])
  const pricingRef = useRef<HTMLDivElement | null>(null)

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

  // Intersection Observer for feature animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.getAttribute('data-feature-index')) {
              const index = parseInt(entry.target.getAttribute('data-feature-index') || '0')
              setVisibleFeatures(prev => prev.includes(index) ? prev : [...prev, index])
            } else if (entry.target.getAttribute('data-pricing-section')) {
              setIsPricingVisible(true)
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    if (pricingRef.current) {
      observer.observe(pricingRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    // Basic email validation
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

  const majorFeatures = [
    { 
      icon: '🔍', 
      title: '45+ Data Points in One Search', 
      description: 'Get instant access to comparables, market data, and key property metrics. Save hours of research and never miss crucial information again.',
      preview: 'See live data like: sold prices, rental yields, council tax bands, crime rates, school ratings, transport links, and much more - all in one comprehensive report.'
    },
    { 
      icon: '🏠', 
      title: 'Automatic Comparables & Valuations', 
      description: 'See accurate comparables and valuations in seconds, with the behind-the-scenes data on how we got there.',
      preview: 'Our AI finds the most relevant comparable properties, adjusts for differences, and provides multiple valuation methods including automated valuation models and market analysis.'
    },
    { 
      icon: '🏚️', 
      title: 'AI Refurbishment Estimator', 
      description: 'Upload property photos or description of works and get AI-generated schedule of works. Know exactly what you\'re getting into before you buy.',
      preview: 'Simply snap photos of each room and our AI will identify everything from outdated kitchens to structural issues, then provide detailed cost breakdowns for materials and labor.'
    }
  ]

  const secondaryFeatures = [
    { 
      icon: '💡', 
      title: 'Multi-Exit Calculators with AI Assistant', 
      description: 'Run scenarios for multiple exit strategies including BTL, flip, BRRR, and more with AI-driven guidance.',
      preview: 'Our AI analyzes your property and market conditions to suggest the most profitable exit strategy, complete with ROI projections, cash flow forecasts, and risk assessments.'
    },
    { 
      icon: '📈', 
      title: 'Market Insights', 
      description: 'Stay ahead with local trends, price changes, and investment opportunities. Spot opportunities before your competition does.',
      preview: 'Get alerts on price movements, new listings, market trends, and emerging hotspots. Our AI identifies undervalued properties and predicts future growth areas.'
    },
    { 
      icon: '⚠️', 
      title: 'Environmental Risk Assessment', 
      description: 'Automatically detect flood, contamination, and energy risks before you buy.',
      preview: 'Comprehensive risk analysis covering flood zones, contaminated land, energy efficiency ratings, subsidence risk, and planning restrictions that could affect your investment.'
    }
  ]

  const pricingFeature = {
    icon: '💳', 
    title: 'Pay-As-You-Go Pricing', 
    description: 'No subscriptions, no hidden fees. You only pay for what you use with transparent credit-based pricing.',
    preview: 'Each property analysis costs just a few credits. Buy credits in bulk for better value, or start with our free welcome credits. No monthly fees, no commitments.'
  }

        return (
    <>
      <Head>
        <title>Appraisor - All Your UK Property Insights in One Search</title>
        <meta name="description" content="Get instant access to over 45 data points, automatic valuations, AI-driven insights, AI refurbishment estimator, and tools to help you buy and sell smarter. Pay-as-you-go credits, no subscription required." />
        <meta name="keywords" content="property analysis, UK property data, property valuation, AI refurbishment estimator, property investment, real estate insights, property comparables, market analysis" />
        <meta name="author" content="Appraisor" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Appraisor - All Your UK Property Insights in One Search" />
        <meta property="og:description" content="Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter. Sign up for early access and get free credits." />
        <meta property="og:site_name" content="Appraisor" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Appraisor - All Your UK Property Insights in One Search" />
        <meta name="twitter:description" content="Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter." />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Appraisor",
              "description": "All your UK property insights in one search. Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "GBP",
                "description": "Pay-as-you-go credits, no subscription required"
              },
              "featureList": [
                "45+ Data Points in One Search",
                "AI Refurbishment Estimator", 
                "Multi-Exit Calculators with AI Assistant",
                "Market Insights",
                "Environmental Risk Assessment",
                "Automatic Comparables & Valuations"
              ]
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen relative overflow-hidden">
      {/* Deep Space Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900" />
      
      {/* Nebula Core */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-700/60 via-purple-900/30 to-transparent" />
      
      {/* Swirling Nebula Effect */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 22% 32%, rgba(139, 92, 246, 0.45) 0%, transparent 55%),
            radial-gradient(ellipse 70% 45% at 78% 68%, rgba(59, 130, 246, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse 75% 65% at 52% 18%, rgba(168, 85, 247, 0.3) 0%, transparent 55%),
            radial-gradient(ellipse 55% 85% at 12% 78%, rgba(236, 72, 153, 0.22) 0%, transparent 55%)
          `
        }}
      />
      
      {/* Animated Cosmic Dust */}
      <div 
        className="absolute inset-0 opacity-40 animate-pulse"
        style={{
          background: `
            radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.1), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.05), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.1), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.05), transparent),
            radial-gradient(2px 2px at 160px 30px, rgba(255, 255, 255, 0.1), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 100px'
        }}
      />
      
      {/* Dark Nebula Clouds */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 0% 0%, rgba(0, 0, 0, 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 80% 100% at 100% 100%, rgba(0, 0, 0, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0, 0, 0, 0.4) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Cosmic Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-gradient-radial from-purple-500/30 via-purple-600/15 to-transparent animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-[24rem] h-[24rem] bg-gradient-radial from-blue-500/22 via-blue-600/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[22rem] h-[22rem] bg-gradient-radial from-pink-500/18 via-pink-600/8 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Deep Space Overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6" role="banner">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-xl shadow-lg overflow-hidden" aria-label="Appraisor logo">
                <Image
                  src="/logo.png"
                  alt="Appraisor Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold text-white">Appraisor</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-8" role="main">
          <div className="w-full max-w-4xl">
            <section className="text-center mb-12" aria-labelledby="hero-heading">
              {/* Hero Section */}
                <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                  All your UK property insights,
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    in one search.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Appraisor gives you instant access to over 45 data points, automatic valuations, AI-driven insights, AI refurbishment estimator, and tools to help you buy and sell smarter.
                </p>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                <p className="text-lg text-white mb-6">
                Get free credits when you sign up for early access!
                </p>

                {/* Subscriber Counter */}
                <div className="mb-6 text-center min-h-[60px] flex items-center justify-center">
                  {!loadingCount && subscriberCount ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-full px-4 py-2">
                      <span className="text-orange-300 text-sm font-medium">
                        🔥 {subscriberCount.subscriber_count}/{subscriberCount.max_free_spots} free credit spots taken
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-400/20 rounded-full px-4 py-2">
                      <div className="w-4 h-4 bg-orange-400/30 rounded-full animate-pulse"></div>
                      <div className="w-20 h-4 bg-orange-400/30 rounded animate-pulse"></div>
                    </div>
                  )}
                  {!loadingCount && subscriberCount && subscriberCount.remaining_spots === 0 && (
                    <p className="text-orange-300 text-sm mt-2 font-medium">
                      All free spots claimed! You can still join the waitlist to get early access.
                    </p>
                  )}
                </div>
                
                {/* Email Capture Form */}
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" aria-label="Sign up for early access">
                  <label htmlFor="email-input" className="sr-only">Email address</label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    disabled={loading}
                    required
                    aria-describedby="email-help"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={loading ? 'Signing up, please wait' : 'Get free credits and early access'}
                  >
                    {loading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </form>
                <p id="email-help" className="sr-only">Enter your email address to receive free credits when we launch</p>

                {/* Message Display */}
                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-500/20 border border-green-400/30 text-green-300' 
                      : 'bg-red-500/20 border border-red-400/30 text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section className="text-center mb-8 mt-28" aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-3xl font-bold text-white mb-12">
                Powerful tools to make <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">smarter property decisions</span>
              </h2>
            </section>

            {/* Major Features - Full Width */}
            <div className="space-y-4 md:space-y-6 mb-8 md:mb-12" role="list">
              {majorFeatures.map((feature, index) => (
                <article
                  key={index}
                  ref={(el) => { featureRefs.current[index] = el }}
                  data-feature-index={index}
                  className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 md:p-12 hover:bg-black/30 transition-all duration-700 group ${
                    visibleFeatures.includes(index) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  role="listitem"
                >
                  <div className="flex flex-col lg:flex-row items-start gap-8">
                    {/* Feature Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="text-5xl" aria-hidden="true">{feature.icon}</div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{feature.title}</h3>
                          <p className="text-gray-300 text-lg leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feature-specific Visual Mockups */}
                    <div className="w-full lg:w-1/2">
                      {index === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3">
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">🏠</div>
                              <div className="text-xs text-gray-300 leading-tight">Sold Prices</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">📈</div>
                              <div className="text-xs text-gray-300 leading-tight">Rental Yields</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">⚡</div>
                              <div className="text-xs text-gray-300 leading-tight">EPC Assessment</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">📐</div>
                              <div className="text-xs text-gray-300 leading-tight">Plot Data</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">🔍</div>
                              <div className="text-xs text-gray-300 leading-tight">Crime Rate</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">📊</div>
                              <div className="text-xs text-gray-300 leading-tight">Sold Comparables</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">🏘️</div>
                              <div className="text-xs text-gray-300 leading-tight">For Sale</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">🏠</div>
                              <div className="text-xs text-gray-300 leading-tight">To Rent</div>
                            </div>
                            <div className="bg-white/10 rounded p-2 text-center min-h-[60px] flex flex-col justify-center">
                              <div className="text-lg mb-1">🚇</div>
                              <div className="text-xs text-gray-300 leading-tight">Transport</div>
                            </div>
                          </div>
                          <p className="text-purple-200 text-sm font-medium">45+ Data Points</p>
                        </div>
                      )}
                      
                      {index === 1 && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3">
                          <div className="w-full flex flex-col justify-center h-full">
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
                                  <img src="/comp1.png" alt="Comparable 1" className="w-full aspect-square object-cover rounded" />
                                </div>
                              </div>
                              <div className="bg-white/10 rounded p-2 text-center">
                                <div className="text-[8px] text-gray-300">Comp 2</div>
                                <div className="text-[8px] text-white font-medium">£430k</div>
                                <div className="mt-2 w-full p-1">
                                  <img src="/comp2.png" alt="Comparable 2" className="w-full aspect-square object-cover rounded" />
                                </div>
                              </div>
                              <div className="bg-white/10 rounded p-2 text-center">
                                <div className="text-[8px] text-gray-300">Comp 3</div>
                                <div className="text-[8px] text-white font-medium">£428k</div>
                                <div className="mt-2 w-full p-1">
                                  <img src="/comp3.png" alt="Comparable 3" className="w-full aspect-square object-cover rounded" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {index === 2 && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2">
                          {/* Section 1: Input Options */}
                          <div className="w-full mb-1">
                            <div className="flex items-center gap-2">
                              <div className="bg-white/10 rounded p-1.5 text-center flex-1">
                                <div className="text-sm text-gray-300 font-medium">📸 Pictures</div>
                              </div>
                              <div className="text-sm text-purple-300 font-medium px-1">OR</div>
                              <div className="bg-white/10 rounded p-1.5 text-center flex-1">
                                <div className="text-sm text-gray-300 font-medium">📝 Description</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <div className="text-purple-300 text-xs my-2">↓</div>
                          
                          {/* Section 2: AI Analysis */}
                          <div className="w-full mb-1">
                            <div className="bg-white/10 rounded p-1.5 text-center">
                              <div className="text-sm text-gray-300 font-medium">🤖 AI Agent Analysis</div>
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <div className="text-purple-300 text-sm my-2">↓</div>
                          
                          {/* Section 3: Schedule of Work */}
                          <div className="w-full">
                            <div className="bg-white/10 rounded p-1.5 text-center">
                              <div className="text-sm text-gray-300 font-medium">📋 Schedule of Work</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Secondary Features - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12" role="list">
              {secondaryFeatures.map((feature, index) => (
                <article
                  key={index}
                  className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 hover:bg-black/30 transition-all duration-200 animate-enter-subtle group"
                  style={{ animationDelay: `${(index + 3) * 0.1}s` }}
                  role="listitem"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3" aria-hidden="true">{feature.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
            

            {/* Pricing Section */}
            <section 
              ref={pricingRef}
              data-pricing-section
              className={`text-center mb-8 mt-28 transition-all duration-700 ${
                isPricingVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              aria-labelledby="pricing-heading"
            >
              <h2 id="pricing-heading" className="text-3xl font-bold text-white mb-12">
                Pay-as-you-go pricing, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">no subscriptions or hidden fees</span>
              </h2>
              
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left">
                    <div className="text-purple-400 text-2xl mb-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <p className="text-white text-lg leading-relaxed">Buy credits and use them for searches, AI analysis, valuations, and more</p>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left">
                    <div className="text-purple-400 text-2xl mb-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                      </svg>
                    </div>
                    <p className="text-white text-lg leading-relaxed">Set up automatic top-ups to never run out of credits</p>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left">
                    <div className="text-purple-400 text-2xl mb-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                      </svg>
                    </div>
                    <p className="text-white text-lg leading-relaxed">Add a balance warning reminder to keep you informed when you're running low</p>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6 text-left">
                    <div className="text-purple-400 text-2xl mb-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <p className="text-white text-lg leading-relaxed">We promise, no subscriptions, minimum periods, or hidden fees, you pay for what you use and can cancel anytime</p>
                  </div>
                  
                </div>
              </div>
            </section>
      </div>
    </main>

        {/* Footer */}
        <footer className="p-6 mt-8 text-center" role="contentinfo">
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
    </>
  )
}