// AniList API client: OAuth implicit-grant auth + GraphQL helpers.
// Docs: https://docs.anilist.co/

export const ANILIST_AUTH_URL = 'https://anilist.co/api/v2/oauth/authorize'
export const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token'
export const ANILIST_API_URL = 'https://graphql.anilist.co'

export const ANILIST_CLIENT_ID = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID ?? ''
export const ANILIST_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ANILIST_REDIRECT_URI ??
  (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '')

export type AnimeStatus = 'CURRENT' | 'COMPLETED' | 'PLANNING' | 'PAUSED' | 'DROPPED' | 'REPEATING'

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  CURRENT: 'Watching',
  COMPLETED: 'Completed',
  PLANNING: 'Plan to Watch',
  PAUSED: 'Paused',
  DROPPED: 'Dropped',
  REPEATING: 'Rewatching',
}

export const STATUS_ORDER: AnimeStatus[] = ['CURRENT', 'REPEATING', 'COMPLETED', 'PAUSED', 'PLANNING', 'DROPPED']

export const FILTER_LABELS: Array<{ key: 'ALL' | AnimeStatus; label: string }> = [
  { key: 'ALL', label: 'All titles' },
  { key: 'CURRENT', label: 'Watching' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'PLANNING', label: 'Plan to Watch' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'DROPPED', label: 'Dropped' },
]

export interface AnilistUser {
  id: number
  name: string
  avatar: string | null
  bannerImage: string | null
  about: string | null
}

export interface AnilistMedia {
  id: number
  title: { romaji: string | null; english: string | null; native: string | null }
  coverImage: { large: string | null; extraLarge: string | null; color: string | null }
  bannerImage: string | null
  format: string | null
  episodes: number | null
  duration: number | null
  averageScore: number | null
  meanScore: number | null
  genres: string[]
  synopsis: string | null
  status: string | null
  season: string | null
  seasonYear: number | null
  studios?: { nodes: { id: number; name: string; isAnimationStudio: boolean }[] }
}

export interface AnilistListEntry {
  id: number
  status: AnimeStatus
  progress: number
  score: number
  repeat: number
  updatedAt: number
  media: AnilistMedia
}

export interface AnilistList {
  status: AnimeStatus
  entries: AnilistListEntry[]
}

export interface AnilistViewer {
  user: AnilistUser
  lists: AnilistList[]
}

const TOKEN_STORAGE_KEY = 'animevault:anilist_token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: ANILIST_CLIENT_ID,
    redirect_uri: ANILIST_REDIRECT_URI,
    response_type: 'token',
  })
  return `${ANILIST_AUTH_URL}?${params.toString()}`
}

export function signInWithAniList(): void {
  if (typeof window === 'undefined') return
  window.location.assign(buildAuthUrl())
}

export class AnilistError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.status = status
    this.name = 'AnilistError'
  }
}

interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string; status?: number }[]
}

export async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token: string | null = getStoredToken(),
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  if (res.status === 401) {
    throw new AnilistError('Your AniList session has expired. Please sign in again.', 401)
  }
  if (!res.ok) {
    throw new AnilistError(`AniList request failed (${res.status})`, res.status)
  }

  const json = (await res.json()) as GraphQLResponse<T>
  if (json.errors && json.errors.length > 0) {
    const first = json.errors[0]
    const status = first.status ?? 0
    if (status === 401) {
      throw new AnilistError('Your AniList session has expired. Please sign in again.', 401)
    }
    throw new AnilistError(first.message || 'AniList returned an error.', status)
  }
  if (!json.data) {
    throw new AnilistError('AniList returned an unexpected response.', 0)
  }
  return json.data
}

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  format
  episodes
  duration
  averageScore
  meanScore
  genres
  description(asHtml: false)
  status
  season
  seasonYear
  studios(isMain: true) { nodes { id name isAnimationStudio } }
`

const LIST_ENTRY_FIELDS = `
  id
  status
  progress
  score(format: POINT_10)
  repeat
  updatedAt
  media { ${MEDIA_FIELDS} }
