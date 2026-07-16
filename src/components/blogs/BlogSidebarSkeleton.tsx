export default function BlogSidebarSkeleton() {
  return (
    <div
      className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      aria-label="Loading blog sidebar"
      aria-busy="true"
    >
      <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
      <div className="flex gap-2 overflow-hidden">
        <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-orange-100" />
        <div className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-orange-100" />
        <div className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-orange-100" />
      </div>
      <span className="sr-only">Loading blog filters and recent posts</span>
    </div>
  )
}
