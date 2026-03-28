'use client'
import { MarkentineLogoIcon } from '@/components/markentine-logo-mark'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// ── Palette (mirrors main site CSS vars exactly) ──────────────────────────────
const C = {
  brownDk:   '#3E2723',
  brownMd:   '#6D4C41',
  brownLt:   '#8D6E63',
  terra:     '#E89C7F',
  terraD:    '#DD8B6F',
  coral:     '#FF9B85',
  cream:     '#F5EFE6',
  creamD:    '#EDE4D3',
  warmWh:    '#FEFEF8',
  peach:     '#FFD4B8',
  gold:      '#D4AF37',
  copper:    '#B87333',
  taupe:     '#D4C4B0',
  gray:      '#9E9E9E',
}

// Warm-dark semi-transparent overlays (replace cold #0a0a0a)
const DARK88  = `rgba(62,39,35,.88)`
const DARK72  = `rgba(62,39,35,.72)`
const DARK55  = `rgba(62,39,35,.55)`
const DARK20  = `rgba(62,39,35,.2)`

const TICK = 60

// ── types ─────────────────────────────────────────────────────────────────────
type Spec = {
  headline: string; lede: string; facts: string[]
  why_it_matters: string; tts_script: string; music_mood: string
}
type StoryData = {
  spec: Spec; imageB64: string | null
  ttsAudio: string | null; musicAudio: string | null
}

// ── helpers ───────────────────────────────────────────────────────────────────
async function post(path: string, body: object) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json()
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: "'Roboto',sans-serif", fontSize: 13, color: `rgba(245,239,230,.55)`, letterSpacing: '.1em', fontVariantNumeric: 'tabular-nums' }}>
      {time}
    </span>
  )
}

