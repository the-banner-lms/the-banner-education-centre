'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

type MobileMenuProps = {
  userRole?: string | null
}

export default function MobileMenu({ userRole }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="lg:hidden ml-2 flex items-center">
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md text-banner-dark hover:text-banner-dark/70 hover:bg-banner-light/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-banner-dark"
      >
        <span className="sr-only">Open main menu</span>
        {isOpen ? (
          <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white shadow-lg border-b border-gray-200 z-50">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link onClick={closeMenu} href="/" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Home
            </Link>
            <Link onClick={closeMenu} href="/textbook" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Bookshelf
            </Link>
            <Link onClick={closeMenu} href="/blog" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Blog
            </Link>
            <Link onClick={closeMenu} href="/activities" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Activities
            </Link>
            <Link onClick={closeMenu} href="/forum" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Forum
            </Link>
            
            {userRole === 'student' && (
              <Link onClick={closeMenu} href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-green-50">
                Student Dashboard
              </Link>
            )}
            {userRole === 'teacher' && (
              <Link onClick={closeMenu} href="/teacher" className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-green-50">
                Teacher Panel
              </Link>
            )}
            {userRole === 'staff' && (
              <Link onClick={closeMenu} href="/staff" className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-100 mt-2">
                Staff Panel
              </Link>
            )}
            {userRole === 'admin' && (
              <Link onClick={closeMenu} href="/admin" className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-100 mt-2">
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
