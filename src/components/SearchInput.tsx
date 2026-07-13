"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import Form from 'next/form'

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (newQuery.trim()) {
      router.prefetch(`/search?q=${encodeURIComponent(newQuery)}`)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
      <Form action="/search" className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex-grow relative">
          <label htmlFor="q" className="sr-only">Search</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            name="q"
            id="q"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search anything across the site..."
            className="block w-full pl-10 border-gray-300 rounded-xl shadow-sm focus:ring-banner-light focus:border-banner-dark sm:text-base p-3 border transition-shadow"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-banner-dark hover:bg-banner-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark transition-colors shadow-sm"
        >
          Search
        </button>
      </Form>
    </div>
  )
}
