'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAnilistAuth } from '@/hooks/use-anilist-auth'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { completeSignIn } = useAnilistAuth()
  const [error, setError] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    // The server (/auth/callback) exchanges the authorization code and hands
    // the token over in the URL fragment (#access_token=...).
    const hash = window.location.hash.replace(/^#/, '')
    const hashParams = new URLSearchParams(hash)
    const accessToken = hashParams.get('access_token')

    const errorParam = params.get('error')

    if (errorParam) {
      setError(`AniList rejected the sign-in: ${errorParam}`)
      return
    }

    if (accessToken) {
      completeSignIn(accessToken)
      router.replace('/')
      return
    }

    setError('No access token was returned by AniList. Please try signing in again.')
  }, [completeSignIn, params, router])

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fb] px-6 text-[#20212b]">
      <div className="w-full max-w-md rounded-2xl border border-[#ececf2] bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-bold">Sign-in didn&apos;t complete</h1>
            <p className="mt-2 text-sm text-[#858698]">{error}</p>
            <button
              onClick={() => router.replace('/')}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-[#5146e5] px-5 text-sm font-bold text-white hover:bg-[#4238cf]"
            >
              Back to AnimeVault
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-[#e7e8ef] border-t-[#5146e5]" />
            <h1 className="text-xl font-bold">Connecting your AniList account</h1>
            <p className="mt-2 text-sm text-[#858698]">Finishing your sign-in…</p>
          </>
        )}
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f7f8fb] text-[#20212b]">
          <div className="size-10 animate-spin rounded-full border-2 border-[#e7e8ef] border-t-[#5146e5]" />
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
