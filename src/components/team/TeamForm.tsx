'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { createTeamMember, updateTeamMember } from '@/app/actions/teamActions'

interface TeamMemberFormData {
  id: string
  name: string
  role: string
  bio: string | null
  image_url: string | null
  order_index: number
}

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maximumOriginalImageSize = 20 * 1024 * 1024

export default function TeamForm({ initialData }: { initialData?: TeamMemberFormData }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '')
  const [removePhoto, setRemovePhoto] = useState(false)
  const isEditing = Boolean(initialData)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const replaceObjectUrl = (file: File | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = file ? URL.createObjectURL(file) : null
    setSelectedPhotoPreview(objectUrlRef.current)
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSubmitError('')
    if (!allowedImageTypes.has(file.type)) {
      setSubmitError('Please choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > maximumOriginalImageSize) {
      setSubmitError('The original photo must be 20 MB or smaller.')
      event.target.value = ''
      return
    }

    setSelectedPhoto(file)
    setRemovePhoto(false)
    replaceObjectUrl(file)
  }

  const handleRemovePhoto = () => {
    setSelectedPhoto(null)
    setImageUrl('')
    setRemovePhoto(true)
    replaceObjectUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    const formData = new FormData(event.currentTarget)

    try {
      if (selectedPhoto) {
        const compressedPhoto = await imageCompression(selectedPhoto, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })
        formData.set('profile_photo', compressedPhoto, selectedPhoto.name)
      }

      if (isEditing && initialData) {
        await updateTeamMember(initialData.id, formData)
      } else {
        await createTeamMember(formData)
      }
    } catch (error) {
      console.error('Submission failed:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to save team member.')
      setIsSubmitting(false)
    }
  }

  const visiblePhoto = selectedPhotoPreview || (!removePhoto ? imageUrl : '')
  const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(initialData?.name || 'Team Member')}&size=256`

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <div className="mt-1">
            <input type="text" name="name" id="name" required defaultValue={initialData?.name} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role/Title</label>
          <div className="mt-1">
            <input type="text" name="role" id="role" required defaultValue={initialData?.role} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        <div className="sm:col-span-2">
          <span className="block text-sm font-medium text-gray-700">Profile Photo</span>
          <div className="mt-2 flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
            <img
              src={visiblePhoto || fallbackPhoto}
              alt="Team member profile preview"
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 space-y-3">
              <div>
                <label htmlFor="profile_photo" className="inline-flex cursor-pointer items-center rounded-md bg-banner-dark px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90">
                  {visiblePhoto ? 'Replace Photo' : 'Choose Photo'}
                </label>
                <input
                  ref={fileInputRef}
                  id="profile_photo"
                  name="profile_photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                {!removePhoto && (visiblePhoto || initialData?.image_url) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSubmitting}
                    className="ml-3 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">JPG, PNG, or WebP. The photo is automatically resized before upload.</p>
              {selectedPhoto && <p className="text-xs font-medium text-indigo-700">Selected: {selectedPhoto.name}</p>}
            </div>
          </div>
          <input type="hidden" name="remove_photo" value={removePhoto ? 'true' : 'false'} />
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">Or use an Image URL</label>
          <div className="mt-1">
            <input
              type="text"
              name="image_url"
              id="image_url"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value)
                setRemovePhoto(false)
              }}
              placeholder="https://example.com/photo.jpg"
              className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="order_index" className="block text-sm font-medium text-gray-700">Order (0 is first)</label>
          <div className="mt-1">
            <input type="number" name="order_index" id="order_index" defaultValue={initialData?.order_index || 0} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
          <div className="mt-1">
            <textarea name="bio" id="bio" rows={4} defaultValue={initialData?.bio || ''} className="shadow-sm focus:ring-banner-dark focus:border-banner-dark block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
          </div>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="pt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-banner-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark disabled:opacity-50"
        >
          {isSubmitting ? (selectedPhoto ? 'Uploading...' : 'Saving...') : 'Save'}
        </button>
      </div>
    </form>
  )
}
