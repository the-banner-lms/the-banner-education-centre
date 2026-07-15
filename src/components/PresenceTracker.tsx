'use client'

import { useEffect, useState, createContext, useContext, useRef, startTransition } from 'react'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
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
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map())
  const pathname = usePathname()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const trackDataRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    let idleCallbackId: number | null = null
    let fallbackTimerId: number | null = null

    const initPresence = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      if (cancelled) return

      const supabase = createClient()
      supabaseRef.current = supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      
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

        // Presence updates must never compete with a user's click or tap.
        startTransition(() => setOnlineUsers(newOnlineUsers))
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

    if ('requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(() => void initPresence(), { timeout: 3000 })
    } else {
      fallbackTimerId = globalThis.setTimeout(() => void initPresence(), 0) as unknown as number
    }

    return () => {
      cancelled = true
      if (idleCallbackId !== null) {
        window.cancelIdleCallback(idleCallbackId)
      }
      if (fallbackTimerId !== null) {
        window.clearTimeout(fallbackTimerId)
      }
      if (supabaseRef.current && channelRef.current) {
        void supabaseRef.current.removeChannel(channelRef.current)
      }
    }
  }, [])

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
