'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { signout } from '@/app/login/actions'

type MobileMenuProps = {
  userRole?: string | null
  isAuthenticated?: boolean
}

export default function MobileMenu({ userRole, isAuthenticated = false }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="xl:hidden ml-2 flex items-center">
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
            <Link onClick={closeMenu} href="/team" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Our Team
            </Link>
            <Link onClick={closeMenu} href="/enrollment" className="block px-3 py-2 rounded-md text-base font-medium text-banner-dark hover:text-blue-600 hover:bg-gray-50">
              Enrollment
            </Link>
            
            {userRole === 'student' && (
              <Link onClick={closeMenu} href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-green-50">
                Dashboard
              </Link>
            )}
            {userRole === 'teacher' && (
              <Link onClick={closeMenu} href="/teacher" className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-green-50">
                Teacher
              </Link>
            )}
            {userRole === 'staff' && (
              <Link onClick={closeMenu} href="/staff" className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-100 mt-2">
                Staff
              </Link>
            )}
            {userRole === 'admin' && (
              <Link onClick={closeMenu} href="/admin" className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-100 mt-2">
                Admin
              </Link>
            )}
            {isAuthenticated && (
              <form action={signout} className="border-t border-gray-100 pt-2 sm:hidden">
                <button
                  type="submit"
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
