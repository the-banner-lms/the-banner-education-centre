'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import PasswordInput from '@/components/forms/PasswordInput'

export default function SetStudentPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setSessionReady(Boolean(data.session))
      setChecking(false)
    }
    void checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setSessionReady(Boolean(session))
      setChecking(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (formData: FormData) => {
    const password = String(formData.get('password') || '')
    const confirmation = String(formData.get('confirmation') || '')
    setMessage(null)

    if (password.length < 8) {
      setMessage('Password must contain at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setMessage('The passwords do not match.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message || 'Password could not be saved. Request a new invitation from the school.')
      setSaving(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-banner-dark">Student Account</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">Set your password</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Create a private password to access your student dashboard.</p>

        {checking ? (
          <p className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Checking invitation…</p>
        ) : !sessionReady ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
            This invitation is invalid or has expired. Ask the school to save the enrollment as approved again for a new email link.
          </div>
        ) : (
          <form action={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="student-new-password" className="block text-sm font-bold text-gray-800">New Password</label>
              <PasswordInput id="student-new-password" name="password" minLength={8} required autoComplete="new-password" className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30" />
            </div>
            <div>
              <label htmlFor="student-confirm-password" className="block text-sm font-bold text-gray-800">Confirm Password</label>
              <PasswordInput id="student-confirm-password" name="confirmation" minLength={8} required autoComplete="new-password" className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30" />
            </div>
            {message && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p>}
            <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-banner-dark px-6 py-3 font-bold text-white hover:bg-[#0b5226] disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Saving…' : 'Set Password & Open Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
