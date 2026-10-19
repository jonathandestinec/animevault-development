'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Film,
  Flame,
  Heart,
  Home,
  Library,
  ListFilter,
  LogOut,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings,
  Star,
  TrendingUp,
  Tv,
  UserRound,
  X,
} from 'lucide-react'

const titles = [
  { title: 'Solo Leveling', type: 'TV', episodes: '10 / 12 eps', score: '9.2', status: 'Watching', image: 'https://cdn.myanimelist.net/images/anime/1707/138033l.jpg', color: 'from-orange-500/50' },
  { title: 'Frieren: Beyond Journey\'s End', type: 'TV', episodes: '25 / 28 eps', score: '9.4', status: 'Watching', image: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg', color: 'from-blue-500/50' },
  { title: 'The Apothecary Diaries', type: 'TV', episodes: '18 / 24 eps', score: '8.9', status: 'Watching', image: 'https://cdn.myanimelist.net/images/anime/1708/138033l.jpg', color: 'from-rose-500/50' },
  { title: 'Jujutsu Kaisen 0', type: 'Movie', episodes: 'Complete', score: '8.7', status: 'Completed', image: 'https://cdn.myanimelist.net/images/anime/1121/117044l.jpg', color: 'from-violet-500/50' },
  { title: 'Demon Slayer: Mugen Train', type: 'Movie', episodes: 'Complete', score: '8.6', status: 'Completed', image: 'https://cdn.myanimelist.net/images/anime/1704/106947l.jpg', color: 'from-red-500/50' },
  { title: 'A Silent Voice', type: 'Movie', episodes: 'Complete', score: '9.0', status: 'Completed', image: 'https://cdn.myanimelist.net/images/anime/1122/96435l.jpg', color: 'from-cyan-500/50' },
]

const navItems = [
  { label: 'Overview', icon: Home },
  { label: 'My Library', icon: Library },
  { label: 'Discover', icon: Compass },
  { label: 'Favorites', icon: Heart },
]

export default function Page() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [activeFilter, setActiveFilter] = useState('All titles')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [connectedName, setConnectedName] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/anilist/me').then((response) => response.json()).then((data) => {
      if (data.connected) setConnectedName(data.user?.name ?? 'AniList')
    }).catch(() => undefined)
  }, [])

  async function searchAniList() {
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const response = await fetch(`/api/anilist/search?q=${encodeURIComponent(query.trim())}`)
      const data = await response.json()
      setSearchResults(data.media ?? [])
    } finally { setSearching(false) }
  }

  const visibleTitles = useMemo(() => titles.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = activeFilter === 'All titles' || item.status === activeFilter
    return matchesSearch && matchesFilter
  }), [activeFilter, query])

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#20212b]">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e7e8ef] bg-white px-6 py-7 lg:flex">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-xl bg-[#5146e5] text-white shadow-lg shadow-indigo-200"><Play className="fill-current" data-icon="inline-start" /></div>
            <span className="text-[20px] font-bold tracking-[-0.03em]">AnimeVault</span>
          </div>
          <nav className="flex flex-col gap-2" aria-label="Primary navigation">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a5a6b0]">Menu</p>
            {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveNav(label)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeNav === label ? 'bg-[#eeedff] text-[#5146e5]' : 'text-[#7d7e89] hover:bg-[#f7f7fa] hover:text-[#343541]'}`}><Icon data-icon="inline-start" />{label}</button>)}
          </nav>
          <nav className="mt-auto flex flex-col gap-2" aria-label="Account navigation">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a5a6b0]">Account</p>
            <button className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d7e89] hover:bg-[#f7f7fa]"><Settings data-icon="inline-start" />Settings</button>
            <button className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7d7e89] hover:bg-[#f7f7fa]"><LogOut data-icon="inline-start" />Sign out</button>
          </nav>
          <div className="mt-8 rounded-2xl bg-[#f5f5ff] p-4">
            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white text-[#5146e5]"><TrendingUp data-icon="inline-start" /></div>
            <p className="text-xs font-bold text-[#343541]">Keep your streak alive</p>
            <p className="mt-1 text-[11px] leading-4 text-[#858698]">Watch one more episode today.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-9">
          <header className="mb-9 flex items-center justify-between gap-4">
            <button className="grid size-10 place-items-center rounded-xl border border-[#e7e8ef] bg-white lg:hidden" aria-label="Open menu"><Menu data-icon="inline-start" /></button>
            <div className="relative max-w-[390px] flex-1 lg:max-w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a2a3ad]" data-icon="inline-start" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) searchAniList() }} placeholder="Search your library or AniList" className="h-11 w-full rounded-xl border border-[#e7e8ef] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#b0b1bb] focus:border-[#5146e5] focus:ring-4 focus:ring-[#5146e5]/10" />
            </div>
            <div className="flex items-center gap-2 sm:gap-5">
              <button className="relative grid size-10 place-items-center rounded-xl text-[#747583] hover:bg-white" aria-label="Notifications"><Bell data-icon="inline-start" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#ed6a5a]" /></button>
              <div className="hidden h-8 w-px bg-[#e7e8ef] sm:block" />
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white">
                <div className="grid size-9 place-items-center rounded-full bg-[#f4c7a1] text-sm font-bold text-[#794529]">JD</div><span className="hidden text-sm font-bold sm:block">Jamie Doe</span><ChevronDown className="text-[#a2a3ad]" data-icon="inline-start" />
              </button>
              {menuOpen && <div className="absolute right-8 top-20 z-10 w-40 rounded-xl border border-[#e7e8ef] bg-white p-2 shadow-xl"><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6fa]">Profile</button><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6fa]">Sign out</button></div>}
            </div>
          </header>

          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="mb-2 text-sm font-medium text-[#858698]">Tuesday, October 22, 2024</p><h1 className="text-[32px] font-bold tracking-[-0.045em] sm:text-[38px]">Good evening, Jamie <span className="text-[#5146e5]">.</span></h1><p className="mt-2 text-sm text-[#858698]">{connectedName ? `Synced with ${connectedName}. Here&apos;s what&apos;s happening in your vault.` : "Connect AniList to import your library, favorites, and progress."}</p></div>
            <button onClick={() => setSyncOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5146e5] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4238cf]"><Tv data-icon="inline-start" />Sync library</button>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={<Play />} label="Watching" value="12" note="+2 this week" color="text-[#5146e5]" />
            <Stat icon={<Check />} label="Completed" value="48" note="+5 this month" color="text-[#36a776]" />
            <Stat icon={<BookOpen />} label="Plan to watch" value="26" note="8 added recently" color="text-[#e1a02f]" />
            <Stat icon={<Clock3 />} label="Hours watched" value="312" note="Top 8% this month" color="text-[#e06b5d]" />
          </div>

          <section className="mb-10">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold tracking-[-0.025em]">Continue watching</h2><p className="mt-1 text-xs text-[#91929e]">Pick up where you left off</p></div><button className="flex items-center gap-1 text-sm font-bold text-[#5146e5] hover:underline">View all <ChevronRight data-icon="inline-end" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{titles.slice(0, 3).map((item) => <AnimeCard key={item.title} item={item} />)}</div>
          </section>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h2 className="text-xl font-bold tracking-[-0.025em]">Your library</h2><p className="mt-1 text-xs text-[#91929e]">{visibleTitles.length} titles in your collection</p></div><div className="flex items-center gap-2 overflow-x-auto pb-1">{['All titles', 'Watching', 'Completed', 'Plan to Watch'].map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${activeFilter === filter ? 'bg-[#20212b] text-white' : 'bg-white text-[#888995] hover:text-[#20212b]'}`}>{filter}</button>)}</div></div>
            {searchResults.length > 0 && <div className="mb-5 rounded-2xl border border-[#ececf2] bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">AniList results</h3><span className="text-xs text-[#91929e]">{searching ? 'Searching…' : `${searchResults.length} matches`}</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{searchResults.slice(0, 6).map((item) => <div key={item.id} className="flex gap-3 rounded-xl bg-[#f8f8fb] p-2"><img src={item.coverImage?.large} alt={`${item.title?.english ?? item.title?.romaji} cover`} className="size-16 rounded-lg object-cover" /><div className="min-w-0"><p className="line-clamp-2 text-xs font-bold">{item.title?.english ?? item.title?.romaji}</p><p className="mt-1 text-[10px] text-[#91929e]">{item.episodes ?? '?'} episodes · {item.status?.replaceAll('_', ' ')?.toLowerCase()}</p><p className="mt-1 text-[10px] text-[#e1a02f]">★ {item.averageScore ? (item.averageScore / 10).toFixed(1) : '—'}</p></div></div>)}</div></div>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleTitles.slice(3).map((item) => <AnimeCard key={item.title} item={item} compact />)}</div>
            {visibleTitles.length <= 3 && <div className="rounded-2xl border border-dashed border-[#dcdde6] bg-white p-10 text-center text-sm text-[#90919e]">No more titles in this filter.</div>}
          </section>
        </section>
      </div>
      {syncOpen && <div className="fixed inset-0 z-20 grid place-items-center bg-[#20212b]/30 p-5" role="dialog" aria-modal="true" aria-labelledby="sync-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 id="sync-title" className="text-xl font-bold">Connect an account</h2><p className="mt-1 text-sm text-[#858698]">Import your library and keep it in sync.</p></div><button onClick={() => setSyncOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-[#f5f5f8]" aria-label="Close"><X data-icon="inline-start" /></button></div><div className="flex flex-col gap-3"><button onClick={() => { window.location.href = '/api/anilist/connect' }} className="flex items-center justify-between rounded-xl border border-[#e7e8ef] p-4 text-left hover:border-[#5146e5]"><span><span className="block font-bold">AniList</span><span className="text-xs text-[#91929e]">Connect and sync your library</span></span><ChevronRight data-icon="inline-end" /></button></div><p className="mt-5 text-center text-xs text-[#a1a2ad]">Your AniList library, favorites, and progress will stay in sync.</p></div></div>}
    </main>
  )
}

