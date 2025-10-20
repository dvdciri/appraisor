'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Section = 'property-details' | 'market-analysis' | 'sold-comparables' | 'investment-calculator' | 'ai-refurbishment'

const sections = [
  { id: 'property-details' as Section, label: 'Property Details', icon: '🏠' },
  { id: 'market-analysis' as Section, label: 'Market Analysis', icon: '📊' },
  { id: 'sold-comparables' as Section, label: 'Sold Comparables', icon: '🏘️' },
  { id: 'investment-calculator' as Section, label: 'Investment Calculator', icon: '💰' },
  { id: 'ai-refurbishment' as Section, label: 'AI Refurbishment Estimator', icon: '🤖' },
]

const subsections = {
  'property-details': [
    { id: 'basic-info', label: 'Basic Information', icon: '📋' },
    { id: 'location', label: 'Location & Address', icon: '📍' },
    { id: 'specifications', label: 'Specifications', icon: '📐' },
    { id: 'valuation', label: 'Valuation Data', icon: '💰' },
    { id: 'history', label: 'Property History', icon: '📜' },
  ],
  'market-analysis': [
    { id: 'price-trends', label: 'Price Trends', icon: '📈' },
    { id: 'neighborhood-data', label: 'Neighborhood Data', icon: '🏘️' },
    { id: 'market-forecast', label: 'Market Forecast', icon: '🔮' },
    { id: 'demographics', label: 'Demographics', icon: '👥' },
  ],
  'sold-comparables': [
    { id: 'recent-sales', label: 'Recent Sales', icon: '🏠' },
    { id: 'price-per-sqft', label: 'Price per Sq Ft', icon: '📊' },
    { id: 'market-comparison', label: 'Market Comparison', icon: '⚖️' },
    { id: 'sale-history', label: 'Sale History', icon: '📜' },
  ],
  'investment-calculator': [
    { id: 'roi-calculator', label: 'ROI Calculator', icon: '📈' },
    { id: 'rental-yield', label: 'Rental Yield', icon: '🏠' },
    { id: 'mortgage-calculator', label: 'Mortgage Calculator', icon: '🏦' },
    { id: 'cash-flow', label: 'Cash Flow Analysis', icon: '💰' },
  ],
  'ai-refurbishment': [
    { id: 'cost-estimation', label: 'Cost Estimation', icon: '🔨' },
    { id: 'room-analysis', label: 'Room Analysis', icon: '🏠' },
    { id: 'material-suggestions', label: 'Material Suggestions', icon: '🧱' },
    { id: 'timeline-planning', label: 'Timeline Planning', icon: '📅' },
  ],
}

const loremContent = {
  'property-details': {
    title: 'Property Details',
    content: `Comprehensive property information including basic details, location data, specifications, valuation information, and historical records. This section provides a complete overview of the property's characteristics, legal status, and market position.

Key features include:
• Property specifications and dimensions
• Location and address verification
• Valuation data and market estimates
• Historical transaction records
• Legal and regulatory information

This data is essential for making informed investment decisions and understanding the property's potential value and risks.`
  },
  'market-analysis': {
    title: 'Market Analysis',
    content: `In-depth market analysis providing insights into local property trends, neighborhood dynamics, and future market predictions. This section helps investors understand the broader market context and make data-driven decisions.

Analysis includes:
• Price trend analysis and forecasting
• Neighborhood demographic data
• Market supply and demand indicators
• Economic factors affecting property values
• Future development plans and their impact

This comprehensive market intelligence helps identify opportunities and assess investment risks in the current market environment.`
  },
  'sold-comparables': {
    title: 'Sold Comparables',
    content: `Detailed analysis of recently sold properties in the area to establish accurate market valuations and identify pricing trends. This section provides crucial data for property valuation and investment analysis.

Comparable data includes:
• Recent sales within 0.5 miles
• Price per square foot analysis
• Market comparison metrics
• Sale history and price progression
• Property feature comparisons

This data is essential for accurate property valuation and understanding how the subject property compares to similar properties in the market.`
  },
  'investment-calculator': {
    title: 'Investment Calculator',
    content: `Advanced financial calculators to analyze investment potential, calculate returns, and assess cash flow projections. This section provides the tools needed to make informed investment decisions.

Calculator tools include:
• ROI and yield calculations
• Rental income analysis
• Mortgage payment calculations
• Cash flow projections
• Tax implications and deductions

These tools help investors evaluate the financial viability of property investments and compare different investment opportunities.`
  },
  'ai-refurbishment': {
    title: 'AI Refurbishment Estimator',
    content: `AI-powered refurbishment cost estimation and planning tools that provide accurate cost projections and renovation recommendations. This section helps investors plan and budget for property improvements.

AI features include:
• Automated cost estimation by room
• Material and labor cost analysis
• Timeline planning and scheduling
• Quality vs. cost optimization
• Market-specific pricing adjustments

This advanced AI system provides detailed refurbishment plans and cost estimates to help maximize property value and investment returns.`
  }
}

