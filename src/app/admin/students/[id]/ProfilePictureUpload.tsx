'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import imageCompression from 'browser-image-compression'

type ImageSize = { width: number; height: number }

export default function ProfilePictureUpload({
  studentId,
  uploadAction,
}: {
  studentId: string
  uploadAction: (studentId: string, formData: FormData) => Promise<unknown>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isPreparing, setIsPreparing] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceName, setSourceName] = useState('profile.jpg')
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 1, height: 1 })
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  }, [sourceUrl])

  const closeEditor = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setSourceUrl('')
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsPreparing(true)
    try {
      const prepared = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      })
      const url = URL.createObjectURL(prepared)
      const image = new Image()
      image.onload = () => {
        setImageSize({ width: image.naturalWidth, height: image.naturalHeight })
        setSourceName(file.name.replace(/\.[^.]+$/, '') || 'profile')
        setSourceUrl(url)
        setIsPreparing(false)
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        setIsPreparing(false)
        alert('This image could not be opened. Please choose a JPG, PNG or WebP image.')
      }
      image.src = url
    } catch (error) {
      console.error('Image preparation failed', error)
      setIsPreparing(false)
      alert('Failed to prepare this picture.')
    }
  }

  const createCroppedFile = async () => {
    const outputSize = 640
    const image = new Image()
    image.src = sourceUrl
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image editor is unavailable.')

    const coverScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight)
    const scale = coverScale * zoom
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    const maxPanX = Math.max(0, (width - outputSize) / 2)
    const maxPanY = Math.max(0, (height - outputSize) / 2)
    const x = (outputSize - width) / 2 + (offsetX / 100) * maxPanX
    const y = (outputSize - height) / 2 + (offsetY / 100) * maxPanY

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, outputSize, outputSize)
    context.drawImage(image, x, y, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('Crop failed.')), 'image/jpeg', 0.82)
    })
    const cropped = new File([blob], `${sourceName}-profile.jpg`, { type: 'image/jpeg' })
    return imageCompression(cropped, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: outputSize,
      useWebWorker: true,
      fileType: 'image/jpeg',
    })
  }

  const uploadCroppedPicture = () => {
    setIsPreparing(true)
    startTransition(async () => {
      try {
        const croppedFile = await createCroppedFile()
        const formData = new FormData()
        formData.append('file', croppedFile, croppedFile.name)
        await uploadAction(studentId, formData)
        closeEditor()
      } catch (error) {
        console.error('Upload failed', error)
        alert('Failed to crop or upload picture.')
      } finally {
        setIsPreparing(false)
      }
    })
  }

  const previewSize = 288
  const previewScale = Math.max(previewSize / imageSize.width, previewSize / imageSize.height) * zoom
  const previewWidth = imageSize.width * previewScale
  const previewHeight = imageSize.height * previewScale
  const previewPanX = Math.max(0, (previewWidth - previewSize) / 2)
  const previewPanY = Math.max(0, (previewHeight - previewSize) / 2)
  const isLoading = isPending || isPreparing

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}>
        <span>{isPreparing ? 'Preparing…' : isPending ? 'Uploading…' : 'Change Picture'}</span>
        <input ref={fileInputRef} type="file" name="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} disabled={isLoading} />
      </label>

      {sourceUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="profile-crop-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id="profile-crop-title" className="text-xl font-black text-gray-900">Crop Profile Picture</h2>
              <button type="button" onClick={closeEditor} disabled={isLoading} aria-label="Close image editor" className="min-h-11 min-w-11 rounded-full text-xl text-gray-600 hover:bg-gray-100">×</button>
            </div>

            <div className="mx-auto mt-4 h-72 w-72 overflow-hidden rounded-full bg-gray-100 ring-4 ring-white shadow-inner outline outline-1 outline-gray-300">
              <img
                src={sourceUrl}
                alt="Profile crop preview"
                className="pointer-events-none relative max-w-none select-none"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  left: (previewSize - previewWidth) / 2 + (offsetX / 100) * previewPanX,
                  top: (previewSize - previewHeight) / 2 + (offsetY / 100) * previewPanY,
                }}
              />
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-bold text-gray-700">Zoom
                <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="mt-2 w-full accent-banner-dark" />
              </label>
              <label className="block text-sm font-bold text-gray-700">Move left / right
                <input type="range" min="-100" max="100" value={offsetX} onChange={event => setOffsetX(Number(event.target.value))} className="mt-2 w-full accent-banner-dark" />
              </label>
              <label className="block text-sm font-bold text-gray-700">Move up / down
                <input type="range" min="-100" max="100" value={offsetY} onChange={event => setOffsetY(Number(event.target.value))} className="mt-2 w-full accent-banner-dark" />
              </label>
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-500">Large images are automatically resized and compressed to a web-friendly square image.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeEditor} disabled={isLoading} className="min-h-11 rounded-xl border border-gray-300 px-5 py-2.5 font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={uploadCroppedPicture} disabled={isLoading} className="min-h-11 rounded-xl bg-banner-dark px-5 py-2.5 font-bold text-white hover:bg-[#0b5226] disabled:opacity-50">{isLoading ? 'Processing…' : 'Crop & Upload'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