function Stat({ icon, label, value, note, color }: { icon: React.ReactNode; label: string; value: string; note: string; color: string }) {
  return <div className="rounded-2xl border border-[#ececf2] bg-white p-5"><div className={`mb-5 grid size-9 place-items-center rounded-xl bg-[#f7f7fb] ${color}`}>{icon}</div><p className="text-xs font-semibold text-[#92939f]">{label}</p><div className="mt-1 flex items-end justify-between gap-2"><p className="text-2xl font-bold tracking-[-0.04em]">{value}</p><p className="text-[10px] font-bold text-[#42a578]">{note}</p></div></div>
}

function AnimeCard({ item, compact = false }: { item: typeof titles[number]; compact?: boolean }) {
  const progress = item.episodes === 'Complete' ? 100 : Number(item.episodes.split(' / ')[0]) / Number(item.episodes.split(' / ')[1]) * 100
  return <article className="group flex gap-4 rounded-2xl border border-[#ececf2] bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#25255b]/5"><div className={`relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${item.color} to-[#22243b]`}><img src={item.image} alt={`${item.title} cover`} className="size-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-1 text-[9px] font-bold text-white">{item.type}</span></div><div className="flex min-w-0 flex-1 flex-col py-1"><div className="mb-2 flex items-start justify-between gap-2"><div><h3 className="line-clamp-2 text-sm font-bold leading-5">{item.title}</h3><p className="mt-1 text-[11px] text-[#999aa5]">{item.episodes}</p></div><button aria-label={`More options for ${item.title}`} className="text-[#aaaab3] hover:text-[#5146e5]"><MoreHorizontal data-icon="inline-start" /></button></div><div className="mt-auto"><div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#8e8f9b]"><span>{item.status}</span><span className="flex items-center gap-1 text-[#e1a02f]"><Star className="fill-current" data-icon="inline-start" />{item.score}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f5]"><div className="h-full rounded-full bg-[#5146e5]" style={{ width: `${progress}%` }} /></div></div></div></article>
}
