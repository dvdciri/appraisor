'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/search' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Google Maps Static API Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=53.4808,-2.2426&zoom=12&size=3840x2160&maptype=roadmap&scale=2&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY})`,
          imageRendering: 'crisp-edges'
        }}
      />
      
      {/* Cosmic dark purple overlay for map */}
      <div className="absolute inset-0 z-10">
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-gray-900/60 to-purple-900/65" />
        
        {/* Nebula Core */}
        <div className="absolute inset-0 bg-gradient-radial from-purple-700/50 via-purple-900/30 to-transparent" />
        
        {/* Swirling Nebula Effect */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(ellipse 90% 55% at 22% 32%, rgba(139, 92, 246, 0.35) 0%, transparent 55%),
              radial-gradient(ellipse 70% 45% at 78% 68%, rgba(59, 130, 246, 0.25) 0%, transparent 55%),
              radial-gradient(ellipse 75% 65% at 52% 18%, rgba(168, 85, 247, 0.2) 0%, transparent 55%),
              radial-gradient(ellipse 55% 85% at 12% 78%, rgba(236, 72, 153, 0.15) 0%, transparent 55%)
            `
          }}
        />
        
        {/* Animated Cosmic Dust */}
        <div 
          className="absolute inset-0 opacity-50 animate-pulse"
          style={{
            background: `
              radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.08), transparent),
              radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.05), transparent),
              radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.08), transparent),
              radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.05), transparent),
              radial-gradient(2px 2px at 160px 30px, rgba(255, 255, 255, 0.08), transparent)
            `,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 100px'
          }}
        />
        
        {/* Dark Nebula Clouds */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 0% 0%, rgba(0, 0, 0, 0.4) 0%, transparent 70%),
              radial-gradient(ellipse 80% 100% at 100% 100%, rgba(0, 0, 0, 0.3) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0, 0, 0, 0.2) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Cosmic Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-gradient-radial from-purple-500/25 via-purple-600/15 to-transparent animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-[24rem] h-[24rem] bg-gradient-radial from-blue-500/20 via-blue-600/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[22rem] h-[22rem] bg-gradient-radial from-pink-500/18 via-pink-600/8 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Final overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>
      
      {/* Main Content */}
      <main className="relative z-50 h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Login Form */}
          <div className="relative rounded-2xl p-8 shadow-2xl overflow-hidden">
            {/* Solid transparent purple background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-accent-foreground" />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Appraisor Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to Appraisor</h1>
              <p className="text-gray-300 text-sm mb-8">Sign in to access property analysis</p>
              
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
