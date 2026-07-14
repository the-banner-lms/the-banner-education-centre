'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTeamMember, updateTeamMember } from '@/app/actions/teamActions'

export default function TeamForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      if (isEditing) {
        await updateTeamMember(initialData.id, formData)
      } else {
        await createTeamMember(formData)
      }
    } catch (error) {
      console.error('Submission failed:', error)
      alert('Failed to save team member')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        
        {/* Name */}
        <div className="sm:col-span-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <div className="mt-1">
            <input type="text" name="name" id="name" required defaultValue={initialData?.name} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        {/* Role */}
        <div className="sm:col-span-1">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role/Title</label>
          <div className="mt-1">
            <input type="text" name="role" id="role" required defaultValue={initialData?.role} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        {/* Image URL */}
        <div className="sm:col-span-1">
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">Image URL</label>
          <div className="mt-1">
            <input type="text" name="image_url" id="image_url" defaultValue={initialData?.image_url} placeholder="/images/team/placeholder.png" className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        {/* Order Index */}
        <div className="sm:col-span-1">
          <label htmlFor="order_index" className="block text-sm font-medium text-gray-700">Order (0 is first)</label>
          <div className="mt-1">
            <input type="number" name="order_index" id="order_index" defaultValue={initialData?.order_index || 0} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        {/* Bio */}
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
          <div className="mt-1">
            <textarea name="bio" id="bio" rows={4} defaultValue={initialData?.bio} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

      </div>

      <div className="pt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-banner-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
