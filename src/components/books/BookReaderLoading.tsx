import { BookOpenIcon } from '@heroicons/react/24/outline'

export default function BookReaderLoading({ message = 'Preparing your book…' }: { message?: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#eef3ef] px-4" role="status" aria-live="polite">
      <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-lg">
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-banner-dark text-white shadow-md">
          <BookOpenIcon className="h-8 w-8" aria-hidden="true" />
          <span className="absolute -inset-1 animate-ping rounded-2xl border-2 border-banner-light/55" aria-hidden="true" />
        </div>
        <p className="mt-5 font-semibold text-banner-brown">{message}</p>
        <p className="mt-1 text-sm text-gray-500">The first page will appear shortly.</p>
      </div>
    </div>
  )
}