// ── component ─────────────────────────────────────────────────────────────────
export default function BroadcastPage() {
  const [headlines,  setHeadlines]  = useState<string[]>([])
  const [idx,        setIdx]        = useState(0)
  const [story,      setStory]      = useState<StoryData | null>(null)
  const [phase,      setPhase]      = useState<'boot'|'fetching-trends'|'loading-story'|'playing'|'error'>('boot')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [countdown,  setCountdown]  = useState(TICK)
  const [tickerText, setTickerText] = useState('Fetching live headlines…')

  const ttsRef   = useRef<HTMLAudioElement | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopAudio() {
    if (ttsRef.current)   { ttsRef.current.pause();  ttsRef.current.src  = '' }
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.src = '' }
  }

  function playAudio(ttsB64: string | null, musicB64: string | null) {
    stopAudio()
    if (ttsB64) {
      const a = new Audio(`data:audio/wav;base64,${ttsB64}`)
      a.volume = 1; a.play().catch(() => {})
      ttsRef.current = a
    }
    if (musicB64) {
      const m = new Audio(`data:audio/wav;base64,${musicB64}`)
      m.volume = 0.18; m.loop = true; m.play().catch(() => {})
      musicRef.current = m
    }
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(TICK)
    timerRef.current = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0 } return p - 1 })
    }, 1000)
  }

  const loadStory = useCallback(async (headline: string) => {
    setPhase('loading-story'); setStory(null); stopAudio()
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const spec: Spec = await post('/api/story-spec', { headline, niche: 'auto', tone: 'news' })
      const [carouselRes, ttsRes, musicRes] = await Promise.all([
        post('/api/carousel', spec),
        post('/api/tts',   { tts_script: spec.tts_script }),
        post('/api/music', { music_mood: spec.music_mood }),
      ])
      const imageB64   = carouselRes.images?.[0]?.data ?? null
      const ttsAudio   = ttsRes.audio  ?? null
      const musicAudio = musicRes.audio ?? null
      setStory({ spec, imageB64, ttsAudio, musicAudio })
      setPhase('playing')
      playAudio(ttsAudio, musicAudio)
      startTimer()
    } catch (e: any) { setErrorMsg(e.message ?? 'Failed to load story'); setPhase('error') }
  }, [])

  useEffect(() => {
    if (countdown === 0 && headlines.length > 0 && phase === 'playing') {
      const next = (idx + 1) % headlines.length
      setIdx(next); loadStory(headlines[next])
    }
  }, [countdown, headlines, idx, phase, loadStory])

  useEffect(() => {
    setPhase('fetching-trends')
    fetch('/api/trending')
      .then(r => r.json())
      .then(({ headlines: h }: { headlines: string[] }) => {
        setHeadlines(h); setTickerText(h.join('   ·   ')); setIdx(0); loadStory(h[0])
      })
      .catch(() => { setPhase('error'); setErrorMsg('Could not fetch trending headlines') })
  }, [loadStory])

  useEffect(() => () => { stopAudio(); if (timerRef.current) clearInterval(timerRef.current) }, [])

  function nextStory() {
    if (!headlines.length) return
    const next = (idx + 1) % headlines.length
    setIdx(next); loadStory(headlines[next])
  }

  const progress = ((TICK - countdown) / TICK) * 100
  const busy = phase === 'loading-story' || phase === 'fetching-trends'

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: C.brownDk,
      fontFamily: "'Roboto',sans-serif",
      color: C.warmWh,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── GOOGLE FONTS ──────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,700&display=swap');

        @keyframes livepulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.4)} }
        @keyframes bcastfade  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lowerthird { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ticker     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes gradmv     { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
      <nav style={{
        flexShrink: 0, height: 60, zIndex: 10,
        background: `rgba(50,28,24,.94)`,
        borderBottom: `1px solid rgba(232,156,127,.15)`,
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${C.terra},${C.coral})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(232,156,127,.4)` }}>
            <MarkentineLogoIcon size={18} />
          </div>
          <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 15, fontWeight: 700, color: C.cream, letterSpacing: '-.02em' }}>Markentine</span>
        </Link>

        {/* LIVE badge — terracotta brand colour, not generic red */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `rgba(232,156,127,.15)`, border: `1px solid rgba(232,156,127,.4)`, borderRadius: 6, padding: '4px 11px', flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.terra, display: 'block', animation: 'livepulse 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', color: C.terra }}>LIVE</span>
        </div>

        {/* Current headline in center */}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          {story && (
            <p style={{ fontSize: 12.5, fontWeight: 500, color: `rgba(245,239,230,.6)`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-.01em' }}>
              {story.spec.headline}
            </p>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {headlines.length > 0 && (
            <span style={{ fontSize: 11, color: `rgba(212,196,176,.4)`, fontWeight: 500 }}>{idx + 1} / {headlines.length}</span>
          )}
          <Clock />
          <button
            onClick={nextStory} disabled={busy}
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              padding: '7px 16px', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer',
              border: `1.5px solid rgba(232,156,127,.3)`,
              background: `rgba(232,156,127,.08)`, color: `rgba(245,239,230,.7)`,
              transition: 'all .2s', fontFamily: "'Roboto',sans-serif",
              opacity: busy ? .35 : 1,
            }}
            onMouseEnter={e => { if (!busy) { (e.currentTarget as HTMLElement).style.background = `rgba(232,156,127,.18)`; (e.currentTarget as HTMLElement).style.color = C.warmWh } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(232,156,127,.08)`; (e.currentTarget as HTMLElement).style.color = `rgba(245,239,230,.7)` }}
          >Next story →</button>
        </div>
      </nav>

      {/* ── PROGRESS BAR ──────────────────────────────────────────────────────── */}
      <div style={{ height: 2, background: `rgba(232,156,127,.12)`, flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg,${C.terra},${C.coral})`,
          backgroundSize: '200% 200%', animation: 'gradmv 3s ease infinite',
          width: `${phase === 'playing' ? progress : 0}%`,
          transition: 'width 1s linear',
        }} />
      </div>

      {/* ── MAIN CANVAS ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Hero image */}
        {story?.imageB64 && (
          <img key={story.spec.headline} src={`data:image/png;base64,${story.imageB64}`} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.38) saturate(1.05)', animation: 'bcastfade .9s ease both' }} />
        )}

        {/* Warm-brown gradient overlays (site palette, not cold black) */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${DARK88} 0%, ${DARK20} 45%, transparent 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${DARK55} 0%, transparent 55%)` }} />

        {/* No-image background when loading */}
        {!story?.imageB64 && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,156,127,.06), transparent)` }} />
        )}

        {/* ── LOADING STATE ──────────────────────────────────────────────────── */}
        {(phase === 'boot' || phase === 'fetching-trends' || phase === 'loading-story') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ width: 42, height: 42, border: `3px solid rgba(232,156,127,.15)`, borderTopColor: C.terra, borderRadius: '50%', animation: 'spin .85s linear infinite' }} />
            <p style={{ fontSize: 12, color: `rgba(212,196,176,.5)`, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Roboto',sans-serif" }}>
              {phase === 'fetching-trends' ? 'Scanning live headlines…' : 'Generating broadcast…'}
            </p>
          </div>
        )}

        {/* ── ERROR STATE ────────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <p style={{ fontSize: 13, color: C.coral }}>Broadcast error: {errorMsg}</p>
            <button onClick={() => window.location.reload()} style={{ fontSize: 12, padding: '8px 20px', borderRadius: 8, border: `1px solid rgba(232,156,127,.3)`, background: `rgba(232,156,127,.1)`, color: C.peach, cursor: 'pointer', fontFamily: "'Roboto',sans-serif" }}>
              Retry
            </button>
          </div>
        )}

        {/* ── LOWER THIRD (CNN/BBC style) ────────────────────────────────────── */}
        {story && phase === 'playing' && (
          <div style={{ position: 'absolute', bottom: 48, left: 0, maxWidth: 'min(720px,75vw)', animation: 'lowerthird .5s cubic-bezier(.22,1,.36,1) both' }}>
            {/* Top label bar */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ background: C.terra, padding: '5px 16px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', color: '#fff', whiteSpace: 'nowrap' }}>BREAKING NEWS</span>
              </div>
              <div style={{ background: DARK88, padding: '5px 16px', flex: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', color: `rgba(212,196,176,.55)`, textTransform: 'uppercase' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Headline + lede panel */}
            <div style={{ background: DARK88, padding: '14px 20px 12px', backdropFilter: 'blur(6px)' }}>
              <h2 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 'clamp(17px,2.3vw,27px)', fontWeight: 700, lineHeight: 1.2, color: C.warmWh, marginBottom: 7 }}>
                {story.spec.headline}
              </h2>
              <p style={{ fontSize: 13, color: `rgba(245,239,230,.68)`, lineHeight: 1.55 }}>{story.spec.lede}</p>
            </div>

            {/* Accent gradient bar */}
            <div style={{ height: 3, background: `linear-gradient(to right, ${C.terra}, ${C.coral}, transparent)` }} />
          </div>
        )}

        {/* ── COUNTDOWN RING ────────────────────────────────────────────────── */}
        {phase === 'playing' && (
          <div style={{ position: 'absolute', bottom: 56, right: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke={`rgba(232,156,127,.15)`} strokeWidth="3" />
              <circle cx="26" cy="26" r="22" fill="none" stroke={C.terra} strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - countdown / TICK)}`}
                strokeLinecap="round" transform="rotate(-90 26 26)"
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
              <text x="26" y="31" textAnchor="middle" fill={`rgba(245,239,230,.8)`} fontSize="13" fontFamily="Roboto,sans-serif" fontWeight="600">{countdown}</text>
            </svg>
            <span style={{ fontSize: 9, color: `rgba(212,196,176,.35)`, letterSpacing: '.1em', textTransform: 'uppercase' }}>next in</span>
          </div>
        )}

        {/* ── FACTS SIDEBAR ─────────────────────────────────────────────────── */}
        {story && phase === 'playing' && story.spec.facts?.length > 0 && (
          <div style={{ position: 'absolute', top: 22, right: 22, width: 252, display: 'flex', flexDirection: 'column', gap: 8, animation: 'bcastfade .6s .3s ease both' }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', color: `rgba(212,196,176,.4)`, textTransform: 'uppercase', marginBottom: 2 }}>Key facts</span>
            {story.spec.facts.slice(0, 4).map((f, i) => (
              <div key={i} style={{
                background: DARK72, backdropFilter: 'blur(10px)',
                border: `1px solid rgba(232,156,127,.12)`, borderRadius: 10,
                padding: '10px 13px', display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontFamily: "'Roboto', sans-serif", fontStyle: 'italic', fontWeight: 700, fontSize: 11, color: C.terra, flexShrink: 0 }}>0{i + 1}</span>
                <span style={{ fontSize: 11.5, color: `rgba(245,239,230,.7)`, lineHeight: 1.55 }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM TICKER ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 36,
        background: `rgba(40,22,19,.97)`,
        borderTop: `2px solid ${C.terra}`,
        overflow: 'hidden', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ background: C.terra, padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.18em', color: '#fff', whiteSpace: 'nowrap', fontFamily: "'Roboto',sans-serif" }}>MEDIAPACK LIVE</span>
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'ticker 40s linear infinite' }}>
            {[tickerText, tickerText].map((t, k) => (
              <span key={k} style={{ whiteSpace: 'nowrap', padding: '0 60px', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: `rgba(212,196,176,.6)`, fontFamily: "'Roboto',sans-serif" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
