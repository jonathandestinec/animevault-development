'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  clearStoredToken,
  getStoredToken,
  signInWithAniList,
  storeToken,
} from '@/lib/anilist'

export function useAnilistAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

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

  const signIn = useCallback(() => {
    signInWithAniList()
  }, [])

  const completeSignIn = useCallback((newToken: string) => {
    storeToken(newToken)
    setToken(newToken)
  }, [])

  const signOut = useCallback(() => {
    clearStoredToken()
    setToken(null)
  }, [])

  return { token, ready, signedIn: !!token, signIn, completeSignIn, signOut }
}
