'use client'

import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

export type OnlineUser = {
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  online_at: string
  current_page?: string
  role?: string
}

const PresenceContext = createContext<OnlineUser[]>([])

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map())
  const pathname = usePathname()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const trackDataRef = useRef<any>(null)

  useEffect(() => {
    const initPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user ? user.id : 'anonymous-' + Math.random(),
          },
        },
      })
      channelRef.current = channel

      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const newOnlineUsers = new Map<string, OnlineUser>()
        
        for (const id in newState) {
          const presences = newState[id] as any[]
          if (presences.length > 0) {
            newOnlineUsers.set(id, presences[0] as OnlineUser)
          }
        }
        
        setOnlineUsers(newOnlineUsers)
      })

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (profile) {
              trackDataRef.current = {
                user_id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                online_at: new Date().toISOString(),
                role: profile.role,
              }
            }
          } else {
            trackDataRef.current = {
              user_id: 'guest-' + Math.random().toString(36).substring(2, 9),
              email: 'guest@anonymous',
              full_name: 'Guest User',
              avatar_url: 'https://ui-avatars.com/api/?name=Guest+User&background=random',
              online_at: new Date().toISOString(),
              role: 'guest',
            }
          }
          
          if (trackDataRef.current) {
            await channel.track({
              ...trackDataRef.current,
              current_page: window.location.pathname,
            })
          }
        }
      })
    }

    initPresence()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase])

  useEffect(() => {
    if (channelRef.current && trackDataRef.current) {
      channelRef.current.track({
        ...trackDataRef.current,
        current_page: pathname,
      }).catch(console.error)
    }
  }, [pathname])

  return (
    <PresenceContext.Provider value={Array.from(onlineUsers.values())}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  return useContext(PresenceContext)
}
