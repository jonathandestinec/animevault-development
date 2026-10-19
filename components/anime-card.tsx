'use client'

import { MoreHorizontal, Play, Star } from 'lucide-react'
import {
  AnilistListEntry,
  STATUS_LABELS,
  coverGradient,
  entryProgressPercent,
  formatEpisodes,
  pickTitle,
} from '@/lib/anilist'

interface AnimeCardProps {
  entry: AnilistListEntry
  onOpen?: (entry: AnilistListEntry) => void
  onMenu?: (entry: AnilistListEntry) => void
}

export function AnimeCard({ entry, onOpen, onMenu }: AnimeCardProps) {
  const media = entry.media
  const title = pickTitle(media.title)
  const progress = entryProgressPercent(entry)
  const cover = media.coverImage?.large ?? media.coverImage?.extraLarge ?? null
  const gradient = coverGradient(entry)

  return (
    <article
      className="group flex gap-4 rounded-2xl border border-[#ececf2] bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#25255b]/5"
    >
      <button
        onClick={() => onOpen?.(entry)}
        className="relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-xl"
        style={{ background: gradient }}
        aria-label={`View details for ${title}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`${title} cover`}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-white/70">
            <Play className="fill-current" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-1 text-[9px] font-bold text-white">
          {media.format ?? 'TV'}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold leading-5">{title}</h3>
            <p className="mt-1 text-[11px] text-[#999aa5]">{formatEpisodes(entry)}</p>
          </div>
          <button
            aria-label={`More options for ${title}`}
            onClick={() => onMenu?.(entry)}
            className="text-[#aaaab3] transition hover:text-[#5146e5]"
          >
            <MoreHorizontal />
          </button>
        </div>
        <div className="mt-auto">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#8e8f9b]">
            <span>{STATUS_LABELS[entry.status]}</span>
            <span className="flex items-center gap-1 text-[#e1a02f]">
              <Star className="fill-current" />
              {entry.score > 0 ? entry.score.toFixed(1) : '—'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f5]">
            <div
              className="h-full rounded-full bg-[#5146e5] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse rounded-2xl border border-[#ececf2] bg-white p-3.5">
      <div className="h-[132px] w-[92px] shrink-0 rounded-xl bg-[#eeeef4]" />
      <div className="flex flex-1 flex-col py-1">
        <div className="mb-2 h-4 w-3/4 rounded bg-[#eeeef4]" />
        <div className="h-3 w-1/3 rounded bg-[#eeeef4]" />
        <div className="mt-auto h-1.5 w-full rounded-full bg-[#eeeef4]" />
      </div>
    </div>
  )
}