export default function DashboardV1() {
  const params = useParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('property-details')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null)
  const uprn = params.uprn as string

  const handleSubsectionClick = (subsectionId: string) => {
    setActiveSubsection(subsectionId)
    setRightPanelOpen(true)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Deep Space Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900" />
      
      {/* Nebula Core (more pronounced) */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-700/60 via-purple-900/30 to-transparent" />
      
      {/* Swirling Nebula Effect (boosted) */}
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
      
      {/* Animated Cosmic Dust (slightly brighter) */}
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
      
      {/* Cosmic Glow Effects (increased radius/intensity slightly) */}
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-gradient-radial from-purple-500/30 via-purple-600/15 to-transparent animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-[24rem] h-[24rem] bg-gradient-radial from-blue-500/22 via-blue-600/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[22rem] h-[22rem] bg-gradient-radial from-pink-500/18 via-pink-600/8 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Deep Space Overlay (slightly less dark to let nebula show through) */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      
      <div className="relative z-10 flex h-screen">
        {/* Floating Dark Glass Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'} bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col transition-all duration-300 rounded-2xl shadow-2xl ml-6 my-6`}>
          {/* Back to Search Button - First Item */}
          <div className="p-3">
            <button
              onClick={() => router.push('/')}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-500/15 hover:bg-gray-500/25 transition-colors text-gray-400 hover:text-gray-200 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Back to Search' : undefined}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {!sidebarCollapsed && (
                <span className="text-xs font-medium">Back to Search</span>
              )}
            </button>
          </div>

          {/* Logo Area */}
          <div className="p-4 border-b border-gray-500/30">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">E</span>
                  </div>
                  <span className="font-semibold text-gray-100">Estimo</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <span className="text-sm text-gray-300">
                  {sidebarCollapsed ? '»' : '«'}
                </span>
              </button>
            </div>
          </div>

          {/* Section Header */}
          {!sidebarCollapsed && (
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SECTIONS</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-2 rounded-xl text-left transition-all duration-200 ${
                      sidebarCollapsed 
                        ? 'justify-center' 
                        : 'gap-3'
                    } ${
                      activeSection === section.id
                        ? 'bg-gray-500/25 text-gray-100 shadow-xl border border-gray-400/40'
                        : 'text-gray-300 hover:text-gray-100 hover:bg-gray-500/15'
                    }`}
                    title={sidebarCollapsed ? section.label : undefined}
                  >
                    <span className="text-lg">{section.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm">{section.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Dark Glass Header */}
          <header className="sticky top-0 z-40 p-6">
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl px-6 py-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-100">
                      Property Dashboard
                    </h1>
                    <p className="text-sm text-gray-400">UPRN: {uprn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm shadow-lg">
                    Export
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6">
            {/* Welcome Banner */}
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 mb-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-1">Hey there!</h2>
                  <p className="text-gray-300">
                    We can help with your property analysis and investment calculations with detailed insights and funding options.
                  </p>
                </div>
                <div className="text-4xl">🏠</div>
              </div>
            </div>

            {/* Subsections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {subsections[activeSection].map((subsection) => (
                <button
                  key={subsection.id}
                  onClick={() => handleSubsectionClick(subsection.id)}
                  className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 text-left hover:bg-gray-500/20 transition-all duration-200 group shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{subsection.icon}</span>
                    <h3 className="font-semibold text-gray-100 group-hover:text-gray-50 transition-colors">
                      {subsection.label}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Click to view details in the right panel
                  </p>
                </button>
              ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📊</span>
                <h3 className="text-lg font-semibold text-gray-100">Overview</h3>
              </div>
              <p className="text-gray-200 leading-relaxed whitespace-pre-line">
                {loremContent[activeSection].content}
              </p>
            </div>

            {/* Additional Content Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Statistics Card */}
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📈</span>
                  <h3 className="text-lg font-semibold text-gray-100">Property Statistics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-500/20">
                    <span className="text-gray-300">Market Value</span>
                    <span className="text-gray-100 font-semibold">£450,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-500/20">
                    <span className="text-gray-300">Rental Yield</span>
                    <span className="text-green-400 font-semibold">4.2%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-500/20">
                    <span className="text-gray-300">Price per sq ft</span>
                    <span className="text-gray-100 font-semibold">£320</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-300">Growth Rate</span>
                    <span className="text-blue-400 font-semibold">+8.5%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🕒</span>
                  <h3 className="text-lg font-semibold text-gray-100">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Property data updated</span>
                    <span className="text-xs text-gray-500 ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Valuation completed</span>
                    <span className="text-xs text-gray-500 ml-auto">1d ago</span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Report generated</span>
                    <span className="text-xs text-gray-500 ml-auto">3d ago</span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Analysis saved</span>
                    <span className="text-xs text-gray-500 ml-auto">1w ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Analysis Section */}
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🏘️</span>
                <h3 className="text-lg font-semibold text-gray-100">Market Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-500/10 rounded-xl p-4">
                  <h4 className="text-gray-200 font-medium mb-2">Local Market Trends</h4>
                  <p className="text-gray-400 text-sm">Property values in this area have shown consistent growth over the past 12 months, with an average increase of 8.5% year-over-year.</p>
                </div>
                <div className="bg-gray-500/10 rounded-xl p-4">
                  <h4 className="text-gray-200 font-medium mb-2">Investment Potential</h4>
                  <p className="text-gray-400 text-sm">This property offers strong rental yield potential with nearby amenities and transport links making it attractive to tenants.</p>
                </div>
                <div className="bg-gray-500/10 rounded-xl p-4">
                  <h4 className="text-gray-200 font-medium mb-2">Future Outlook</h4>
                  <p className="text-gray-400 text-sm">Development plans in the area suggest continued growth potential, with new infrastructure projects expected to boost property values.</p>
                </div>
              </div>
            </div>

            {/* Financial Projections */}
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💰</span>
                <h3 className="text-lg font-semibold text-gray-100">Financial Projections</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-500/30">
                      <th className="text-left text-gray-300 py-3">Year</th>
                      <th className="text-left text-gray-300 py-3">Property Value</th>
                      <th className="text-left text-gray-300 py-3">Rental Income</th>
                      <th className="text-left text-gray-300 py-3">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-500/20">
                      <td className="text-gray-200 py-3">2024</td>
                      <td className="text-gray-200 py-3">£450,000</td>
                      <td className="text-gray-200 py-3">£18,900</td>
                      <td className="text-green-400 py-3">4.2%</td>
                    </tr>
                    <tr className="border-b border-gray-500/20">
                      <td className="text-gray-200 py-3">2025</td>
                      <td className="text-gray-200 py-3">£488,250</td>
                      <td className="text-gray-200 py-3">£19,845</td>
                      <td className="text-green-400 py-3">4.1%</td>
                    </tr>
                    <tr className="border-b border-gray-500/20">
                      <td className="text-gray-200 py-3">2026</td>
                      <td className="text-gray-200 py-3">£529,751</td>
                      <td className="text-gray-200 py-3">£20,837</td>
                      <td className="text-green-400 py-3">3.9%</td>
                    </tr>
                    <tr>
                      <td className="text-gray-200 py-3">2027</td>
                      <td className="text-gray-200 py-3">£574,780</td>
                      <td className="text-gray-200 py-3">£21,879</td>
                      <td className="text-green-400 py-3">3.8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 shadow-lg">
                <div className="text-2xl mb-2">🏠</div>
                <h4 className="text-gray-200 font-medium mb-1">Property Type</h4>
                <p className="text-gray-400 text-sm">Semi-detached</p>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 shadow-lg">
                <div className="text-2xl mb-2">📐</div>
                <h4 className="text-gray-200 font-medium mb-1">Floor Area</h4>
                <p className="text-gray-400 text-sm">1,406 sq ft</p>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 shadow-lg">
                <div className="text-2xl mb-2">🛏️</div>
                <h4 className="text-gray-200 font-medium mb-1">Bedrooms</h4>
                <p className="text-gray-400 text-sm">3 bedrooms</p>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 shadow-lg">
                <div className="text-2xl mb-2">🚿</div>
                <h4 className="text-gray-200 font-medium mb-1">Bathrooms</h4>
                <p className="text-gray-400 text-sm">2 bathrooms</p>
              </div>
            </div>

            {/* Long Content Section */}
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📋</span>
                <h3 className="text-lg font-semibold text-gray-100">Detailed Property Information</h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-200 leading-relaxed">
                  This exceptional property represents a unique opportunity in the current market. Located in a highly desirable area with excellent transport links and local amenities, it offers both immediate rental potential and long-term capital growth prospects.
                </p>
                <p className="text-gray-200 leading-relaxed">
                  The property has been well-maintained and features modern fixtures throughout. The open-plan living area provides excellent space for families, while the private garden offers outdoor space that's increasingly valuable in today's market.
                </p>
                <p className="text-gray-200 leading-relaxed">
                  Recent renovations include a new kitchen with integrated appliances, updated bathroom suites, and energy-efficient heating systems. These improvements not only enhance the property's appeal but also contribute to its rental yield potential.
                </p>
                <p className="text-gray-200 leading-relaxed">
                  The local area has seen significant investment in recent years, with new shopping centers, restaurants, and leisure facilities opening nearby. This development has contributed to the area's growing popularity and property values.
                </p>
                <p className="text-gray-200 leading-relaxed">
                  Transport links are excellent, with the nearest station just a 5-minute walk away, providing direct access to the city center in under 20 minutes. This connectivity makes the property attractive to commuters and contributes to its rental appeal.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel Overlay */}
        {rightPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end items-start animate-[fadeIn_0.15s_ease-out]">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
              onClick={() => setRightPanelOpen(false)}
            />
            
            {/* Right Panel (Dark Glass) */}
            <div className="relative w-[720px] bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col shadow-2xl rounded-2xl mr-6 mt-6 mb-6 animate-[slideInRight_0.3s_cubic-bezier(0.4,0,0.2,1)]">
              <div className="p-6 border-b border-gray-500/30 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-fg-primary">
                  {subsections[activeSection]?.find(s => s.id === activeSubsection)?.label}
                </h3>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"
                >
                  <span className="text-fg-muted hover:text-fg-primary text-xl">✕</span>
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                    <h4 className="font-semibold text-fg-primary mb-3 text-lg">Details</h4>
                    <p className="text-fg-muted leading-relaxed">
                      This is where the {activeSubsection} details would be displayed. 
                      You can access specific information without leaving the main dashboard.
                      The panel is now wider and overlays on top of the main content.
                    </p>
                  </div>
                  
                  <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                    <h4 className="font-semibold text-fg-primary mb-3 text-lg">Actions</h4>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-3 bg-accent text-accent-fg rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Edit Details
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-gray-500/20 text-fg-primary rounded-lg font-medium hover:bg-gray-500/30 transition-colors">
                        Export Data
                      </button>
                      <button className="w-full text-left px-4 py-3 border border-gray-500/30 text-fg-primary rounded-lg font-medium hover:bg-gray-500/20 transition-colors">
                        Share Report
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                    <h4 className="font-semibold text-fg-primary mb-3 text-lg">Quick Info</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                        <span className="text-fg-muted">Last updated</span>
                        <span className="text-fg-primary font-medium">2 hours ago</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                        <span className="text-fg-muted">Status</span>
                        <span className="text-green-400 font-medium">Active</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                        <span className="text-fg-muted">Priority</span>
                        <span className="text-accent font-medium">High</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-fg-muted">Progress</span>
                        <span className="text-fg-primary font-medium">75%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                    <h4 className="font-semibold text-fg-primary mb-3 text-lg">Recent Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span className="text-sm text-fg-muted">Property data updated</span>
                        <span className="text-xs text-fg-muted ml-auto">2h ago</span>
                      </div>
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-fg-muted">Valuation completed</span>
                        <span className="text-xs text-fg-muted ml-auto">1d ago</span>
                      </div>
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm text-fg-muted">Report generated</span>
                        <span className="text-xs text-fg-muted ml-auto">3d ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
