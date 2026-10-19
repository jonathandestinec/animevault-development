'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from '@/lib/anilist'

export function useAnilistAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  // null = still checking whether the server has AniList credentials configured
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    setToken(getStoredToken())
    setReady(true)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'animevault:anilist_token') {
        setToken(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/anilist/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setConfigured(Boolean(data?.configured))
      })
      .catch(() => {
        if (active) setConfigured(false)
      })
    return () => {
      active = false
    }
  }, [])

  // The whole OAuth handshake happens on the server so the client secret is
  // never shipped to the browser.
  const signIn = useCallback(() => {
    window.location.assign('/api/anilist/connect')
  }, [])

  const completeSignIn = useCallback((newToken: string) => {
    storeToken(newToken)
    setToken(newToken)
  }, [])

  const signOut = useCallback(() => {
    clearStoredToken()
    setToken(null)
    void fetch('/api/anilist/logout', { method: 'POST' }).catch(() => {})
  }, [])

  return { token, ready, configured, signedIn: !!token, signIn, completeSignIn, signOut }
}
