'use client'

import { Play, Tv } from 'lucide-react'
import { useAnilistAuth } from '@/hooks/use-anilist-auth'

export function LoginScreen({ error }: { error?: string | null }) {
  const { signIn, configured } = useAnilistAuth()

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fb] px-6 text-[#20212b]">
      <div className="w-full max-w-[460px] text-center">
        <div className="mx-auto mb-6 grid size-12 place-items-center rounded-2xl bg-[#5146e5] text-white shadow-lg shadow-indigo-200">
          <Play className="fill-current" />
        </div>
        <h1 className="text-[34px] font-bold tracking-[-0.04em]">AnimeVault</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-[#7d7e89]">
          Track your anime, sync your library, and discover what to watch next. Sign in with your
          AniList account to bring your vault to life.
        </p>

        {error ? (
          <div className="mt-8 rounded-2xl border border-[#f3c2bd] bg-[#fdeceb] p-5 text-left">
            <p className="text-sm font-bold text-[#c0392b]">AniList sign-in failed</p>
            <p className="mt-2 break-words text-sm leading-6 text-[#a8443c]">{error}</p>
          </div>
        ) : null}

        {configured === null ? (
          <div className="mt-8 flex h-12 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-[#e7e8ef] border-t-[#5146e5]" />
          </div>
        ) : configured ? (
          <>
            <button
              onClick={signIn}
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#5146e5] px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4238cf]"
            >
              <Tv />
              Connect AniList account
            </button>
            <p className="mt-4 text-xs text-[#a1a2ad]">
              You&apos;ll be sent to AniList to approve access. We only read and update your anime list.
            </p>
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#f3c98a] bg-[#fff7ec] p-5 text-left">
            <p className="text-sm font-bold text-[#9a6a1f]">AniList isn&apos;t connected yet</p>
            <p className="mt-2 text-sm leading-6 text-[#7d5a23]">
              To enable sign-in, register an AniList API client and add its credentials to the app.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[#7d5a23]">
              <li>
                Open{' '}
                <span className="font-semibold">anilist.co/settings/developer</span> and create a new
                client.
              </li>
              <li>
                Set the redirect URL to{' '}
                <span className="font-mono text-xs">https://[your-domain]/auth/callback</span>.
              </li>
              <li>
                Add the credentials to your environment as{' '}
                <span className="font-mono text-xs">ANILIST_CLIENT_ID</span> and{' '}
                <span className="font-mono text-xs">ANILIST_CLIENT_SECRET</span>.
              </li>
            </ol>
            <p className="mt-3 text-xs text-[#a07a30]">
              Refresh this page after saving the values.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
