'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star, X } from 'lucide-react'
import {
  AnilistListEntry,
  AnilistMedia,
  AnimeStatus,
  FILTER_LABELS,
  pickTitle,
  stripHtml,
} from '@/lib/anilist'

interface DetailsModalProps {
  entry: AnilistListEntry | null
  media: AnilistMedia | null
  loading: boolean
  onClose: () => void
  onUpdate: (mediaId: number, patch: { status?: AnimeStatus; progress?: number; score?: number }) => Promise<void>
  onRemove: (mediaId: number) => Promise<void>
  onAdd: (media: AnilistMedia, status: AnimeStatus) => Promise<void>
}

const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function DetailsModal({
  entry,
  media,
  loading,
  onClose,
  onUpdate,
  onRemove,
  onAdd,
}: DetailsModalProps) {
  const [status, setStatus] = useState<AnimeStatus | null>(entry?.status ?? null)
  const [progress, setProgress] = useState<number>(entry?.progress ?? 0)
  const [score, setScore] = useState<number>(entry?.score ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    setStatus(entry?.status ?? null)
    setProgress(entry?.progress ?? 0)
    setScore(entry?.score ?? 0)
    setError(null)
    setConfirmRemove(false)
  }, [entry])

  const displayMedia = media ?? entry?.media ?? null
  const title = displayMedia ? pickTitle(displayMedia.title) : ''
  const synopsis = stripHtml(displayMedia?.synopsis ?? null)

  const isTracked = !!entry || !!status

  const saveAll = async (next: { status?: AnimeStatus; progress?: number; score?: number }) => {
    if (!displayMedia) return
    setSaving(true)
    setError(null)
    try {
      await onUpdate(displayMedia.id, next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (next: AnimeStatus) => {
    setStatus(next)
    if (!displayMedia) return
    if (!entry && !isTracked) {
      // adding new entry
      setSaving(true)
      setError(null)
      try {
        await onAdd(displayMedia, next)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add to library.')
      } finally {
        setSaving(false)
      }
      return
    }
    try {
      await saveAll({ status: next, progress, score })
    } catch {
      // error already set
    }
  }

  const handleProgressChange = async (value: number) => {
    setProgress(value)
    if (!entry && !isTracked) return
    try {
      await saveAll({ progress: value, status: status ?? undefined, score })
    } catch {
      // error set
    }
  }

  const handleScoreChange = async (value: number) => {
    setScore(value)
    if (!entry && !isTracked) return
    try {
      await saveAll({ score: value, status: status ?? undefined, progress })
    } catch {
      // error set
    }
  }

  const handleRemove = async () => {
    if (!displayMedia) return
    setSaving(true)
    setError(null)
    try {
      await onRemove(displayMedia.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove from library.')
      setSaving(false)
    }
  }

  const studioNames = useMemo(
    () => displayMedia?.studios?.nodes?.map((s) => s.name).join(', ') ?? null,
    [displayMedia],
  )

  if (!entry && !media && !loading) return null

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-[#20212b]/40 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#5146e5]/40 to-[#22243b] sm:h-48">
          {displayMedia?.bannerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayMedia.bannerImage} alt="" className="size-full object-cover" />
          ) : null}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg bg-black/30 text-white backdrop-blur hover:bg-black/50"
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        <div className="-mt-12 px-5 pb-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="h-[120px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-[#22243b] shadow-lg">
              {displayMedia?.coverImage?.large ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayMedia.coverImage.large}
                  alt={`${title} cover`}
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pt-2">
              {loading ? (
                <div className="h-6 w-2/3 animate-pulse rounded bg-[#eeeef4]" />
              ) : (
                <h2 id="details-title" className="text-xl font-bold leading-7 tracking-[-0.02em]">
                  {title}
                </h2>
              )}
              <p className="mt-1 text-xs text-[#858698]">
                {displayMedia?.format ?? 'TV'}
                {displayMedia?.episodes ? ` · ${displayMedia.episodes} eps` : ''}
                {displayMedia?.seasonYear ? ` · ${displayMedia.season ?? ''} ${displayMedia.seasonYear}`.trim() : ''}
                {displayMedia?.averageScore ? ` · ${displayMedia.averageScore}% avg` : ''}
              </p>
              {studioNames ? (
                <p className="mt-1 text-xs text-[#858698]">Studio: {studioNames}</p>
              ) : null}
            </div>
          </div>

          {displayMedia?.genres && displayMedia.genres.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {displayMedia.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-[#f0f0ff] px-3 py-1 text-[11px] font-semibold text-[#5146e5]"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#a5a6b0]">Synopsis</h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-[#eeeef4]" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-[#eeeef4]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[#eeeef4]" />
              </div>
            ) : synopsis ? (
              <p className="whitespace-pre-line text-sm leading-6 text-[#4d4e5a]">{synopsis}</p>
            ) : (
              <p className="text-sm text-[#91929e]">No synopsis available.</p>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-[#ececf2] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#a5a6b0]">
              Your library
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#7d7e89]">Status</label>
                <select
                  value={status ?? ''}
                  onChange={(e) => void handleStatusChange(e.target.value as AnimeStatus)}
                  disabled={saving}
                  className="h-9 w-full rounded-lg border border-[#e7e8ef] bg-white px-2 text-sm outline-none focus:border-[#5146e5] focus:ring-4 focus:ring-[#5146e5]/10 disabled:opacity-60"
                >
                  <option value="">Not in library</option>
                  {FILTER_LABELS.filter((f) => f.key !== 'ALL').map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#7d7e89]">
                  Episodes watched
                </label>
                <input
                  type="number"
                  min={0}
                  max={displayMedia?.episodes ?? undefined}
                  value={progress}
                  onChange={(e) => void handleProgressChange(Number(e.target.value))}
                  disabled={saving || (!entry && !isTracked)}
                  className="h-9 w-full rounded-lg border border-[#e7e8ef] bg-white px-2 text-sm outline-none focus:border-[#5146e5] focus:ring-4 focus:ring-[#5146e5]/10 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#7d7e89]">Your rating</label>
                <div className="flex items-center gap-2">
                  <Star className="size-4 fill-[#e1a02f] text-[#e1a02f]" />
                  <select
                    value={score}
                    onChange={(e) => void handleScoreChange(Number(e.target.value))}
                    disabled={saving || (!entry && !isTracked)}
                    className="h-9 flex-1 rounded-lg border border-[#e7e8ef] bg-white px-2 text-sm outline-none focus:border-[#5146e5] focus:ring-4 focus:ring-[#5146e5]/10 disabled:opacity-60"
                  >
                    {SCORE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s === 0 ? 'Not rated' : `${s} / 10`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg bg-[#fdeceb] px-3 py-2 text-xs text-[#c0392b]">{error}</p>
            ) : null}

            {entry || isTracked ? (
              <div className="mt-4 flex justify-end">
                {confirmRemove ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7d7e89]">Remove from your library?</span>
                    <button
                      onClick={() => setConfirmRemove(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#7d7e89] hover:bg-[#f5f5f8]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleRemove()}
                      disabled={saving}
                      className="rounded-lg bg-[#ed6a5a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#d8554a] disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    disabled={saving}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#c0392b] hover:bg-[#fdeceb] disabled:opacity-60"
                  >
                    Remove from library
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-[#a1a2ad]">
                Pick a status above to add this anime to your library.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export type { AnimeStatus }
