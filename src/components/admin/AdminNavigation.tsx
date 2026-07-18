'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  AcademicCapIcon,
  BanknotesIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  HomeIcon,
  SignalIcon,
  SpeakerWaveIcon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

const enrollmentsHref = '/admin/enrollments'
const monthlyPaymentsHref = '/admin/students/fast-entry'

const navigationGroups = [
  {
    label: 'Dashboard',
    items: [
      { href: '/admin', label: 'Dashboard', shortLabel: 'Dashboard', icon: HomeIcon },
    ],
  },
  {
    label: 'Users & Access',
    items: [
      { href: '/admin/users', label: 'All Users', shortLabel: 'Users', icon: UsersIcon, fullAdminOnly: true },
      { href: '/admin/live-users', label: 'Live Users', shortLabel: 'Live', icon: SignalIcon, fullAdminOnly: true },
      { href: '/admin/students', label: 'Manage Students', shortLabel: 'Students', icon: AcademicCapIcon },
      { href: '/admin/guests', label: 'Guest Users', shortLabel: 'Guests', icon: UserGroupIcon },
      { href: '/admin/team', label: 'Manage Team', shortLabel: 'Team', icon: BriefcaseIcon },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/announcements', label: 'Announcements', shortLabel: 'Notices', icon: SpeakerWaveIcon },
      { href: '/admin/blogs', label: 'Blogs', shortLabel: 'Blogs', icon: DocumentTextIcon },
      { href: '/admin/comments', label: 'Comments', shortLabel: 'Comments', icon: ChatBubbleLeftEllipsisIcon },
      { href: '/admin/activities', label: 'Activities', shortLabel: 'Activities', icon: StarIcon },
      { href: '/admin/books', label: 'Manage Books', shortLabel: 'Books', icon: BookOpenIcon },
      { href: '/admin/messages', label: 'Messages', shortLabel: 'Messages', icon: EnvelopeIcon },
    ],
  },
  {
    label: 'Data & Reports',
    items: [
      { href: '/admin/academic-setup', label: 'Academic Setup', shortLabel: 'Academic', icon: BuildingLibraryIcon },
      { href: enrollmentsHref, label: 'Enrollments', shortLabel: 'Enrollments', icon: ClipboardDocumentCheckIcon },
      { href: monthlyPaymentsHref, label: 'Monthly Payment', shortLabel: 'Payments', icon: BanknotesIcon },
      { href: '/admin/student-reports', label: 'Student Reports', shortLabel: 'Student Reports', icon: DocumentTextIcon },
      { href: '/admin/teacher-reports', label: 'Teacher Reports', shortLabel: 'Reports', icon: ClipboardDocumentCheckIcon },
    ],
  },
]

export default function AdminNavigation({ isFullAdmin }: { isFullAdmin: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const visibleGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.fullAdminOnly || isFullAdmin),
  }))
  const visibleItems = visibleGroups.flatMap(group => group.items)
  const activeHref = visibleItems
    .filter(item => {
      if (item.href === monthlyPaymentsHref) {
        return pathname === monthlyPaymentsHref
          || (pathname === enrollmentsHref && searchParams.get('type') === 'monthly_payment')
      }
      if (item.href === enrollmentsHref) {
        return pathname === enrollmentsHref && searchParams.get('type') !== 'monthly_payment'
      }
      return pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <>
      <div className="sticky top-20 z-40 w-full flex-shrink-0 border-b border-gray-200 bg-white shadow-sm md:hidden">
        <nav
          aria-label="Admin navigation"
          className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex w-max min-w-full snap-x snap-mandatory gap-1 px-3 py-2">
            {visibleItems.map(item => {
              const Icon = item.icon
              const isActive = activeHref === item.href

              return (
                <li key={item.href} className="shrink-0 snap-start">
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0f6630] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" focusable="false" />
                    <span>{item.shortLabel}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <nav aria-label="Admin navigation" className="h-full overflow-y-auto px-3 py-4">
          <ul className="space-y-6 font-medium">
            {visibleGroups.map(group => (
              <li key={group.label}>
                {group.label !== 'Dashboard' && (
                  <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {group.label}
                  </h2>
                )}
                <ul className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon
                    const isActive = activeHref === item.href

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          className={`group flex items-center rounded-lg p-2 transition-colors ${
                            isActive
                              ? 'bg-green-50 text-[#0f6630]'
                              : 'text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 transition-colors ${
                              isActive ? 'text-[#0f6630]' : 'text-gray-500 group-hover:text-gray-900'
                            }`}
                            aria-hidden="true"
                            focusable="false"
                          />
                          <span className="ms-3">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
