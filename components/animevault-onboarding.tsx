'use client'

import { useState } from 'react'
import { ArrowRight, BookOpen, Check, Play, Sparkles, Tv } from 'lucide-react'

const steps = [
  { eyebrow: 'A calmer way to track', title: 'Your anime, finally in one place.', body: 'AnimeVault keeps your AniList library, progress, and ratings together without the clutter.', icon: BookOpen, accent: 'from-violet-400 to-fuchsia-400' },
  { eyebrow: 'Stay in sync', title: 'Connect AniList in one click.', body: 'Your AniList account is the source of truth. We never invent titles or progress, and your library stays yours.', icon: Tv, accent: 'from-cyan-300 to-violet-400' },
  { eyebrow: 'Make it yours', title: 'Pick up exactly where you left off.', body: 'See your real watch history, rate what you are watching, and discover your next favorite.', icon: Sparkles, accent: 'from-amber-300 to-pink-400' },
]

export function AnimeVaultOnboarding() {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const Icon = current.icon

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0b1b] text-white selection:bg-violet-400/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,92,255,.22),transparent_32%),radial-gradient(circle_at_88%_80%,rgba(239,92,190,.13),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-[0_0_30px_rgba(124,92,255,.25)]"><Play className="size-4 fill-current text-violet-200" /></div><span className="text-[17px] font-semibold tracking-[-.03em]">AnimeVault</span></div>
          <span className="hidden rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[11px] font-medium text-white/45 sm:block">Powered by AniList</span>
        </header>

        <section className="flex flex-1 items-center py-10 sm:py-14">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_.82fr] lg:gap-20">
            <div key={`copy-${step}`} className="animate-in fade-in slide-in-from-left-3 duration-500">
              <div className="mb-6 flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${current.accent} text-[#171127]`}><Icon className="size-5" /></span><p className="text-[11px] font-bold uppercase tracking-[.2em] text-violet-200/75">{current.eyebrow}</p></div>
              <h1 className="max-w-2xl text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[.95] tracking-[-.075em]">{current.title}</h1>
              <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/55 sm:text-[17px]">{current.body}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3"><button onClick={() => step < steps.length - 1 ? setStep(step + 1) : window.location.assign('/api/anilist/connect')} className="group inline-flex h-12 items-center gap-3 rounded-xl bg-white px-5 text-sm font-bold text-[#171127] transition hover:bg-violet-100">{step === steps.length - 1 ? 'Connect AniList' : 'Continue'}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></button>{step > 0 && <button onClick={() => setStep(step - 1)} className="h-12 rounded-xl px-4 text-sm font-semibold text-white/45 transition hover:text-white">Back</button>}</div>
              <div className="mt-9 flex items-center gap-2" aria-label={`Onboarding step ${step + 1} of ${steps.length}`}>{steps.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all duration-500 ${index === step ? 'w-9 bg-violet-300' : 'w-1.5 bg-white/25'}`} />)}<span className="ml-2 text-xs font-medium text-white/35">0{step + 1} / 0{steps.length}</span></div>
            </div>

            <div className="relative mx-auto w-full max-w-[430px] lg:mx-0 lg:justify-self-end" aria-hidden="true">
              <div className="absolute -inset-8 rounded-[3rem] bg-violet-500/10 blur-3xl" />
              <div key={`visual-${step}`} className="animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.07] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#19142b] p-5 sm:p-7">
                  <div className={`absolute -right-16 -top-20 size-56 rounded-full bg-gradient-to-br ${current.accent} opacity-20 blur-3xl`} />
                  <div className="relative flex items-center justify-between"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-rose-300" /><span className="size-2 rounded-full bg-amber-300" /><span className="size-2 rounded-full bg-emerald-300" /></div><span className="text-[10px] font-semibold tracking-[.16em] text-white/30">ANIMEVAULT</span></div>
                  <div className="relative mt-12"><div className={`mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${current.accent} shadow-lg`}><Icon className="size-7 text-[#171127]" /></div><div className="h-3 w-28 rounded-full bg-white/20" /><div className="mt-3 h-2 w-48 rounded-full bg-white/10" /></div>
                  <div className="relative mt-12 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[.06] p-4"><div className="h-2 w-12 rounded bg-white/20" /><div className="mt-4 h-6 w-10 rounded bg-white/80" /></div><div className="rounded-xl border border-white/10 bg-white/[.06] p-4"><div className="h-2 w-16 rounded bg-white/20" /><div className="mt-4 h-6 w-14 rounded bg-white/80" /></div></div>
                  <div className="relative mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.06] p-3"><span className={`grid size-9 place-items-center rounded-lg bg-gradient-to-br ${current.accent}`}><Check className="size-4 text-[#171127]" /></span><div className="flex-1"><div className="h-2 w-24 rounded bg-white/25" /><div className="mt-2 h-1.5 w-full rounded-full bg-white/10"><div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${current.accent}`} /></div></div></div>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] font-medium text-white/30">A focused home for your watchlist</p>
            </div>
          </div>
        </section>
        <footer className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/30"><span>Track less. Watch more.</span><span className="hidden sm:block">No account? Start here.</span></footer>
      </div>
    </main>
  )
}
