'use client'

import { useRef, useState, useTransition } from 'react'
import imageCompression from 'browser-image-compression'

export default function ProfilePictureUpload({ 
  studentId, 
  uploadAction 
}: { 
  studentId: string, 
  uploadAction: (studentId: string, formData: FormData) => Promise<any>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isCompressing, setIsCompressing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressing(true)
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }
      
      const compressedFile = await imageCompression(file, options)
      
      const formData = new FormData()
      formData.append('file', compressedFile, file.name)
      
      startTransition(async () => {
        try {
          await uploadAction(studentId, formData)
        } catch (error) {
          console.error('Upload failed', error)
          alert('Failed to upload picture.')
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      })
    } catch (error) {
      console.error('Compression failed', error)
      alert('Failed to compress picture.')
    } finally {
      setIsCompressing(false)
    }
  }

  const isLoading = isPending || isCompressing

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className={`cursor-pointer bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-indigo-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <span>{isLoading ? (isCompressing ? 'Compressing...' : 'Uploading...') : 'Change Picture'}</span>
        <input 
          ref={fileInputRef}
          type="file" 
          name="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={isLoading}
        />
      </label>
    </div>
  )
}
