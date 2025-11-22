'use client'

import Image from 'next/image'
import WorkingUserMenu from '../../components/WorkingUserMenu'
import { useSession } from 'next-auth/react'

export default function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <header className="flex-shrink-0 z-[999] p-6 pb-6">
      <div className="w-full max-w-full mx-auto">
        <div className="flex items-center justify-between rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl border border-gray-500/30 bg-black/20">
          {/* Left side - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="Appraisor Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-white">Appraisor</span>
          </div>
          
          {/* Right side - Credits and User menu */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-sm">30 Credits available</span>
            </div>
            
            <WorkingUserMenu user={session?.user || { name: 'User', email: 'user@example.com' }} />
          </div>
        </div>
      </div>
    </header>
  )
}

