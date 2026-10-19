'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { AnilistMedia, AnimeStatus, pickTitle } from '@/lib/anilist'
import { useAnilistSearch } from '@/hooks/use-anilist-data'

interface SearchModalProps {
  token: string | null
  open: boolean
  onClose: () => void
  onAdd: (media: AnilistMedia, status: AnimeStatus) => Promise<void>
  trackedIds: Set<number>
}

export function SearchModal({ token, open, onClose, onAdd, trackedIds }: SearchModalProps) {
  const { query, results, loading, error, run, clear } = useAnilistSearch(token)
  const [addingId, setAddingId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      clear()
      setAddingId(null)
    } else {
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open, clear])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleAdd = async (media: AnilistMedia) => {
    setAddingId(media.id)
    try {
      await onAdd(media, 'PLANNING')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-start bg-[#20212b]/40 p-4 pt-[8vh] sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#ececf2] px-4 py-3">
          <Search className="text-[#a2a3ad]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => void run(e.target.value)}
            placeholder="Search the AniList catalog…"
            className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b0b1bb]"
          />
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-[#7d7e89] hover:bg-[#f5f5f8]"
            aria-label="Close search"
          >
            <X />
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="h-16 w-12 rounded bg-[#eeeef4]" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-2/3 rounded bg-[#eeeef4]" />
                    <div className="h-3 w-1/3 rounded bg-[#eeeef4]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="p-6 text-center text-sm text-[#c0392b]">{error}</p>
          ) : results.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#91929e]">
              {query.trim()
                ? 'No results yet — try a title like "Frieren" or "Solo Leveling".'
                : 'Start typing to search every anime on AniList.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((media) => {
                const title = pickTitle(media.title)
                const isTracked = trackedIds.has(media.id)
                return (
                  <li
                    key={media.id}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#f7f7fb]"
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-[#eeeef4]">
                      {media.coverImage?.large ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.coverImage.large}
                          alt={`${title} cover`}
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{title}</p>
                      <p className="mt-0.5 text-[11px] text-[#91929e]">
                        {media.format ?? 'TV'}
                        {media.seasonYear ? ` · ${media.seasonYear}` : ''}
                        {media.episodes ? ` · ${media.episodes} eps` : ''}
                        {media.averageScore ? ` · ${media.averageScore}%` : ''}
                      </p>
                    </div>
                    {isTracked ? (
                      <span className="rounded-lg bg-[#f0f0ff] px-2.5 py-1.5 text-[11px] font-bold text-[#5146e5]">
                        In library
                      </span>
                    ) : (
                      <button
                        onClick={() => void handleAdd(media)}
                        disabled={addingId === media.id}
                        className="flex items-center gap-1 rounded-lg bg-[#5146e5] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#4238cf] disabled:opacity-60"
                      >
                        <Plus />
                        {addingId === media.id ? 'Adding…' : 'Add'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
