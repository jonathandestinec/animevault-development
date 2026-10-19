'use client'

import { useMemo, useState } from 'react'
import { Bell, BookOpen, Check, ChevronDown, Clock3, Compass, Heart, Hop as Home, Library, LogOut, Menu, Play, Plus, Search, Settings, TrendingUp, UserRound, X } from 'lucide-react'
import {
  AnilistListEntry,
  AnilistMedia,
  AnimeStatus,
  FILTER_LABELS,
  countByStatus,
  flattenLists,
  pickTitle,
  recentlyUpdated,
  totalHoursWatched,
} from '@/lib/anilist'
import { useAnilistAuth } from '@/hooks/use-anilist-auth'
import { useAnilistDetails, useAnilistViewer } from '@/hooks/use-anilist-data'
import { AnimeCard, AnimeCardSkeleton } from '@/components/anime-card'
import { DetailsModal } from '@/components/details-modal'
import { LoginScreen } from '@/components/login-screen'
import { SearchModal } from '@/components/search-modal'

const navItems = [
  { label: 'Overview', icon: Home },
  { label: 'My Library', icon: Library },
  { label: 'Discover', icon: Compass },
  { label: 'Favorites', icon: Heart },
]

function greetingForUser(name: string): { time: string; line: string } {
  const hour = new Date().getHours()
  if (hour < 5) return { time: 'Late night', line: `Burning the midnight oil, ${name}` }
  if (hour < 12) return { time: 'Good morning', line: `Good morning, ${name}` }
  if (hour < 18) return { time: 'Good afternoon', line: `Good afternoon, ${name}` }
  return { time: 'Good evening', line: `Good evening, ${name}` }
}

