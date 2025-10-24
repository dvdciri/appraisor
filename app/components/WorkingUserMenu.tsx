'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { signOut } from 'next-auth/react'

interface WorkingUserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function WorkingUserMenu({ user }: WorkingUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition-colors cursor-pointer"
        type="button"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
        <span className="text-white text-sm font-medium">{user.name}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-[1000]" style={{ backgroundColor: 'rgba(30, 15, 45, 0.95)' }}>
          <div className="py-2">
            {/* User Info */}
            <div className="px-4 py-2 border-b border-gray-700">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-gray-400 text-xs">{user.email}</p>
            </div>
            
            {/* Logout Button */}
            <div className="px-4 py-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3 cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