`

export async function fetchViewer(token: string): Promise<AnilistViewer> {
  const query = `
    query {
      Viewer {
        id
        name
        avatar { large }
        bannerImage
        about
        mediaListOptions { scoreFormat }
        mediaLists: animeListCollection {
          status
          entries { ${LIST_ENTRY_FIELDS} }
        }
      }
    }
  `
  interface RawUser {
    id: number
    name: string
    avatar: { large: string | null } | null
    bannerImage: string | null
    about: string | null
    mediaLists: { status: AnimeStatus; entries: AnilistListEntry[] }[]
  }
  const data = await anilistFetch<{ Viewer: RawUser }>(query, {}, token)
  const v = data.Viewer
  return {
    user: {
      id: v.id,
      name: v.name,
      avatar: v.avatar?.large ?? null,
      bannerImage: v.bannerImage,
      about: v.about,
    },
    lists: v.mediaLists.map((l) => ({ status: l.status, entries: l.entries })),
  }
}

export async function searchAnime(token: string | null, search: string, perPage = 20, page = 1) {
  const query = `
    query ($search: String, $perPage: Int, $page: Int) {
      Page(search: $search, perPage: $perPage, page: $page) {
        pageInfo { currentPage hasNextPage }
        media(type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
      }
    }
  `
  const data = await anilistFetch<{ Page: { pageInfo: { currentPage: number; hasNextPage: boolean }; media: AnilistMedia[] } }>(
    query,
    { search, perPage, page },
    token,
  )
  return { pageInfo: data.Page.pageInfo, media: data.Page.media }
}

export async function fetchAnimeDetails(id: number, token: string | null): Promise<AnilistMedia> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} }
    }
  `
  const data = await anilistFetch<{ Media: AnilistMedia }>(query, { id }, token)
  return data.Media
}

export async function updateMediaListEntry(
  token: string,
  input: { mediaId: number; status?: AnimeStatus; progress?: number; score?: number; repeat?: number },
): Promise<void> {
  const query = `
    mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float, $repeat: Int) {
      SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress, score: $score, repeat: $repeat) {
        id
      }
    }
  `
  await anilistFetch(query, input, token)
}

export async function deleteMediaListEntry(token: string, mediaId: number): Promise<void> {
  const query = `
    mutation ($mediaId: Int) {
      DeleteMediaListEntry(mediaId: $mediaId) { deleted }
    }
  `
  await anilistFetch(query, { mediaId }, token)
}

export function flattenLists(lists: AnilistList[]): AnilistListEntry[] {
  return lists.flatMap((l) => l.entries)
}

export function countByStatus(lists: AnilistList[]): Record<AnimeStatus, number> {
  const counts: Record<AnimeStatus, number> = {
    CURRENT: 0,
    COMPLETED: 0,
    PLANNING: 0,
    PAUSED: 0,
    DROPPED: 0,
    REPEATING: 0,
  }
  for (const l of lists) {
    counts[l.status] = (counts[l.status] ?? 0) + l.entries.length
  }
  return counts
}

export function totalEpisodesWatched(lists: AnilistList[]): number {
  let total = 0
  for (const l of lists) {
    for (const e of l.entries) {
      const eps = e.media.episodes ?? 0
      if (l.status === 'COMPLETED' || l.status === 'REPEATING') {
        total += (eps || e.progress) + e.repeat * (eps || e.progress)
      } else {
        total += e.progress
      }
    }
  }
  return total
}

export function totalHoursWatched(lists: AnilistList[]): number {
  let minutes = 0
  for (const l of lists) {
    for (const e of l.entries) {
      const epMinutes = e.media.duration ?? 24
      const eps = e.media.episodes ?? 0
      if (l.status === 'COMPLETED' || l.status === 'REPEATING') {
        minutes += (eps || e.progress) * epMinutes + e.repeat * (eps || e.progress) * epMinutes
      } else {
        minutes += e.progress * epMinutes
      }
    }
  }
  return Math.round(minutes / 60)
}

export function recentlyUpdated(lists: AnilistList[], limit = 6): AnilistListEntry[] {
  return flattenLists(lists)
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}

export function pickTitle(t: AnilistMedia['title']): string {
  return t.english || t.romaji || t.native || 'Untitled'
}

export function formatEpisodes(entry: AnilistListEntry): string {
  const total = entry.media.episodes
  if (entry.status === 'COMPLETED') return 'Complete'
  if (total && entry.progress >= total) return 'Complete'
  if (total) return `${entry.progress} / ${total} eps`
  return `${entry.progress} eps`
}

export function entryProgressPercent(entry: AnilistListEntry): number {
  const total = entry.media.episodes
  if (entry.status === 'COMPLETED') return 100
  if (!total) return 0
  return Math.min(100, Math.round((entry.progress / total) * 100))
}

export function coverGradient(entry: AnilistListEntry): string {
  const color = entry.media.coverImage?.color || '#5146e5'
  return `linear-gradient(135deg, ${color}55, #22243b)`
}

export function stripHtml(s: string | null): string | null {
  if (!s) return null
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
}