export default function Page() {
  const { token, ready, signedIn, signOut } = useAnilistAuth()
  const { data, loading, error, reload, updateEntry, removeEntry, addEntry } = useAnilistViewer(token, signOut)

  const [activeNav, setActiveNav] = useState('Overview')
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_LABELS)[number]['key']>('ALL')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AnilistListEntry | null>(null)
  const [detailsId, setDetailsId] = useState<number | null>(null)

  // When the user clicks a search result or a non-tracked anime, we open the
  // details modal with just the media id. For tracked entries we have the full
  // entry already.
  const effectiveDetailsId = detailsId ?? selectedEntry?.media.id ?? null
  const { data: detailsMedia, loading: detailsLoading } = useAnilistDetails(token, effectiveDetailsId)

  // Loading + unauthenticated states
  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fb] text-[#20212b]">
        <div className="size-10 animate-spin rounded-full border-2 border-[#e7e8ef] border-t-[#5146e5]" />
      </main>
    )
  }
  if (!signedIn) return <LoginScreen />

  const user = data?.user
  const lists = data?.lists ?? []
  const allEntries = flattenLists(lists)
  const counts = countByStatus(lists)
  const hours = totalHoursWatched(lists)
  const continueWatching = (lists.find((l) => l.status === 'CURRENT')?.entries ?? [])
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const recent = recentlyUpdated(lists, 6)
  const trackedIds = new Set(allEntries.map((e) => e.media.id))

  const visibleTitles = useMemo(() => {
    return allEntries
      .filter((entry) => {
        const title = pickTitle(entry.media.title).toLowerCase()
        const matchesSearch = title.includes(query.toLowerCase())
        const matchesFilter = activeFilter === 'ALL' || entry.status === activeFilter
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [allEntries, activeFilter, query])

  const greeting = user ? greetingForUser(user.name) : { time: 'Welcome', line: 'Welcome back' }
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const initials = (user?.name ?? 'AV')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'AV'

  const openEntry = (entry: AnilistListEntry) => {
    setSelectedEntry(entry)
    setDetailsId(null)
  }
  const openMedia = (media: AnilistMedia) => {
    setSelectedEntry(null)
    setDetailsId(media.id)
  }

  const handleUpdate = async (mediaId: number, patch: { status?: AnimeStatus; progress?: number; score?: number }) => {
    await updateEntry(mediaId, patch)
    // Sync the open modal's entry if it matches
    setSelectedEntry((prev) => {
      if (!prev || prev.media.id !== mediaId) return prev
      return {
        ...prev,
        status: patch.status ?? prev.status,
        progress: patch.progress ?? prev.progress,
        score: patch.score ?? prev.score,
      }
    })
  }

  const handleAddFromDetails = async (media: AnilistMedia, status: AnimeStatus) => {
    await addEntry(media, status)
    setSelectedEntry({
      id: -Date.now(),
      status,
      progress: 0,
      score: 0,
      repeat: 0,
      updatedAt: Math.floor(Date.now() / 1000),
      media,
    })
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#20212b]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Sidebar - desktop */}
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e7e8ef] bg-white px-6 py-7 lg:flex">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-xl bg-[#5146e5] text-white shadow-lg shadow-indigo-200">
              <Play className="fill-current" />
            </div>
            <span className="text-[20px] font-bold tracking-[-0.03em]">AnimeVault</span>
          </div>
          <nav className="flex flex-col gap-2" aria-label="Primary navigation">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a5a6b0]">Menu</p>
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActiveNav(label)
                  if (label === 'Discover') setSearchOpen(true)
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  activeNav === label ? 'bg-[#eeedff] text-[#5146e5]' : 'text-[#7d7e89] hover:bg-[#f7f7fa] hover:text-[#343541]'
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col gap-2" aria-label="Account navigation">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a5a6b0]">Account</p>
            <button className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d7e89] hover:bg-[#f7f7fa]">
              <Settings />
              Settings
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d7e89] hover:bg-[#f7f7fa]"
            >
              <LogOut />
              Sign out
            </button>
          </nav>
          <div className="mt-8 rounded-2xl bg-[#f5f5ff] p-4">
            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white text-[#5146e5]">
              <TrendingUp />
            </div>
            <p className="text-xs font-bold text-[#343541]">Keep your streak alive</p>
            <p className="mt-1 text-[11px] leading-4 text-[#858698]">
              You&apos;ve watched {hours} hours of anime so far.
            </p>
          </div>
        </aside>

        {/* Sidebar - mobile drawer */}
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-[#20212b]/40" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[260px] flex-col bg-white px-6 py-7">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-[#5146e5] text-white">
                    <Play className="fill-current" />
                  </div>
                  <span className="text-[18px] font-bold tracking-[-0.03em]">AnimeVault</span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="grid size-8 place-items-center rounded-lg text-[#7d7e89] hover:bg-[#f5f5f8]"
                  aria-label="Close menu"
                >
                  <X />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setActiveNav(label)
                      setMobileNavOpen(false)
                      if (label === 'Discover') setSearchOpen(true)
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                      activeNav === label ? 'bg-[#eeedff] text-[#5146e5]' : 'text-[#7d7e89] hover:bg-[#f7f7fa]'
                    }`}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </nav>
              <nav className="mt-auto flex flex-col gap-2">
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d7e89] hover:bg-[#f7f7fa]"
                >
                  <LogOut />
                  Sign out
                </button>
              </nav>
            </aside>
          </div>
        ) : null}

        <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-9">
          <header className="mb-9 flex items-center justify-between gap-4">
            <button
              className="grid size-10 place-items-center rounded-xl border border-[#e7e8ef] bg-white lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </button>
            <div className="relative max-w-[390px] flex-1 lg:max-w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a2a3ad]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your library"
                className="h-11 w-full rounded-xl border border-[#e7e8ef] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#b0b1bb] focus:border-[#5146e5] focus:ring-4 focus:ring-[#5146e5]/10"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-5">
              <button
                onClick={() => setSearchOpen(true)}
                className="relative grid size-10 place-items-center rounded-xl text-[#747583] hover:bg-white"
                aria-label="Search AniList"
                title="Search AniList"
              >
                <Compass />
              </button>
              <button
                className="relative grid size-10 place-items-center rounded-xl text-[#747583] hover:bg-white"
                aria-label="Notifications"
              >
                <Bell />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#ed6a5a]" />
              </button>
              <div className="hidden h-8 w-px bg-[#e7e8ef] sm:block" />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white"
              >
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-9 place-items-center rounded-full bg-[#f4c7a1] text-sm font-bold text-[#794529]">
                    {initials}
                  </div>
                )}
                <span className="hidden text-sm font-bold sm:block">{user?.name ?? 'User'}</span>
                <ChevronDown className="text-[#a2a3ad]" />
              </button>
              {menuOpen ? (
                <div className="absolute right-8 top-20 z-20 w-44 rounded-xl border border-[#e7e8ef] bg-white p-2 shadow-xl">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#91929e]">
                    <UserRound className="size-4" />
                    Signed in via AniList
                  </div>
                  <div className="my-1 h-px bg-[#f0f0f5]" />
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      signOut()
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#c0392b] hover:bg-[#fdeceb]"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {error ? (
            <div className="mb-8 rounded-2xl border border-[#f3c2bd] bg-[#fdeceb] p-5">
              <p className="text-sm font-bold text-[#c0392b]">Couldn&apos;t load your AniList data</p>
              <p className="mt-1 text-sm text-[#a8443c]">{error}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => void reload()}
                  className="rounded-lg bg-[#c0392b] px-4 py-2 text-sm font-bold text-white hover:bg-[#a8302a]"
                >
                  Try again
                </button>
                <button
                  onClick={signOut}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#7d7e89] hover:bg-[#f5f5f8]"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : null}

          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-[#858698]">{today}</p>
              <h1 className="text-[32px] font-bold tracking-[-0.045em] sm:text-[38px]">
                {greeting.line} <span className="text-[#5146e5]">.</span>
              </h1>
              <p className="mt-2 text-sm text-[#858698]">Here&apos;s what&apos;s happening in your vault.</p>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5146e5] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4238cf]"
            >
              <Plus />
              Discover anime
            </button>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={<Play />}
              label="Watching"
              value={loading ? '—' : String(counts.CURRENT + counts.REPEATING)}
              note={continueWatching.length > 0 ? `${continueWatching.length} in progress` : 'Nothing yet'}
              color="text-[#5146e5]"
            />
            <Stat
              icon={<Check />}
              label="Completed"
              value={loading ? '—' : String(counts.COMPLETED)}
              note={counts.COMPLETED > 0 ? 'Finished series' : 'Nothing yet'}
              color="text-[#36a776]"
            />
            <Stat
              icon={<BookOpen />}
              label="Plan to watch"
              value={loading ? '—' : String(counts.PLANNING)}
              note={counts.PLANNING > 0 ? 'On your backlog' : 'Backlog empty'}
              color="text-[#e1a02f]"
            />
            <Stat
              icon={<Clock3 />}
              label="Hours watched"
              value={loading ? '—' : String(hours)}
              note={hours > 0 ? 'Across all anime' : 'No watch time yet'}
              color="text-[#e06b5d]"
            />
          </div>

          {/* Continue watching */}
          <section className="mb-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-[-0.025em]">Continue watching</h2>
                <p className="mt-1 text-xs text-[#91929e]">Pick up where you left off</p>
              </div>
            </div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <AnimeCardSkeleton key={i} />
                ))}
              </div>
            ) : continueWatching.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dcdde6] bg-white p-10 text-center text-sm text-[#90919e]">
                You&apos;re not currently watching anything. Hit Discover anime to start a new series.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {continueWatching.slice(0, 3).map((entry) => (
                  <AnimeCard key={entry.media.id} entry={entry} onOpen={openEntry} onMenu={openEntry} />
                ))}
              </div>
            )}
          </section>

          {/* Recently updated */}
          {!loading && recent.length > 0 ? (
            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.025em]">Recently in your vault</h2>
                  <p className="mt-1 text-xs text-[#91929e]">Your latest activity</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recent
                  .filter((e) => !continueWatching.slice(0, 3).some((c) => c.media.id === e.media.id))
                  .slice(0, 3)
                  .map((entry) => (
                    <AnimeCard key={entry.media.id} entry={entry} onOpen={openEntry} onMenu={openEntry} />
                  ))}
              </div>
            </section>
          ) : null}

          {/* Library */}
          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold tracking-[-0.025em]">Your library</h2>
                <p className="mt-1 text-xs text-[#91929e]">
                  {loading ? 'Loading your collection…' : `${visibleTitles.length} titles in this view`}
                </p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {FILTER_LABELS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${
                      activeFilter === filter.key ? 'bg-[#20212b] text-white' : 'bg-white text-[#888995] hover:text-[#20212b]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <AnimeCardSkeleton key={i} />
                ))}
              </div>
            ) : visibleTitles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dcdde6] bg-white p-10 text-center text-sm text-[#90919e]">
                {allEntries.length === 0
                  ? 'Your library is empty. Use Discover anime to find and add your first series.'
                  : 'No titles match this filter or search.'}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleTitles.map((entry) => (
                  <AnimeCard key={entry.media.id} entry={entry} onOpen={openEntry} onMenu={openEntry} />
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      {/* Details modal */}
      <DetailsModal
        entry={selectedEntry}
        media={detailsMedia}
        loading={detailsLoading}
        onClose={() => {
          setSelectedEntry(null)
          setDetailsId(null)
        }}
        onUpdate={handleUpdate}
        onRemove={removeEntry}
        onAdd={handleAddFromDetails}
      />

      {/* Search modal */}
      <SearchModal
        token={token}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={addEntry}
        trackedIds={trackedIds}
      />
    </main>
  )
}

function Stat({
  icon,
  label,
  value,
  note,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-[#ececf2] bg-white p-5">
      <div className={`mb-5 grid size-9 place-items-center rounded-xl bg-[#f7f7fb] ${color}`}>{icon}</div>
      <p className="text-xs font-semibold text-[#92939f]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tracking-[-0.04em]">{value}</p>
        <p className="text-[10px] font-bold text-[#42a578]">{note}</p>
      </div>
    </div>
  )
}
