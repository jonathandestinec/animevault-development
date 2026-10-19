'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnilistError,
  AnilistList,
  AnilistListEntry,
  AnilistMedia,
  AnilistViewer,
  AnimeStatus,
  deleteMediaListEntry,
  fetchAnimeDetails,
  fetchViewer,
  searchAnime,
  updateMediaListEntry,
} from '@/lib/anilist'

export interface ViewerState {
  data: AnilistViewer | null
  loading: boolean
  error: string | null
}

export function useAnilistViewer(token: string | null, onAuthError?: () => void) {
  const [state, setState] = useState<ViewerState>({ data: null, loading: false, error: null })
  const onAuthErrorRef = useRef(onAuthError)
  onAuthErrorRef.current = onAuthError

  const load = useCallback(async () => {
    if (!token) {
      setState({ data: null, loading: false, error: null })
      return
    }
    setState({ data: null, loading: true, error: null })
    try {
      const viewer = await fetchViewer(token)
      setState({ data: viewer, loading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load your AniList data.'
      setState({ data: null, loading: false, error: message })
      if (err instanceof AnilistError && err.status === 401) {
        onAuthErrorRef.current?.()
      }
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const updateEntry = useCallback(
    async (
      mediaId: number,
      patch: { status?: AnimeStatus; progress?: number; score?: number; repeat?: number },
    ): Promise<void> => {
      if (!token) throw new Error('Not signed in.')
      // Optimistic update
      setState((prev) => {
        if (!prev.data) return prev
        const lists = prev.data.lists.map((l) => {
          if (l.status !== patch.status && patch.status) {
            // remove from old list when moving between statuses
            return { ...l, entries: l.entries.filter((e) => e.media.id !== mediaId) }
          }
          return {
            ...l,
            entries: l.entries.map((e) =>
              e.media.id === mediaId
                ? {
                    ...e,
                    status: patch.status ?? e.status,
                    progress: patch.progress ?? e.progress,
                    score: patch.score ?? e.score,
                    repeat: patch.repeat ?? e.repeat,
                    updatedAt: Math.floor(Date.now() / 1000),
                  }
                : e,
            ),
          }
        })
        // If the entry moved to a new status, insert it there
        if (patch.status) {
          const target = lists.find((l) => l.status === patch.status)
          const existsAnywhere = prev.data!.lists.some((l) => l.entries.some((e) => e.media.id === mediaId))
          if (target && !target.entries.some((e) => e.media.id === mediaId) && existsAnywhere) {
            const original = prev.data!.lists.flatMap((l) => l.entries).find((e) => e.media.id === mediaId)
            if (original) {
              target.entries = [
                ...target.entries,
                {
                  ...original,
                  status: patch.status,
                  progress: patch.progress ?? original.progress,
                  score: patch.score ?? original.score,
                  repeat: patch.repeat ?? original.repeat,
                  updatedAt: Math.floor(Date.now() / 1000),
                },
              ]
            }
          }
        }
        return { ...prev, data: { ...prev.data!, lists } }
      })

      try {
        await updateMediaListEntry(token, { mediaId, ...patch })
      } catch (err) {
        // Revert on failure
        void load()
        throw err
      }
    },
    [token, load],
  )

  const removeEntry = useCallback(
    async (mediaId: number): Promise<void> => {
      if (!token) throw new Error('Not signed in.')
      setState((prev) => {
        if (!prev.data) return prev
        return {
          ...prev,
          data: {
            ...prev.data,
            lists: prev.data.lists.map((l) => ({
              ...l,
              entries: l.entries.filter((e) => e.media.id !== mediaId),
            })),
          },
        }
      })
      try {
        await deleteMediaListEntry(token, mediaId)
      } catch (err) {
        void load()
        throw err
      }
    },
    [token, load],
  )

  const addEntry = useCallback(
    async (media: AnilistMedia, status: AnimeStatus): Promise<void> => {
      if (!token) throw new Error('Not signed in.')
      const newEntry: AnilistListEntry = {
        id: -Date.now(),
        status,
        progress: 0,
        score: 0,
        repeat: 0,
        updatedAt: Math.floor(Date.now() / 1000),
        media,
      }
      setState((prev) => {
        if (!prev.data) return prev
        const lists = prev.data.lists.slice()
        let target = lists.find((l) => l.status === status)
        if (!target) {
          target = { status, entries: [] }
          lists.push(target)
        }
        if (!target.entries.some((e) => e.media.id === media.id)) {
          target.entries = [...target.entries, newEntry]
        }
        return { ...prev, data: { ...prev.data, lists } }
      })
      try {
        await updateMediaListEntry(token, { mediaId: media.id, status })
      } catch (err) {
        void load()
        throw err
      }
    },
    [token, load],
  )

  return { ...state, reload: load, updateEntry, removeEntry, addEntry }
}

export function useAnilistSearch(token: string | null) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AnilistMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqId = useRef(0)

  const run = useCallback(
    async (q: string) => {
      setQuery(q)
      if (!q.trim()) {
        setResults([])
        setError(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      const id = ++reqId.current
      try {
        const { media } = await searchAnime(token, q.trim(), 24, 1)
        if (id === reqId.current) {
          setResults(media)
          setLoading(false)
        }
      } catch (err) {
        if (id === reqId.current) {
          setError(err instanceof Error ? err.message : 'Search failed.')
          setLoading(false)
        }
      }
    },
    [token],
  )

  const clear = useCallback(() => {
    reqId.current++
    setQuery('')
    setResults([])
    setError(null)
    setLoading(false)
  }, [])

  return { query, results, loading, error, run, clear }
}

export function useAnilistDetails(token: string | null, id: number | null) {
  const [data, setData] = useState<AnilistMedia | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id == null) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    fetchAnimeDetails(id, token)
      .then((media) => {
        if (active) {
          setData(media)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load details.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [token, id])

  return { data, loading, error }
}

export type { AnilistList, AnilistListEntry, AnilistMedia, AnilistViewer, AnimeStatus }
