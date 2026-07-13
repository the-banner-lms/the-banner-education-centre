'use client'

import { usePresence } from '@/components/PresenceTracker'
import Link from 'next/link'

export default function AdminLiveUsersPage() {
  const usersList = usePresence()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Users</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
          {usersList.length} Online
        </span>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {usersList.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No users currently online.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {usersList.map((u) => (
              <li key={u.user_id} className="hover:bg-indigo-50/30 transition-colors group relative cursor-pointer" title={`View ${u.full_name || 'User'} Dashboard`}>
                <Link href={`/dashboard/${u.user_id}`} className="p-4 flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4 flex-1">
                    <img 
                      className="h-10 w-10 rounded-full group-hover:ring-2 group-hover:ring-indigo-300 transition-all" 
                      src={u.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.full_name || 'Guest') + '&background=random'} 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                          {u.full_name || 'No Name'}
                        </p>
                        {u.role && (
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${
                            u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' :
                            u.role === 'staff' ? 'bg-teal-100 text-teal-800' :
                            u.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'guest' ? 'bg-gray-100 text-gray-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {u.email !== 'guest@anonymous' ? u.email : 'Unauthenticated Visitor'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="mb-1 flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Current Page</span>
                      <span className="text-sm font-medium text-indigo-600 truncate max-w-[200px]" title={u.current_page || 'Unknown'}>
                        {u.current_page || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Since {new Date(u.online_at).toLocaleTimeString()}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
