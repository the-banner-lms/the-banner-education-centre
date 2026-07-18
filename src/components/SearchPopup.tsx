"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Form from 'next/form'

export default function SearchPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const popupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (newQuery.trim()) {
      router.prefetch(`/search?q=${encodeURIComponent(newQuery)}`)
    }
  }

  return (
    <div className="relative flex items-center" ref={popupRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-indigo-600 p-2 rounded-full focus:outline-none transition-colors"
        aria-label="Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      {isOpen && (
        <div className="fixed left-4 right-4 top-20 z-50 mt-2 w-auto rounded-xl border border-gray-100 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-72">
          <Form action="/search" onSubmit={() => setIsOpen(false)}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                name="q"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <button 
                type="submit" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                Go
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  )
}
