'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const HeroIntroAnimation = dynamic(
  () => import('@/components/ui/hero-intro-animation').then((m) => m.HeroIntroAnimation),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '100vh',
          width: '100%',
          background: '#06080F',
          position: 'relative',
        }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(212,175,55,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.04) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />
      </div>
    ),
  }
)
import { MarkentineLogoIcon } from '@/components/markentine-logo-mark'
import { normalizeDiscoverPayload } from '@/lib/discover-normalize'

type Slide = { slide: number; data: string | null; mock: boolean }
type Pack  = { spec: any; images: Slide[]; video: string | null; podcast: string | null }
type HistoryItem = {
  id: string
  headline: string
  lede: string
  createdAt: string
  slideThumb: string | null   // base64 of slide 1
  why_it_matters: string
}

const STEPS = [
  { label: 'Building your content brief',  sub: 'AI-grounded research and brand framing' },
  { label: 'Designing carousel',           sub: 'AI-generated slide visuals' },
  { label: 'Crafting platform posts',      sub: 'LinkedIn · X · Instagram copy' },
  { label: 'Rendering video',              sub: 'Cinematic 8-second clip' },
]

const TONES = [
  { id: 'news',      label: 'Editorial',  desc: 'Polished brand journalism — authoritative and factual' },
  { id: 'opinion',   label: 'Opinion',    desc: 'Bold take — strong voice, clear point of view' },
  { id: 'explainer', label: 'Explainer',  desc: 'Educational content — clear, accessible, relatable' },
] as const
type ToneId = typeof TONES[number]['id']

const NICHES = [
  { id: 'auto',          label: 'Auto-detect',      tone: 'neutral, professional',                       visual: 'clean editorial',              music: 'neutral cinematic' },
  { id: 'tech',          label: 'Tech & Startups',  tone: 'forward-looking, optimistic, founder-speak',  visual: 'futuristic, minimalist, neon',  music: 'upbeat corporate electronic' },
  { id: 'finance',       label: 'Finance',          tone: 'sharp, authoritative, data-driven',           visual: 'dark premium, charts, gold',    music: 'serious orchestral, measured' },
  { id: 'defense',       label: 'Defense',          tone: 'serious, tactical, precise',                  visual: 'dark tactical, military grey',  music: 'tense cinematic, percussion' },
  { id: 'sports',        label: 'Sports',           tone: 'energetic, bold, fan-first',                  visual: 'dynamic, bold colors, action',  music: 'driving drums, hype' },
  { id: 'entertainment', label: 'Entertainment',    tone: 'playful, punchy, pop-culture savvy',          visual: 'vibrant, colorful, glossy',     music: 'upbeat pop, fun' },
  { id: 'health',        label: 'Health & Science', tone: 'clear, hopeful, evidence-based',              visual: 'clean white, calm blue-green',  music: 'gentle cinematic, hopeful' },
] as const
type NicheId = typeof NICHES[number]['id']

const EXAMPLES = [
  'Anduril raised $100M Series D led by Founders Fund',
  'OpenAI launches GPT-5 with 2M token context window',
  'SpaceX Starship completes first successful Mars flyby',
  'Apple acquires AI startup Perplexity for $3.2B',
]

const TAGLINE_PREFIX = 'Get your profits in line with '
const TAGLINE = `${TAGLINE_PREFIX}Markentine.`

const IMG = {
  hero1:    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=85',
  mobile:   'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
  fact:     'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&q=80',
  carousel: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=700&q=80',
  video:    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700&q=80',
  audio:    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=700&q=80',
  publish:  'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=700&q=80',
  writing:  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&q=80',
}

function useTypewriter(text: string, speed = 38, active = false) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!active) { setOut(''); return }
    setOut(''); let i = 0
    const id = setInterval(() => { i++; setOut(text.slice(0, i)); if (i >= text.length) clearInterval(id) }, speed)
    return () => clearInterval(id)
  }, [text, active])
  return out
}

function useInView(ref: React.RefObject<Element>, threshold = 0.12) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return vis
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null!)
  const vis = useInView(ref)
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(32px)', transition: `opacity .75s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .75s cubic-bezier(.22,1,.36,1) ${delay}ms`, ...style }}>
      {children}
    </div>
  )
}

// ── History helpers (localStorage per user) ──────────────────────────────────
function getHistoryKey(userId: string) { return `mp_history_${userId}` }

function loadHistory(userId: string): HistoryItem[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToHistory(userId: string, item: HistoryItem) {
  try {
    const existing = loadHistory(userId)
    // newest first, max 50 items
    const updated = [item, ...existing].slice(0, 50)
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(updated))
  } catch {}
}

function deleteFromHistory(userId: string, id: string) {
  try {
    const existing = loadHistory(userId)
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(existing.filter(i => i.id !== id)))
  } catch {}
}

const TOPIC_IMAGES: [RegExp, string][] = [
  [/\b(ai|artificial intelligence|openai|gpt|llm|machine learning|deepmind|anthropic)\b/i, 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80'],
  [/\b(startup|series [a-e]|funding|venture|raise[ds]?|invest|valuation)\b/i,              'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80'],
  [/\b(stock|market|nasdaq|s&p|crypto|bitcoin|ethereum|finance|bank|ipo)\b/i,              'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80'],
  [/\b(space|nasa|rocket|satellite|mars|moon|orbit|starship|spacex)\b/i,                   'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80'],
  [/\b(health|medical|hospital|drug|fda|vaccine|cancer|clinical|pharma)\b/i,               'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80'],
  [/\b(climate|energy|solar|wind|electric|carbon|sustainability|green|ev)\b/i,             'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80'],
  [/\b(apple|google|microsoft|meta|amazon|tesla|nvidia|chip|semiconductor)\b/i,            'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'],
  [/\b(election|government|policy|law|senate|congress|president|politics)\b/i,             'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80'],
  [/\b(sport|nba|nfl|soccer|football|olympic|championship|league|team)\b/i,               'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80'],
  [/\b(media|publish|content|social|tiktok|instagram|youtube|creator)\b/i,                 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80'],
]
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80'

function getTopicImage(headline: string): string {
  for (const [pattern, url] of TOPIC_IMAGES) {
    if (pattern.test(headline)) return url
  }
  return FALLBACK_IMG
}

// ── History Card ──────────────────────────────────────────────────────────────
function HistoryCard({ item, onView, onDelete }: { item: HistoryItem; onView: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  const date = new Date(item.createdAt)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const topicImg = getTopicImage(item.headline)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg2)',
        border: hovered ? '1px solid rgba(212,175,55,.35)' : '1px solid var(--border)',
        borderTop: hovered ? '3px solid var(--terra)' : '3px solid transparent',
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered ? 'var(--shadow-md)' : 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all .28s cubic-bezier(.22,1,.36,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{ height: 140, background: 'var(--bg2)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <img src={topicImg} alt={item.headline}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s', transform: hovered ? 'scale(1.06)' : 'scale(1)', filter: 'brightness(.8)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(62,39,35,.28),rgba(232,156,127,.08))' }} />
        {/* Date badge */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(62,39,35,.7)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 10px' }}>
          <span style={{ fontSize: 10, color: 'rgba(254,254,248,.85)', fontWeight: 500 }}>{dateStr} · {timeStr}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#FEFEF8', lineHeight: 1.45, fontFamily: 'Roboto, sans-serif' }}>
          {item.headline.length > 72 ? item.headline.slice(0, 72) + '…' : item.headline}
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6, flex: 1 }}>
          {item.lede.length > 90 ? item.lede.slice(0, 90) + '…' : item.lede}
        </p>
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 14px 14px', display: 'flex', gap: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); onView() }}
          style={{ flex: 1, background: 'linear-gradient(135deg,var(--terra),var(--coral))', border: 'none', borderRadius: 9, padding: '9px', fontSize: 12, fontWeight: 600, color: '#FEFEF8', cursor: 'pointer', fontFamily: 'Roboto,sans-serif', transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
        >View pack</button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{ width: 34, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 14, cursor: 'pointer', color: 'var(--text-3)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,.12)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,.4)'; e.currentTarget.style.color = 'var(--terra)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--gray)' }}
        >✕</button>
      </div>
    </div>
  )
}

// ── Platform Posts ─────────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    bg: 'rgba(10,102,194,.07)',
    border: 'rgba(10,102,194,.22)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
    getText: (p: any) => p?.linkedin?.post ?? '',
    getTags: (p: any) => p?.linkedin?.hashtags ?? [],
    charLimit: null,
    composeUrl: (text: string) => `https://www.linkedin.com/feed/`,
    composeLabel: 'Copy & Open LinkedIn',
    copyOnly: true,
  },
  {
    id: 'twitter_x',
    label: 'Twitter / X',
    color: '#000000',
    bg: 'rgba(0,0,0,.05)',
    border: 'rgba(0,0,0,.15)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    getText: (p: any) => p?.twitter_x?.main_tweet ?? '',
    getTags: (p: any) => [],
    charLimit: 280,
    composeUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    composeLabel: 'Post to X →',
    copyOnly: false,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    bg: 'rgba(225,48,108,.06)',
    border: 'rgba(225,48,108,.2)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="url(#ig)"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
    ),
    getText: (p: any) => p?.instagram?.caption ?? '',
    getTags: (p: any) => p?.instagram?.hashtags ?? [],
    charLimit: null,
    composeUrl: () => 'https://www.instagram.com/',
    composeLabel: 'Copy & Open Instagram',
    copyOnly: true,
  },
] as const

function pickPostText(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v
  }
  return ''
}

function normalizeThread(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object' && 'text' in (item as object)) return String((item as { text: string }).text).trim()
      return ''
    })
    .filter(Boolean)
}

function PlatformPosts({ posts }: { posts: any }) {
  const [texts, setTexts]       = useState<Record<string, string>>({})
  const [copied, setCopied]     = useState<Record<string, boolean>>({})
  const [tagCopied, setTagCopied] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!posts) return
    const li = posts.linkedin ?? posts.LinkedIn ?? {}
    const tx = posts.twitter_x ?? posts.twitterX ?? posts.Twitter ?? posts.x ?? {}
    const ig = posts.instagram ?? posts.Instagram ?? {}
    setTexts({
      linkedin:  pickPostText(li, ['post', 'body', 'text', 'content', 'copy']),
      twitter_x: pickPostText(tx, ['main_tweet', 'tweet', 'text', 'post', 'mainTweet']),
      instagram: pickPostText(ig, ['caption', 'text', 'post', 'body', 'copy']),
    })
  }, [posts])

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(p => ({ ...p, [id]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [id]: false })), 2000)
  }

  function copyTag(clean: string) {
    navigator.clipboard.writeText(`#${clean}`).catch(() => {})
    setTagCopied(p => ({ ...p, [clean]: true }))
    setTimeout(() => setTagCopied(p => ({ ...p, [clean]: false })), 1500)
  }

  const thread: string[] = normalizeThread(posts?.twitter_x?.thread ?? posts?.twitterX?.thread ?? posts?.Twitter?.thread)

  // focus border colour per platform (instagram gets mid-gradient red)
  function focusColor(id: string) {
    if (id === 'instagram') return '#dc2743'
    return PLATFORMS.find(p => p.id === id)?.color ?? 'var(--terra)'
  }

  return (
    <div className="card" style={{ padding: '28px 32px 32px', marginBottom: 20 }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 4 }}>Platform Posts</span>
          <p className="caption">AI-written, platform-native copy — edit before posting</p>
        </div>
        <span className="chip">Ready to post</span>
      </div>

      {/* ── Three cards side by side ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, alignItems: 'start' }}>
        {PLATFORMS.map(plat => {
          const text     = texts[plat.id] ?? ''
          const tags: string[] = plat.getTags(posts)
          const overLimit = plat.charLimit != null && text.length > plat.charLimit
          const igColor   = plat.id === 'instagram' ? '#dc2743' : plat.color

          return (
            <div key={plat.id} style={{
              background: 'var(--bg2)',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 2px 16px rgba(0,0,0,.35)',
              transition: 'box-shadow .2s',
            }}>
              {/* ── Platform colour bar (3 px) ─────────────────────── */}
              <div style={{
                height: 3, flexShrink: 0,
                background: plat.id === 'instagram'
                  ? 'linear-gradient(90deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
                  : plat.color,
              }} />

              {/* ── Card body ──────────────────────────────────────── */}
              <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>

                {/* Platform name + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {plat.icon}
                  <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: 'Roboto,sans-serif', color: 'var(--text)', letterSpacing: '.01em' }}>{plat.label}</span>
                </div>

                {/* Textarea */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={text}
                    onChange={e => setTexts(p => ({ ...p, [plat.id]: e.target.value }))}
                    rows={plat.id === 'linkedin' ? 9 : 5}
                    placeholder={plat.id === 'linkedin' ? 'LinkedIn post will appear here…' : plat.id === 'twitter_x' ? 'Main tweet will appear here…' : 'Instagram caption will appear here…'}
                    style={{
                      width: '100%',
                      padding: `11px 12px ${plat.charLimit ? '26px' : '11px'} 12px`,
                      borderRadius: 10,
                      border: '1.5px solid rgba(212,175,55,.22)',
                      background: 'rgba(0,0,0,.35)', fontFamily: 'Roboto,sans-serif',
                      fontSize: 12, lineHeight: 1.7, color: '#FEFEF8',
                      resize: 'vertical', outline: 'none',
                      transition: 'border-color .18s, box-shadow .18s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = focusColor(plat.id); e.target.style.boxShadow = `0 0 0 3px ${focusColor(plat.id)}18` }}
                    onBlur={e => { e.target.style.borderColor = 'var(--taupe-d)'; e.target.style.boxShadow = 'none' }}
                  />
                  {/* Character counter */}
                  {plat.charLimit != null && (
                    <span style={{
                      position: 'absolute', bottom: 8, right: 10,
                      fontSize: 10, fontFamily: 'Roboto,sans-serif', fontWeight: 700,
                      color: overLimit ? '#ef4444' : 'var(--gray)',
                      transition: 'color .15s',
                    }}>
                      {text.length} / {plat.charLimit}
                    </span>
                  )}
                </div>

                {/* ── Twitter / X thread ──────────────────────────── */}
                {plat.id === 'twitter_x' && thread.length > 0 && (
                  <div>
                    <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Thread continuation</p>
                    <div style={{ position: 'relative', paddingLeft: 18 }}>
                      {/* Vertical connector line */}
                      <div style={{
                        position: 'absolute', left: 5, top: 6, bottom: 6,
                        width: 2, borderRadius: 2,
                        background: 'linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.04) 100%)',
                      }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {thread.map((t, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            {/* Thread dot */}
                            <div style={{
                              position: 'absolute', left: -18, top: 12,
                              width: 8, height: 8, borderRadius: '50%',
                              background: i === 0 ? '#000' : 'rgba(0,0,0,.2)',
                              border: '1.5px solid #fff',
                              boxShadow: '0 0 0 1px rgba(0,0,0,.12)',
                              boxSizing: 'border-box',
                            }} />
                            <div style={{
                              background: 'rgba(0,0,0,.3)',
                              border: '1px solid rgba(255,255,255,.08)',
                              borderRadius: 9, padding: '9px 10px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                            }}>
                              <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'rgba(254,254,248,.88)', flex: 1, margin: 0, fontFamily: 'Roboto,sans-serif' }}>{t}</p>
                              <button
                                onClick={() => copyText(`thread-${i}`, t)}
                                style={{
                                  flexShrink: 0, fontSize: 10, fontWeight: 600, fontFamily: 'Roboto,sans-serif',
                                  padding: '3px 7px', borderRadius: 5, border: '1px solid rgba(0,0,0,.1)',
                                  background: copied[`thread-${i}`] ? '#16a34a' : 'transparent',
                                  color: copied[`thread-${i}`] ? '#fff' : 'rgba(254,254,248,.45)',
                                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                                }}
                              >
                                {copied[`thread-${i}`] ? '✓' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Hashtag pills ────────────────────────────────── */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {tags.map((tag: string) => {
                      const clean = tag.replace(/^#/, '')
                      return (
                        <button
                          key={tag}
                          onClick={() => copyTag(clean)}
                          title="Click to copy"
                          style={{
                            fontSize: 10.5, fontWeight: 600, fontFamily: 'Roboto,sans-serif',
                            padding: '3px 9px', borderRadius: 100, cursor: 'pointer',
                            border: '1.5px solid rgba(212,175,55,.28)',
                            background: tagCopied[clean] ? 'var(--terra)' : 'rgba(212,175,55,.1)',
                            color:      tagCopied[clean] ? '#06080F'       : 'var(--copper)',
                            transition: 'all .15s',
                          }}
                        >
                          #{clean}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Spacer pushes buttons to bottom */}
                <div style={{ flex: 1, minHeight: 4 }} />

                {/* ── Action buttons ────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 7 }}>
                  {/* Copy post */}
                  <button
                    onClick={() => copyText(plat.id, text)}
                    style={{
                      flex: 1, fontSize: 11.5, fontWeight: 600, fontFamily: 'Roboto,sans-serif',
                      padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                      border: `1.5px solid ${igColor}`,
                      background: copied[plat.id] ? igColor : 'transparent',
                      color:      copied[plat.id] ? '#fff'   : igColor,
                      transition: 'all .18s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copied[plat.id] ? 'Copied ✓' : 'Copy post'}
                  </button>

                  {/* Open platform */}
                  <button
                    onClick={() => {
                      if (plat.copyOnly) {
                        copyText(
                          plat.id,
                          text + (tags.length ? '\n\n' + tags.map((t: string) => `#${t.replace(/^#/, '')}`).join(' ') : '')
                        )
                      }
                      window.open(plat.composeUrl(text), '_blank')
                    }}
                    style={{
                      flex: 1, fontSize: 11.5, fontWeight: 600, fontFamily: 'Roboto,sans-serif',
                      padding: '9px 10px', borderRadius: 9, cursor: 'pointer', border: 'none',
                      background: plat.id === 'instagram'
                        ? 'linear-gradient(135deg,#f09433 0%,#dc2743 55%,#bc1888 100%)'
                        : plat.color,
                      color: '#FEFEF8',
                      boxShadow: `0 3px 10px ${igColor}44`,
                      transition: 'opacity .18s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '.82')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {plat.id === 'linkedin' ? 'Open LinkedIn' : plat.id === 'twitter_x' ? 'Post to X →' : 'Open Instagram'}
                  </button>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Copy-to-clipboard mini hook ───────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(p => ({ ...p, [key]: true }))
    setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2000)
  }
  return { copied, copy }
}

function CopyBtn({ id, text, label }: { id: string; text: string; label?: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      onClick={() => copy(id, text)}
      title="Copy"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 600, fontFamily: 'Roboto, sans-serif',
        padding: label ? '5px 12px' : '6px 8px',
        borderRadius: 7, cursor: 'pointer',
        border: '1px solid rgba(255,255,255,.12)',
        background: copied[id] ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.04)',
        color: copied[id] ? '#10b981' : 'rgba(254,254,248,.55)',
        transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {copied[id]
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
      {label && <span>{copied[id] ? 'Copied!' : label}</span>}
    </button>
  )
}

// ── Boost Tab ─────────────────────────────────────────────────────────────────
function BoostTab({ data, loading }: { data: any; loading: boolean }) {
  const ACCENT = 'var(--gold)'
  const CARD = { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 20, marginBottom: 16 } as const

  const OBJ_COLORS: Record<string, string> = {
    AWARENESS: 'rgba(59,130,246,.85)', CONSIDERATION: 'rgba(168,85,247,.85)',
    CONVERSION: 'rgba(16,185,129,.85)', ENGAGEMENT: 'rgba(245,158,11,.85)',
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(254,254,248,.35)' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(212,175,55,.2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 18px' }} />
        <p style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>Generating ad strategy…</p>
      </div>
    )
  }

  if (!data) return null

  const obj: string = data.campaign_objective ?? 'AWARENESS'
  const platforms: any[] = data.platform_recommendations ?? []
  const budget: any = data.budget_suggestion ?? {}
  const targeting: any = data.targeting ?? {}
  const variants: any[] = data.ad_variants ?? []

  function copyTargeting() {
    const t = targeting
    const txt = [
      `Age: ${t.age_range?.[0]} – ${t.age_range?.[1]}`,
      `Locations: ${t.locations?.join(', ')}`,
      `Radius: ${t.radius_miles} miles`,
      `Interests: ${t.top_5_interests?.join(', ')}`,
      `Exclude: ${t.exclude?.join(', ')}`,
    ].join('\n')
    navigator.clipboard.writeText(txt).catch(() => {})
  }

  return (
    <div>
      {/* Section 1: Campaign Overview */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className="label">Campaign Overview</span>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            background: OBJ_COLORS[obj] ?? 'rgba(212,175,55,.3)',
            color: '#FEFEF8', borderRadius: 100, padding: '3px 12px',
          }}>{obj}</span>
        </div>

        {/* Platform bar */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.35)', marginBottom: 10 }}>Budget allocation</p>
        <div style={{ display: 'flex', height: 8, borderRadius: 8, overflow: 'hidden', marginBottom: 8, gap: 1 }}>
          {platforms.map((p, i) => {
            const hues = ['#3b82f6','#D4AF37','#10b981','#f97316','#8b5cf6','#ec4899','#06b6d4']
            return (
              <div key={i} title={`${p.platform} — ${p.budget_percentage}%`}
                style={{ flex: p.budget_percentage, background: hues[i % hues.length], transition: 'opacity .2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {platforms.map((p, i) => {
            const hues = ['#3b82f6','#D4AF37','#10b981','#f97316','#8b5cf6','#ec4899','#06b6d4']
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(254,254,248,.6)', fontFamily: 'Roboto, sans-serif' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: hues[i % hues.length], flexShrink: 0 }} />
                {p.platform} ({p.budget_percentage}%)
              </span>
            )
          })}
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Daily Budget', value: `$${budget.daily_budget ?? '—'}` },
            { label: 'Duration', value: `${budget.duration_days ?? '—'} days` },
            { label: 'Est. Reach', value: budget.estimated_reach ?? '—' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.14)', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: ACCENT, fontFamily: 'Roboto, sans-serif', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: 'rgba(254,254,248,.3)', marginTop: 5, fontFamily: 'Roboto, sans-serif' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform details list */}
      {platforms.length > 0 && (
        <div style={{ ...CARD, marginBottom: 16 }}>
          <p className="label" style={{ marginBottom: 14 }}>Platform breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {platforms.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(254,254,248,.55)', fontFamily: 'Roboto, sans-serif', minWidth: 90 }}>{p.platform}</span>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', color: 'rgba(254,254,248,.45)', fontFamily: 'Roboto, sans-serif' }}>{p.recommended_format?.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 11.5, color: 'rgba(254,254,248,.4)', flex: 1 }}>{p.one_line_reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Ad Copy Variants */}
      {variants.length > 0 && (
        <div style={CARD}>
          <p className="label" style={{ marginBottom: 16 }}>Ad Copy Variants</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {variants.map((pv: any, pi: number) => (
              <div key={pi}>
                <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontFamily: 'Roboto, sans-serif', marginBottom: 10 }}>{pv.platform}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
                  {(pv.variants ?? []).map((v: any, vi: number) => {
                    const fullBlock = `${v.headline}\n\n${v.primary_text}\n\nCTA: ${v.cta}`
                    return (
                      <div key={vi} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(212,175,55,.7)', fontFamily: 'Roboto, sans-serif' }}>{v.variant_label}</span>
                          <CopyBtn id={`va-${pi}-${vi}`} text={fullBlock} label="Copy All" />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.25)', fontFamily: 'Roboto, sans-serif' }}>Headline</p>
                            <CopyBtn id={`vh-${pi}-${vi}`} text={v.headline} />
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif', lineHeight: 1.4 }}>{v.headline}</p>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.25)', fontFamily: 'Roboto, sans-serif' }}>Primary text</p>
                            <CopyBtn id={`vp-${pi}-${vi}`} text={v.primary_text} />
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(254,254,248,.55)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.6 }}>{v.primary_text}</p>
                        </div>
                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', background: 'rgba(212,175,55,.12)', border: '1px solid rgba(212,175,55,.25)', color: 'var(--copper)', borderRadius: 5, padding: '3px 10px', fontFamily: 'Roboto, sans-serif' }}>{v.cta}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Targeting */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="label">Targeting</p>
          <CopyBtn
            id="targeting-all"
            text={[
              `Age: ${targeting.age_range?.[0]} – ${targeting.age_range?.[1]}`,
              `Locations: ${targeting.locations?.join(', ')}`,
              `Radius: ${targeting.radius_miles} miles`,
              `Interests: ${targeting.top_5_interests?.join(', ')}`,
              `Exclude: ${targeting.exclude?.join(', ')}`,
            ].join('\n')}
            label="Copy Targeting"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 6, fontFamily: 'Roboto, sans-serif' }}>Age range</p>
            <p style={{ fontSize: 13, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif' }}>{targeting.age_range?.[0]} – {targeting.age_range?.[1]} years</p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 6, fontFamily: 'Roboto, sans-serif' }}>Radius</p>
            <p style={{ fontSize: 13, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif' }}>{targeting.radius_miles} miles</p>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 6, fontFamily: 'Roboto, sans-serif' }}>Locations</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(targeting.locations ?? []).map((l: string) => (
              <span key={l} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.22)', color: 'var(--copper)', fontFamily: 'Roboto, sans-serif' }}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 6, fontFamily: 'Roboto, sans-serif' }}>Top interests</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(targeting.top_5_interests ?? []).map((t: string) => (
              <span key={t} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.22)', color: 'var(--copper)', fontFamily: 'Roboto, sans-serif' }}>{t}</span>
            ))}
          </div>
        </div>
        {(targeting.exclude ?? []).length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 6, fontFamily: 'Roboto, sans-serif' }}>Exclude</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(targeting.exclude ?? []).map((e: string) => (
                <span key={e} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', fontFamily: 'Roboto, sans-serif' }}>{e}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Retargeting note */}
      {data.retargeting_note && (
        <div style={{ ...CARD, border: '1px solid rgba(212,175,55,.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p className="label">Retargeting Approach</p>
            <CopyBtn id="retargeting" text={data.retargeting_note} label="Copy" />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(254,254,248,.6)', lineHeight: 1.8, fontFamily: 'Roboto, sans-serif' }}>{data.retargeting_note}</p>
        </div>
      )}
    </div>
  )
}

function formatSchemaLd(raw: unknown, spec?: { headline?: string; lede?: string }): string {
  if (raw != null && typeof raw === 'object') {
    try { return JSON.stringify(raw, null, 2) } catch { return '' }
  }
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (s) {
    try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s }
  }
  if (spec?.headline) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: spec.headline,
      description: spec.lede || '',
      datePublished: new Date().toISOString().slice(0, 10),
      author: { '@type': 'Organization', name: 'Markentine' },
      publisher: { '@type': 'Organization', name: 'Markentine' },
    }, null, 2)
  }
  return ''
}

// ── Discover Tab ───────────────────────────────────────────────────────────────
function DiscoverTab({ data, loading, spec }: { data: any; loading: boolean; spec?: any }) {
  const CARD = { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 20, marginBottom: 16 } as const
  const [schemaOpen, setSchemaOpen] = useState(true)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(254,254,248,.35)' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(212,175,55,.2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 18px' }} />
        <p style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>Optimizing for search…</p>
      </div>
    )
  }

  if (!data) return null

  if (typeof (data as any).error === 'string' && (data as any).error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(254,254,248,.55)', fontFamily: "'Roboto', sans-serif", fontSize: 14, maxWidth: 420, margin: '0 auto' }}>
        <p style={{ marginBottom: 12 }}>Couldn&apos;t load SEO assets: {(data as any).error}</p>
        <p className="caption">Try switching away and back to Discover, or generate a new pack.</p>
      </div>
    )
  }

  const d = normalizeDiscoverPayload(data, spec ?? {})
  const kw = d.keywords ?? {}
  const meta = d.meta_tags ?? {}
  const blog = d.blog_outline ?? {}
  const schemaLd = formatSchemaLd(d.schema_markup, spec)
  const gbp = d.google_business_post ?? {}
  const videoSeo = d.video_seo ?? {}
  const subjects: string[] = d.email_subject_lines ?? []
  const altTexts = d.image_alt_texts ?? {}

  const metaHtml = `<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<meta property="og:title" content="${meta.og_title}">
<meta property="og:description" content="${meta.og_description}">
<meta name="twitter:card" content="${meta.twitter_card}">`

  const allKeywords = [
    ...(kw.primary ?? []),
    ...(kw.secondary ?? []),
    ...(kw.long_tail ?? []),
    ...(kw.questions ?? []),
  ].join(', ')

  return (
    <div>
      {/* Section 1: Keywords */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="label">Keywords</p>
          <CopyBtn id="kw-all" text={allKeywords} label="Copy All Keywords" />
        </div>
        {[
          { label: 'Primary', items: kw.primary ?? [], bold: true },
          { label: 'Secondary', items: kw.secondary ?? [], bold: false },
        ].map(({ label, items, bold }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 7, fontFamily: 'Roboto, sans-serif' }}>{label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {items.map((k: string) => (
                <span key={k} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.22)', color: 'var(--copper)', fontFamily: 'Roboto, sans-serif', fontWeight: bold ? 700 : 400 }}>{k}</span>
              ))}
            </div>
          </div>
        ))}
        {[
          { label: 'Long-tail phrases', items: kw.long_tail ?? [] },
          { label: 'Question keywords', items: kw.questions ?? [] },
        ].map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 7, fontFamily: 'Roboto, sans-serif' }}>{label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {items.map((k: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'rgba(255,255,255,.02)', borderRadius: 6, padding: '7px 10px' }}>
                  <p style={{ fontSize: 12.5, color: 'rgba(254,254,248,.6)', fontFamily: 'Roboto, sans-serif' }}>{k}</p>
                  <CopyBtn id={`kw-${label}-${i}`} text={k} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Meta Tags */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="label">Meta Tags</p>
          <CopyBtn id="meta-html" text={metaHtml} label="Copy HTML" />
        </div>
        <pre style={{
          background: 'rgba(0,0,0,.4)', borderRadius: 6, padding: '14px 16px',
          fontSize: 12, fontFamily: "'Roboto', sans-serif", lineHeight: 1.7,
          color: 'rgba(254,254,248,.7)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>{metaHtml}</pre>
      </div>

      {/* Section 3: Blog Outline */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="label">Blog Outline</p>
          <CopyBtn
            id="blog-outline"
            text={`# ${blog.title}\nSlug: /${blog.slug}\nTarget: ${blog.target_word_count} words\nPrimary keyword: ${blog.primary_keyword_for_post}\n\n${(blog.h2_sections ?? []).map((s: any, i: number) => `${i + 1}. ${s.heading}\n   ${s.description}`).join('\n')}\n\nInternal links: ${(blog.internal_link_suggestions ?? []).join(', ')}`}
            label="Copy Outline"
          />
        </div>
        <h3 style={{ fontSize: 16, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif', marginBottom: 4, lineHeight: 1.4 }}>{blog.title}</h3>
        <p style={{ fontSize: 11.5, color: 'rgba(254,254,248,.35)', fontFamily: 'Roboto, sans-serif', marginBottom: 16 }}>/{blog.slug}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.22)', color: 'var(--copper)', fontFamily: 'Roboto, sans-serif' }}>{blog.target_word_count} words</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.22)', color: 'var(--copper)', fontFamily: 'Roboto, sans-serif' }}>{blog.primary_keyword_for_post}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(blog.h2_sections ?? []).map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,.02)', borderRadius: 7, padding: '10px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Roboto, sans-serif', flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif', marginBottom: 2 }}>{s.heading}</p>
                <p style={{ fontSize: 11.5, color: 'rgba(254,254,248,.4)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.5 }}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        {(blog.internal_link_suggestions ?? []).length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', marginBottom: 6, fontFamily: 'Roboto, sans-serif' }}>Internal link anchors</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(blog.internal_link_suggestions ?? []).map((l: string) => (
                <span key={l} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(254,254,248,.55)', fontFamily: 'Roboto, sans-serif', textDecoration: 'underline', textUnderlineOffset: 2 }}>{l}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Schema Markup — shown by default; Gemini may return object or string */}
      {schemaLd ? (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="label">Schema Markup (JSON-LD)</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setSchemaOpen(o => !o)}
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(254,254,248,.55)', fontFamily: 'Roboto, sans-serif' }}>
                {schemaOpen ? 'Collapse' : 'Expand'}
              </button>
              <CopyBtn id="schema-jl" text={schemaLd} label="Copy JSON-LD" />
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(254,254,248,.25)', fontFamily: 'Roboto, sans-serif', marginBottom: 10 }}>Paste this into your website's &lt;head&gt; tag inside a &lt;script type=&quot;application/ld+json&quot;&gt; block.</p>
          {schemaOpen && (
            <pre style={{
              background: 'rgba(0,0,0,.4)', borderRadius: 6, padding: '14px 16px',
              fontSize: 11.5, fontFamily: "'Roboto', sans-serif", lineHeight: 1.7,
              color: 'rgba(254,254,248,.65)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              maxHeight: 420, overflowY: 'auto',
            }}>{schemaLd}</pre>
          )}
        </div>
      ) : null}

      {/* Section 5: Quick Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }} className="grid-2col">
        {/* Google Business Post */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="label">Google Business Post</p>
            <CopyBtn id="gbp" text={gbp.text} label="Copy" />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(254,254,248,.6)', lineHeight: 1.8, fontFamily: 'Roboto, sans-serif', marginBottom: 12 }}>{gbp.text}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.22)', color: 'var(--copper)', fontFamily: 'Roboto, sans-serif' }}>{gbp.cta_type?.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Email subject lines */}
        <div style={CARD}>
          <p className="label" style={{ marginBottom: 12 }}>Email Subject Lines</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subjects.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, background: 'rgba(255,255,255,.02)', borderRadius: 6, padding: '9px 10px' }}>
                <p style={{ fontSize: 12.5, color: 'rgba(254,254,248,.6)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.5, flex: 1 }}>{s}</p>
                <CopyBtn id={`subj-${i}`} text={s} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 6: Video SEO */}
      <div style={CARD}>
        <p className="label" style={{ marginBottom: 16 }}>Video SEO</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2col">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', fontFamily: 'Roboto, sans-serif' }}>YouTube title</p>
              <CopyBtn id="yt-title" text={videoSeo.youtube_title} />
            </div>
            <p style={{ fontSize: 13, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif', marginBottom: 14, fontWeight: 600 }}>{videoSeo.youtube_title}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', fontFamily: 'Roboto, sans-serif' }}>TikTok caption</p>
              <CopyBtn id="tt-cap" text={videoSeo.tiktok_caption} />
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(254,254,248,.6)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.6 }}>{videoSeo.tiktok_caption}</p>
            {(videoSeo.youtube_tags ?? []).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', fontFamily: 'Roboto, sans-serif' }}>YouTube tags</p>
                  <CopyBtn id="yt-tags" text={(videoSeo.youtube_tags ?? []).join(', ')} label="Copy tags" />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(videoSeo.youtube_tags ?? []).map((t: string) => (
                    <span key={t} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', color: 'rgba(254,254,248,.45)', fontFamily: 'Roboto, sans-serif' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(254,254,248,.3)', fontFamily: 'Roboto, sans-serif' }}>YouTube description</p>
              <CopyBtn id="yt-desc" text={videoSeo.youtube_description} label="Copy" />
            </div>
            <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 7, padding: '12px 14px', maxHeight: 220, overflowY: 'auto' }}>
              <p style={{ fontSize: 12, color: 'rgba(254,254,248,.55)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{videoSeo.youtube_description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image alt texts */}
      {Object.keys(altTexts).length > 0 && (
        <div style={CARD}>
          <p className="label" style={{ marginBottom: 14 }}>Image Alt Texts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(altTexts).map(([slide, alt]) => (
              <div key={slide} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, background: 'rgba(255,255,255,.02)', borderRadius: 6, padding: '9px 10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(254,254,248,.25)', marginBottom: 3, fontFamily: 'Roboto, sans-serif' }}>{slide.replace(/_/g, ' ')}</p>
                  <p style={{ fontSize: 12.5, color: 'rgba(254,254,248,.55)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.5 }}>{alt as string}</p>
                </div>
                <CopyBtn id={`alt-${slide}`} text={alt as string} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const { data: session, status } = useSession()
  const isLoaded = status !== 'loading'
  const isSignedIn = status === 'authenticated'
  const user = session?.user

  const [headline, setHeadline] = useState('')
  const [niche, setNiche] = useState<NicheId>('auto')
  const [tone, setTone] = useState<ToneId>('news')
  const [pack, setPack]         = useState<Pack | null>(null)
  const [loading, setLoading]   = useState(false)
  const [stepIdx, setStepIdx]   = useState(-1)
  const [error, setError]       = useState('')
  const [mounted, setMounted]   = useState(false)
  const [history, setHistory]   = useState<HistoryItem[]>([])
  const [viewingItem, setViewingItem] = useState<HistoryItem | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [posts, setPosts]             = useState<any>(null)
  const [newsArticle, setNewsArticle] = useState<any>(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [selectingPacks, setSelectingPacks] = useState(false)
  const [selectedPackIds, setSelectedPackIds] = useState<Set<string>>(new Set())
  const [brandProfile, setBrandProfile]   = useState<any>(null)
  const [brandStorageChecked, setBrandStorageChecked] = useState(false)
  const [brandPromptDismissed, setBrandPromptDismissed] = useState(false)
  const [lightboxImg, setLightboxImg]     = useState<string | null>(null)
  const [carouselSlide, setCarouselSlide] = useState(0)
  const [podcast, setPodcast]             = useState<string | null>(null)
  const [podcastLoading, setPodcastLoading] = useState(false)

  // ── Boost + Discover engine ───────────────────────────────────────────────
  const [resultTab, setResultTab]     = useState<'content' | 'boost' | 'discover'>('content')
  const [boostData, setBoostData]     = useState<any>(null)
  const [discoverData, setDiscoverData] = useState<any>(null)
  const [boostLoading, setBoostLoading]   = useState(false)
  const [discoverLoading, setDiscoverLoading] = useState(false)

  const inputRef  = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  const typed = useTypewriter(TAGLINE, 30, mounted && isSignedIn === true)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && sessionStorage.getItem('mp_brand_prompt_dismissed') === '1') {
      setBrandPromptDismissed(true)
    }
    // Load brand profile from localStorage on mount
    const raw = typeof window !== 'undefined' ? localStorage.getItem('mp_brand_profile') : null
    if (raw) { try { setBrandProfile(JSON.parse(raw)) } catch {} }
    setBrandStorageChecked(true)
    if (isSignedIn) setTimeout(() => inputRef.current?.focus(), 800)
  }, [isSignedIn])

  const showBrandSetupBanner =
    isLoaded &&
    isSignedIn &&
    brandStorageChecked &&
    !brandProfile &&
    !brandPromptDismissed

  // ESC closes lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImg(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Load history when user is ready
  useEffect(() => {
    if (isSignedIn && user?.email) {
      setHistory(loadHistory(user.email))
    }
  }, [isSignedIn, user?.email])

  useEffect(() => {
    if (pack) setCarouselSlide(0)
  }, [pack])

  async function post(p: string, b: object) {
    const r = await fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
    return r.json()
  }

  async function safePost(path: string, body: object, fallback: any) {
    try {
      const result = await post(path, body)
      return result
    } catch {
      return fallback
    }
  }

  async function generate() {
    if (!headline.trim() || loading) return
    if (!isSignedIn) { signIn('google', { callbackUrl: '/' }); return }
    setLoading(true); setPack(null); setPosts(null); setPodcast(null); setError(''); setStepIdx(0)
    setBoostData(null); setDiscoverData(null); setResultTab('content')

    // 4-minute global guard — surfaces whatever we have and unblocks the UI
    let timedOut = false
    const globalTimeoutId = setTimeout(() => {
      timedOut = true
      setStepIdx(4)
      setError('Some assets took too long and were skipped. The rest of your pack is ready.')
      setLoading(false)
    }, 240_000)

    try {
      // ── Step 0: Story spec ───────────────────────────────────────────────
      setStepIdx(0)
      const spec = await safePost('/api/story-spec', { headline, niche, tone }, {
        headline, lede: '', facts: [], why_it_matters: '', cta: '',
        image_prompts: [], video_prompt: '', music_mood: 'neutral', tts_script: headline,
        niche, tone,
      })
      if (timedOut) return

      // ── Step 1–2: Carousel + Posts (all independent, run together) ──────
      setStepIdx(1)
      const [carouselResult, postsResult] = await Promise.allSettled([
        safePost('/api/carousel', spec, { images: [] }),
        safePost('/api/posts', { spec, brandProfile }, { linkedin: null, twitter_x: null, instagram: null }),
      ])
      const { images } = carouselResult.status === 'fulfilled' ? carouselResult.value : { images: [] }
      const postsData  = postsResult.status   === 'fulfilled' ? postsResult.value   : null
      if (timedOut) return

      // ── Step 3: Video (slow — runs alone) ───────────────────────────────
      setStepIdx(3)
      const { video } = await safePost('/api/video', spec, { video: null })
      if (timedOut) return

      // ── Done ─────────────────────────────────────────────────────────────
      setStepIdx(4)
      setPosts(postsData)
      const newPack: Pack = { spec, images, video, podcast: null }
      setPack(newPack)

      // Save to history
      const item: HistoryItem = {
        id: Date.now().toString(),
        headline: spec.headline,
        lede: spec.lede,
        createdAt: new Date().toISOString(),
        slideThumb: images?.[0]?.data ?? null,
        why_it_matters: spec.why_it_matters,
      }
      const uid = user?.email ?? 'guest'
      saveToHistory(uid, item)
      setHistory(loadHistory(uid))

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    } catch (e: any) {
      if (!timedOut) setError(e.message)
    } finally {
      clearTimeout(globalTimeoutId)
      if (!timedOut) setLoading(false)
    }
  }

  async function generatePodcast() {
    if (!pack || podcastLoading) return
    setPodcastLoading(true)
    try {
      const brandName = brandProfile?.name || 'Markentine'
      const result = await post('/api/tts', {
        tts_script: pack.spec.tts_script,
        brandName,
      })
      if (result?.audio) setPodcast(result.audio)
    } catch { /* silent */ } finally {
      setPodcastLoading(false)
    }
  }

  async function downloadZip() {
    if (!pack) return
    const JSZip = (await import('jszip')).default
    const { saveAs } = await import('file-saver')
    const zip = new JSZip()
    pack.images?.forEach((img, i) => { if (img.data) zip.file(`slide_${i + 1}.png`, img.data, { base64: true }) })
    if (pack.video) zip.file('video_clip.mp4', pack.video, { base64: true })
    if (podcast)    zip.file('podcast.wav', podcast, { base64: true })
    zip.file('story_spec.json', JSON.stringify(pack.spec, null, 2))
    zip.file('caption.txt', `${pack.spec.headline}\n\n${pack.spec.lede}\n\n${pack.spec.why_it_matters}\n\n${pack.spec.cta}`)
    saveAs(await zip.generateAsync({ type: 'blob' }), 'mediapack.zip')
  }

  function handleDeleteHistory(id: string) {
    if (!user?.email) return
    deleteFromHistory(user.email, id)
    setHistory(loadHistory(user.email))
    if (viewingItem?.id === id) setViewingItem(null)
  }

  async function generateNewsArticle(packs: HistoryItem[]) {
    if (packs.length === 0 || newsLoading) return
    setSelectingPacks(false)
    setNewsLoading(true)
    try {
      const r = await fetch('/api/news-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packs }),
      })
      const article = await r.json()
      setNewsArticle(article)
    } catch { /* silent fail */ } finally { setNewsLoading(false) }
  }

  async function loadBoost() {
    if (!pack || boostData || boostLoading) return
    setBoostLoading(true)
    try {
      const r = await fetch('/api/boost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spec: pack.spec }) })
      const d = await r.json()
      setBoostData(d)
    } catch { /* silent */ } finally { setBoostLoading(false) }
  }

  async function loadDiscover() {
    if (!pack || discoverLoading) return
    const hasOkData = discoverData && typeof discoverData === 'object' && !discoverData.error
    if (hasOkData) return
    setDiscoverLoading(true)
    try {
      const r = await fetch('/api/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spec: pack.spec }) })
      const d = await r.json()
      setDiscoverData(d)
    } catch { /* silent */ } finally { setDiscoverLoading(false) }
  }

  function switchTab(tab: 'content' | 'boost' | 'discover') {
    setResultTab(tab)
    if (tab === 'boost') loadBoost()
    if (tab === 'discover') loadDiscover()
  }

  function scrollToHistory() {
    setHistoryOpen(true)
    setTimeout(() => historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#06080F; --bg2:#0d1017; --bg3:#111820;
          --gold:#D4AF37; --copper:#B87333;
          --gold-dim:rgba(212,175,55,.55); --gold-faint:rgba(212,175,55,.12);
          --border:rgba(212,175,55,.14); --border-d:rgba(212,175,55,.09);
          --text:#FEFEF8; --text-2:rgba(254,254,248,.65); --text-3:rgba(254,254,248,.35);
          --shadow-sm:0 2px 14px rgba(0,0,0,.5);
          --shadow-md:0 6px 30px rgba(0,0,0,.65);
          --shadow-lg:0 16px 60px rgba(0,0,0,.8);
          /* Legacy aliases kept so existing var() refs still resolve */
          --peach:rgba(212,175,55,.1); --peach-d:rgba(212,175,55,.16);
          --coral:rgba(212,175,55,.75); --coral-d:rgba(184,115,51,.75);
          --sage:rgba(212,175,55,.08); --sage-d:rgba(212,175,55,.06);
          --cream:var(--bg2); --cream-d:var(--bg3); --warm-wh:var(--bg2);
          --terra:var(--gold); --terra-d:var(--copper);
          --taupe:rgba(212,175,55,.22); --taupe-d:rgba(212,175,55,.32);
          --brown-dk:var(--text); --brown-md:var(--text-2); --brown-lt:var(--text-3); --gray:var(--text-3);
          --hero-bg:var(--bg); --hero-grid:rgba(212,175,55,.055);
          --hero-gold:var(--gold); --hero-gold-d:var(--copper);
          --hero-line:rgba(212,175,55,.7); --hero-glow:rgba(212,175,55,.18);
        }
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:'Roboto',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.6;}
        h1,h2,h3,h4{font-family:'Roboto',sans-serif;font-weight:700;line-height:1.15;letter-spacing:-.01em;color:var(--text);}
        h1{font-size:clamp(38px,5vw,64px);}
        h2{font-size:clamp(26px,3.5vw,44px);}
        h3{font-size:clamp(17px,2vw,22px);}
        h4{font-size:17px;}
        p{font-size:15px;color:var(--text-2);line-height:1.75;}
        .label{font-family:'Roboto',sans-serif;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);}
        .caption{font-size:12px;color:var(--text-3);line-height:1.6;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:var(--bg);}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,.3);border-radius:4px;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmer{from{background-position:-600px 0}to{background-position:600px 0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gradmv{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes pulsedot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.75}}
        @keyframes checkpop{0%{transform:scale(0)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes drawGraph{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}
        @keyframes metricFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes heroFadeUp{from{opacity:0;transform:translateY(38px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineGrow{from{width:0}to{width:100%}}
        @keyframes scrollHint{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(6px);opacity:.4}}
        @keyframes scanLine{from{top:-2px}to{top:100%}}

        .afu{animation:fadeUp .75s cubic-bezier(.22,1,.36,1) both;}
        .afi{animation:fadeIn .5s ease both;}
        .d1{animation-delay:.1s}.d2{animation-delay:.22s}.d3{animation-delay:.34s}
        .d4{animation-delay:.46s}.d5{animation-delay:.58s}
        .cursor::after{content:'|';color:var(--gold);animation:blink 1.1s step-end infinite;margin-left:1px;}

        .tk-wrap{overflow:hidden;background:#06080F;border-bottom:1px solid var(--border);padding:11px 0;}
        .tk-track{display:flex;width:max-content;animation:ticker 38s linear infinite;}
        .tk-item{white-space:nowrap;padding:0 44px;font-family:'Roboto',sans-serif;font-size:10.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:rgba(212,175,55,.45);}
        .tk-sep{color:var(--gold);opacity:.4;}

        .navbar{position:fixed;top:0;left:0;right:0;z-index:200;height:66px;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);background:rgba(6,8,15,.88);border-bottom:1px solid rgba(212,175,55,.1);}
        .nav-inner{max-width:1180px;margin:0 auto;padding:0 32px;height:100%;display:flex;align-items:center;justify-content:space-between;}
        .nav-logo-mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--gold) 0%,var(--copper) 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(212,175,55,.3);}

        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:8px;font-family:'Roboto',sans-serif;font-weight:600;cursor:pointer;transition:all .22s;border:none;letter-spacing:.02em;position:relative;overflow:hidden;}
        .btn-shine{position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transition:left .5s;pointer-events:none;}
        .btn:hover .btn-shine{left:160%;}
        .btn-primary{background:linear-gradient(135deg,var(--gold) 0%,var(--copper) 100%);background-size:200% 200%;animation:gradmv 5s ease infinite;color:#06080F;font-size:15px;padding:17px 36px;box-shadow:0 6px 22px rgba(212,175,55,.3);}
        .btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 36px rgba(212,175,55,.45);}
        .btn-primary:disabled{opacity:.35;cursor:not-allowed;animation:none;background:rgba(212,175,55,.2);color:var(--text-3);box-shadow:none;}
        .btn-ghost{background:transparent;border:1.5px solid var(--gold);color:var(--gold);font-size:13px;padding:9px 22px;}
        .btn-ghost:hover{background:var(--gold);color:#06080F;box-shadow:0 6px 18px rgba(212,175,55,.3);}
        .btn-dark{background:rgba(212,175,55,.08);border:1px solid var(--border);color:var(--text);font-size:15px;padding:17px 36px;}
        .btn-dark:hover{background:rgba(212,175,55,.14);transform:translateY(-2px);}
        .btn-hero-primary{background:linear-gradient(135deg,#D4AF37,#B87333);color:#06080F;font-size:15px;font-weight:700;padding:17px 40px;border-radius:4px;letter-spacing:.04em;box-shadow:0 6px 28px rgba(212,175,55,.32);font-family:'Roboto',sans-serif;}
        .btn-hero-primary:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(212,175,55,.48);}
        .btn-hero-ghost{background:transparent;border:1px solid rgba(212,175,55,.35);color:rgba(254,254,248,.7);font-size:14px;padding:17px 32px;border-radius:4px;font-family:'Roboto',sans-serif;font-weight:500;transition:all .22s;}
        .btn-hero-ghost:hover{border-color:rgba(212,175,55,.7);color:#FEFEF8;background:rgba(212,175,55,.07);}

        .card{background:var(--bg2);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);transition:all .3s;}
        .card-cream{background:var(--bg2);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);transition:all .3s;}
        .card-cream:hover{box-shadow:var(--shadow-md);transform:translateY(-3px);}
        .card-terra{background:rgba(212,175,55,.05);border:1px solid rgba(212,175,55,.18);border-radius:16px;box-shadow:var(--shadow-sm);transition:all .3s;}

        .main-input{width:100%;padding:20px 24px;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;font-family:'Roboto',sans-serif;font-size:15px;color:var(--text);outline:none;transition:border-color .22s,box-shadow .22s;caret-color:var(--gold);}
        .main-input::placeholder{color:var(--text-3);}
        textarea::placeholder{color:rgba(254,254,248,.32);}
        .main-input:focus{border-color:var(--gold);box-shadow:0 0 0 4px rgba(212,175,55,.1);}

        .step-dot{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all .4s;}
        .s-done{background:linear-gradient(135deg,var(--gold),var(--copper));color:#06080F;animation:checkpop .3s cubic-bezier(.22,1,.36,1);}
        .s-cur{border:2px solid var(--gold);color:var(--gold);animation:pulsedot 1s ease-in-out infinite;}
        .s-wait{border:1.5px solid var(--border);color:var(--text-3);}

        .slide-card{aspect-ratio:3/4;border-radius:12px;overflow:hidden;position:relative;border:1px solid var(--border);transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s;}
        .slide-card:hover{transform:translateY(-10px) scale(1.04);box-shadow:var(--shadow-lg);}

        .skel{background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:600px 100%;animation:shimmer 1.8s infinite;}

        .fact-p{display:flex;align-items:flex-start;gap:10px;background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.18);border-radius:12px;padding:13px 16px;transition:all .22s;}
        .fact-p:hover{background:rgba(212,175,55,.1);border-color:rgba(212,175,55,.3);}

        .chip{display:inline-block;font-size:11px;font-weight:500;color:var(--text-2);background:rgba(212,175,55,.07);border:1px solid var(--border);padding:5px 14px;border-radius:100px;}
        .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.2),transparent);}
        .gold-bar{width:52px;height:3px;background:linear-gradient(90deg,var(--gold),var(--copper));border-radius:2px;}
        .mock-b{font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:rgba(212,175,55,.1);color:var(--gold);border:1px solid rgba(212,175,55,.25);padding:3px 8px;border-radius:6px;}
        .ex-pill{font-size:13px;font-weight:400;color:var(--text-2);background:rgba(212,175,55,.06);border:1.5px solid var(--border);border-radius:100px;padding:10px 22px;cursor:pointer;transition:all .22s;white-space:nowrap;font-family:'Roboto',sans-serif;}
        .ex-pill:hover{background:rgba(212,175,55,.12);border-color:var(--gold);color:var(--text);transform:translateY(-2px);box-shadow:0 6px 18px rgba(212,175,55,.15);}
        .stat-n{font-family:'Roboto',sans-serif;font-size:46px;line-height:1;color:var(--gold);font-weight:700;}
        audio{width:100%;accent-color:var(--gold);}

        .history-panel{background:var(--bg);border-top:1px solid var(--border);padding:60px 32px 80px;}
        .history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;}
        .gate-overlay{position:absolute;inset:0;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);background:rgba(6,8,15,.75);display:flex;align-items:center;justify-content:flex-end;z-index:10;border-radius:16px;}

        @media(max-width:768px){.grid-2col{grid-template-columns:1fr !important;}.grid-3col{grid-template-columns:1fr !important;}.hide-mob{display:none !important;}}
      `}</style>
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nav-logo-mark" title="Markentine">
              <MarkentineLogoIcon />
            </div>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 22, fontWeight: 600, color: '#FEFEF8', letterSpacing: '.04em' }}>Markentine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isLoaded && isSignedIn && (
              <>
                <button
                  onClick={scrollToHistory}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', transition: 'all .2s', fontSize: 13, fontWeight: 500, color: 'rgba(254,254,248,.75)', fontFamily: 'Roboto,sans-serif' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,.15)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,.45)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,.08)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,.2)'; e.currentTarget.style.color = 'rgba(255,255,255,.75)' }}
                >
                  My Packs
                  {history.length > 0 && (
                    <span style={{ background: '#D4AF37', color: '#06080F', borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>{history.length}</span>
                  )}
                </button>
                {user?.image && (
                  <img src={user.image} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(212,175,55,.4)' }} />
                )}
                <span style={{ fontSize: 12, color: 'rgba(254,254,248,.5)', fontWeight: 400 }}>
                  {user?.name?.split(' ')[0] ?? user?.email?.split('@')[0]}
                </span>
                <Link href="/brand" style={{ fontSize: 12, fontWeight: 600, color: '#D4AF37', border: '1px solid rgba(212,175,55,.3)', borderRadius: 8, padding: '7px 16px', textDecoration: 'none', fontFamily: 'Roboto,sans-serif', transition: 'all .2s' }}>
                  Brand DNA
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{ fontSize: 12, fontWeight: 500, color: 'rgba(254,254,248,.4)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Roboto,sans-serif' }}
                >
                  Sign out
                </button>
              </>
            )}
            {isLoaded && !isSignedIn && (
              <>
                <button style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.6)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Roboto,sans-serif' }} onClick={() => signIn('google', { callbackUrl: '/' })}>Log in</button>
                <button className="btn btn-hero-primary" style={{ fontSize: 13, padding: '10px 24px' }} onClick={() => signIn('google', { callbackUrl: '/' })}>Get started →</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {showBrandSetupBanner && (
        <div
          role="region"
          aria-label="Brand setup"
          style={{
            position: 'fixed',
            top: 66,
            left: 0,
            right: 0,
            zIndex: 199,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            padding: '11px 72px 11px 24px',
            background: 'linear-gradient(90deg, rgba(212,175,55,.12), rgba(6,8,15,.95) 45%, rgba(6,8,15,.95))',
            borderBottom: '1px solid rgba(212,175,55,.22)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(254,254,248,.88)', fontFamily: 'Roboto,sans-serif', fontWeight: 500 }}>
            <span style={{ color: '#D4AF37', fontWeight: 700, marginRight: 8 }}>Next step</span>
            Set up your brand identity so posts and campaigns match your voice.
          </p>
          <Link
            href="/brand?onboarding=true"
            className="btn btn-hero-primary"
            style={{ fontSize: 12, padding: '8px 20px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Set up brand →
          </Link>
          <button
            type="button"
            aria-label="Dismiss for this session"
            onClick={() => {
              if (typeof window !== 'undefined') sessionStorage.setItem('mp_brand_prompt_dismissed', '1')
              setBrandPromptDismissed(true)
            }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'rgba(254,254,248,.45)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              fontFamily: 'Roboto,sans-serif',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── HERO (HeroIntroAnimation) ─────────────────────────────────────── */}
      <HeroIntroAnimation
        isSignedIn={Boolean(isLoaded && isSignedIn)}
        onSignIn={() => signIn('google', { callbackUrl: '/' })}
      />

      {/* CREATE SECTION */}
      <section id="create" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 32px 80px', position: 'relative', overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="grid-2col">

            {/* LEFT */}
            <div>
              <div className="afu" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.28)', borderRadius: 100, padding: '8px 20px', marginBottom: 32 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: 'pulsedot 2s ease-in-out infinite', flexShrink: 0 }} />
                <span className="label" style={{ color: 'var(--copper)', fontSize: 10.5 }}>AI-Powered Content Intelligence Platform</span>
              </div>

              <h1 className="afu d1" style={{ marginBottom: 24 }}>
                Turn any story into<br />
                <span style={{ color: 'var(--terra)', fontStyle: 'italic' }}>a media empire.</span>
              </h1>

              {isSignedIn ? (
                <p className="afu d2 cursor" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 440, marginBottom: 16, minHeight: 30, fontWeight: 300 }}>
                  {typed.length <= TAGLINE_PREFIX.length ? (
                    <span style={{ color: '#FEFEF8' }}>{typed}</span>
                  ) : (
                    <>
                      <span style={{ color: '#FEFEF8' }}>{TAGLINE_PREFIX}</span>
                      <span style={{ color: '#D4AF37', fontWeight: 600 }}>{typed.slice(TAGLINE_PREFIX.length)}</span>
                    </>
                  )}
                </p>
              ) : (
                <p className="afu d2" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 440, marginBottom: 16, fontWeight: 300 }}>
                  <span style={{ color: '#FEFEF8' }}>{TAGLINE_PREFIX}</span>
                  <span style={{ color: '#D4AF37', fontWeight: 600 }}>Markentine.</span>
                </p>
              )}

              <p className="afu d2" style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.75, maxWidth: 440, marginBottom: 44, fontWeight: 300 }}>
                Paste a headline. Markentine generates verified story specs, Instagram carousels, cinematic video clips, platform posts, and a branded podcast episode — in about four minutes.
              </p>

              {/* Input / Sign-up CTA */}
              {isSignedIn ? (
                <>
                  {/* Tone toggle */}
                  <div className="afu d3" style={{ display: 'inline-flex', background: 'var(--bg2)', border: '1.5px solid var(--taupe-d)', borderRadius: 12, padding: 3, gap: 2, marginBottom: 12 }}>
                    {TONES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        title={t.desc}
                        style={{
                          fontSize: 12, fontWeight: 600, fontFamily: 'Roboto,sans-serif',
                          padding: '6px 18px', borderRadius: 9, cursor: 'pointer', border: 'none',
                          background: tone === t.id ? 'rgba(212,175,55,.2)' : 'transparent',
                          color: tone === t.id ? '#FEFEF8' : 'var(--gray)',
                          boxShadow: tone === t.id ? '0 1px 8px rgba(0,0,0,.25)' : 'none',
                          transition: 'all .18s',
                        }}
                      >{t.label}</button>
                    ))}
                  </div>

                  {/* Niche selector */}
                  <div className="afu d3" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                    {NICHES.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setNiche(n.id)}
                        style={{
                          fontSize: 12, fontWeight: 600, fontFamily: 'Roboto,sans-serif',
                          padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
                          border: `1.5px solid ${niche === n.id ? 'var(--terra)' : 'var(--taupe-d)'}`,
                          background: niche === n.id ? 'var(--terra)' : 'transparent',
                          color: niche === n.id ? '#fff' : 'var(--brown-md)',
                          transition: 'all .18s',
                          letterSpacing: '.01em',
                        }}
                      >{n.label}</button>
                    ))}
                  </div>

                  <div className="afu d3" style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                    <input ref={inputRef} className="main-input"
                      placeholder='"Anduril raised $100M Series D…"'
                      value={headline} onChange={e => setHeadline(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && generate()} />
                    <button className="btn btn-primary" onClick={generate} disabled={loading || !headline.trim()} style={{ whiteSpace: 'nowrap' }}>
                      <div className="btn-shine" />
                      {loading
                        ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>Creating…</>
                        : 'Create Pack →'}
                    </button>
                    <Link href="/broadcast" className="btn btn-ghost" style={{ whiteSpace: 'nowrap', textDecoration: 'none', fontSize: 14, padding: '12px 20px' }}>
                      Go Live →
                    </Link>
                  </div>
                  <div className="afu d4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {EXAMPLES.slice(0, 2).map(h => (
                      <button key={h} className="ex-pill" onClick={() => { setHeadline(h); inputRef.current?.focus() }}>
                        {h.length > 44 ? h.slice(0, 44) + '…' : h}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* NOT signed in — show locked input + sign up CTA */
                <div className="afu d3">
                  {/* Blurred input with lock overlay */}
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div className="main-input" style={{ color: 'transparent', background: 'var(--bg2)', userSelect: 'none' }}>Paste your headline here…</div>
                        <button className="btn btn-primary" style={{ opacity: .5, pointerEvents: 'none', whiteSpace: 'nowrap' }} disabled>Create Pack →</button>
                      </div>
                    </div>
                    {/* Lock badge */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <div style={{ background: 'rgba(254,254,248,.95)', border: '1.5px solid var(--taupe)', borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-md)' }}>
                        <span style={{ fontSize: 20 }}>🔒</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Sign in to create packs</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Free account · No credit card needed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auth buttons */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ fontSize: 15, padding: '18px 36px' }} onClick={() => signIn('google', { callbackUrl: '/' })}>
                      <div className="btn-shine" />
                      Create free account →
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize: 14, padding: '18px 28px' }} onClick={() => signIn('google', { callbackUrl: '/' })}>Log in</button>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}>
                    ✓ Free to start &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Pack ready in about 4 minutes
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="afu d5" style={{ display: 'flex', gap: 28, marginTop: 48, flexWrap: 'wrap' }}>
                {[['4+', 'Content formats per story'], ['< 4min', 'Full pack generation'], ['100%', 'Source-verified facts']].map(([n, l]) => (
                  <div key={l} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: 16 }}>
                    <p className="stat-n" style={{ fontSize: 32 }}>{n}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: image stack */}
            <div className="afu d2 hide-mob" style={{ position: 'relative', height: 560 }}>
              <div style={{ position: 'absolute', right: 0, top: 0, width: '80%', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', animation: 'float1 8s ease-in-out infinite' }}>
                <img src={IMG.hero1} alt="Journalist creating content" className="img-cover img-hover-scale" style={{ height: 360, width: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', left: 0, bottom: '2%', width: '52%', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', animation: 'float2 10s ease-in-out infinite' }}>
                <img src={IMG.mobile} alt="Social media on phone" className="img-cover img-hover-scale" style={{ height: 240, width: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', top: '55%', right: '18%', background: 'linear-gradient(135deg,var(--gold),var(--copper))', borderRadius: 18, padding: '16px 22px', boxShadow: '0 10px 32px rgba(184,115,51,.4)', animation: 'float3 7s ease-in-out infinite', zIndex: 10 }}>
                <p style={{ fontFamily: 'Roboto,sans-serif', fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 600, letterSpacing: '.09em', textTransform: 'uppercase' }}>Pack ready</p>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 26, color: '#FEFEF8', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.1, marginTop: 3 }}>in 4 min</p>
              </div>
              {isSignedIn && (
                <div style={{ position: 'absolute', top: '12%', left: '8%', background: 'rgba(200,213,185,.95)', border: '1px solid rgba(184,201,168,.6)', borderRadius: 14, padding: '12px 16px', backdropFilter: 'blur(10px)', animation: 'float2 9s ease-in-out infinite reverse', zIndex: 10, boxShadow: 'var(--shadow-md)' }}>
                  <p style={{ fontFamily: 'Roboto,sans-serif', fontSize: 10, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>✓ Signed in as</p>
                  <p style={{ fontFamily: 'Roboto,sans-serif', fontSize: 12, color: 'var(--text)', marginTop: 2, fontWeight: 500 }}>{user?.name?.split(' ')[0] ?? user?.email?.split('@')[0]}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PIPELINE STATUS ──────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ position: 'sticky', top: 100, zIndex: 180, padding: '0 32px 20px' }}>
          <div className="afi" style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div className="card-terra" style={{ padding: '28px 36px', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h4 style={{ fontStyle: 'italic', fontWeight: 400 }}>Crafting your media pack…</h4>
                <span className="label">Live pipeline</span>
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                {STEPS.map((s, i) => {
                  const done = stepIdx > i, cur = stepIdx === i
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: i > stepIdx ? 0.28 : 1, transition: 'opacity .5s', position: 'relative' }}>
                      {i > 0 && <div style={{ position: 'absolute', top: 14, right: '50%', left: '-50%', height: 2, borderRadius: 2, background: done ? 'linear-gradient(90deg,var(--terra),var(--coral))' : 'var(--taupe)', transition: 'background .6s' }} />}
                      <div className={`step-dot ${done ? 's-done' : cur ? 's-cur' : 's-wait'}`} style={{ zIndex: 1 }}>{done ? '✓' : i + 1}</div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: cur ? 'var(--brown-dk)' : done ? 'var(--brown-md)' : 'var(--gray)', transition: 'color .4s', marginBottom: 2 }}>{s.label}</p>
                        <p className="caption">{s.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: 700, margin: '20px auto', padding: '14px 22px', background: '#fff5f5', border: '1px solid rgba(220,53,69,.2)', borderRadius: 12, color: '#c62828', fontSize: 14, marginLeft: 32 }}>⚠ {error}</div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          RESULTS
      ───────────────────────────────────────────────────────────────────────── */}
      {pack && (
        <section ref={resultRef} style={{ padding: '72px 32px 80px', maxWidth: 1180, margin: '0 auto' }}>
          <Reveal style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,var(--taupe))' }} />
              <div style={{ textAlign: 'center' }}>
                <div className="gold-bar" style={{ margin: '0 auto 8px' }} />
                <span className="label">Your media pack is ready</span>
                <div className="gold-bar" style={{ margin: '8px auto 0' }} />
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,var(--taupe),transparent)' }} />
            </div>

            {/* ── Tab bar ────────────────────────────────────────────────── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', gap: 0, marginBottom: 32 }}>
              {([['content','Content'],['boost','Boost'],['discover','Discover']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  style={{
                    fontSize: 14, fontWeight: 600, fontFamily: 'Roboto, sans-serif',
                    padding: '12px 28px', cursor: 'pointer', border: 'none', background: 'transparent',
                    color: resultTab === id ? '#FEFEF8' : 'rgba(254,254,248,.4)',
                    borderBottom: resultTab === id ? '2px solid var(--gold)' : '2px solid transparent',
                    marginBottom: -1, transition: 'all .18s', letterSpacing: '.01em',
                  }}
                >{label}</button>
              ))}
            </div>
          </Reveal>

          {/* ── Boost tab ─────────────────────────────────────────────────── */}
          {resultTab === 'boost' && (
            !pack
              ? <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(254,254,248,.35)', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>Generate content first, then we&apos;ll build your ad strategy.</div>
              : <BoostTab data={boostData} loading={boostLoading} />
          )}

          {/* ── Discover tab ──────────────────────────────────────────────── */}
          {resultTab === 'discover' && (
            !pack
              ? <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(254,254,248,.35)', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>Generate content first, then we&apos;ll build your SEO assets.</div>
              : <DiscoverTab data={discoverData} loading={discoverLoading} spec={pack?.spec} />
          )}

          {/* ── Content tab ───────────────────────────────────────────────── */}
          {resultTab === 'content' && (<>

          {/* Story Spec */}
          <Reveal style={{ marginBottom: 24 }}>
            <div className="card" style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,var(--gold),var(--copper))' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 48, alignItems: 'flex-start' }} className="grid-2col">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span className="label">Story Intelligence</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.3)', borderRadius: 100, padding: '4px 12px' }}>
                      <span style={{ fontSize: 10, color: 'var(--copper)' }}>✓</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--copper)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Fact-verified</span>
                    </span>
                  </div>
                  <h3 style={{ marginBottom: 16, fontSize: 'clamp(18px,2.4vw,28px)', lineHeight: 1.3 }}>{pack.spec.headline}</h3>
                  <p style={{ marginBottom: 28, lineHeight: 1.8 }}>{pack.spec.lede}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                    {pack.spec.facts?.map((f: string, i: number) => (
                      <div key={i} className="fact-p">
                        <span style={{ fontFamily: 'Roboto, sans-serif', fontStyle: 'italic', color: 'var(--terra)', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,212,184,.18)', border: '1px solid rgba(232,156,127,.22)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
                    <span className="label" style={{ display: 'block', marginBottom: 8 }}>Why it matters</span>
                    <p style={{ fontSize: 14, lineHeight: 1.75 }}>{pack.spec.why_it_matters}</p>
                  </div>

                  {/* Keep reading */}
                  {pack.spec.relatedArticles?.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,var(--taupe))' }} />
                        <span className="label" style={{ whiteSpace: 'nowrap' }}>Keep reading</span>
                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,var(--taupe),transparent)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pack.spec.relatedArticles.map((a: any, i: number) => (
                          <div key={i} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            padding: '12px 14px', borderRadius: 12,
                            border: '1px solid var(--border)', background: 'var(--bg2)',
                            transition: 'border-color .18s, box-shadow .18s', cursor: 'default',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--taupe-d)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(212,175,55,.12)', border: '1px solid rgba(212,175,55,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontFamily: "'Roboto', sans-serif", fontStyle: 'italic', fontWeight: 700, color: 'var(--copper)' }}>{i + 1}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, fontFamily: 'Roboto, sans-serif', marginBottom: 3 }}>{a.title}</p>
                              <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 5 }}>{a.summary}</p>
                              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--terra)', fontFamily: 'Roboto,sans-serif' }}>{a.source}</span>
                                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--taupe)', flexShrink: 0 }} />
                                <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'Roboto,sans-serif' }}>{a.readTime}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 5, padding: '2px 7px', color: 'var(--copper)', fontFamily: 'Roboto,sans-serif', marginLeft: 'auto' }}>{a.topic}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="card-cream" style={{ padding: '24px' }}>
                    <span className="label" style={{ display: 'block', marginBottom: 14 }}>Caption copy</span>
                    <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{pack.spec.lede?.slice(0, 130)}…</p>
                    <div className="divider" style={{ marginBottom: 14 }} />
                    <p style={{ fontSize: 12, color: 'var(--terra)', fontStyle: 'italic' }}>{pack.spec.cta}</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Carousel + Podcast */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }} className="grid-2col">
            <Reveal>
              <div className="card" style={{ padding: '32px', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,var(--gold),var(--copper))' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 4 }}>
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>Carousel Pack</span>
                    <p className="caption">4 slides · 3:4 ratio · Instagram ready</p>
                  </div>
                  <span className="chip" style={{ background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.3)', color: 'var(--copper)' }}>Download ready</span>
                </div>
                {(() => {
                  const imgs: Slide[] = pack.images ?? []
                  const n = imgs.length > 0 ? imgs.length : 1
                  const idx = imgs.length > 0 ? carouselSlide % imgs.length : 0
                  const cur = imgs.length > 0 ? imgs[idx] : undefined
                  const labels = ['Brand Hook', 'Key Insights', 'Visual Story', 'Brand CTA']
                  const totalLabel = imgs.length || 4
                  return (
                    <>
                      <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          position: 'relative', width: '100%', maxWidth: 300, aspectRatio: '3/4',
                          borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg3)',
                          boxShadow: 'var(--shadow-md)',
                        }}>
                          {cur?.data && cur.data.length > 100
                            ? (
                              <img
                                src={`data:image/png;base64,${cur.data}`}
                                alt={`Slide ${idx + 1} preview`}
                                className="img-cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}
                                onClick={() => setLightboxImg(cur.data)}
                              />
                              )
                            : (
                              <div className="skel" style={{ width: '100%', height: '100%', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                                <div style={{ width: '70%', height: 8, background: 'var(--taupe-d)', borderRadius: 4 }} />
                                <div style={{ width: '55%', height: 6, background: 'var(--cream-d)', borderRadius: 4 }} />
                              </div>
                              )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(transparent,rgba(0,0,0,.78))', display: 'flex', alignItems: 'flex-end', padding: '0 12px 8px' }}>
                            <span style={{ fontSize: 9, color: 'rgba(254,254,248,.88)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, fontFamily: "'Roboto', sans-serif" }}>{labels[idx] ?? `Slide ${idx + 1}`}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: "'Roboto', sans-serif" }}>Preview · {imgs.length ? idx + 1 : 0} / {totalLabel}</span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={imgs.length < 2}
                            onClick={() => setCarouselSlide(s => (s + 1) % n)}
                            style={{ fontSize: 13, padding: '10px 22px', fontFamily: "'Roboto', sans-serif", opacity: imgs.length < 2 ? 0.45 : 1 }}
                          >
                            Next slide →
                          </button>
                        </div>
                        <p className="caption" style={{ textAlign: 'center', maxWidth: 320, fontFamily: "'Roboto', sans-serif" }}>Click the large preview to open full size. Thumbnails below switch the preview.</p>
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, fontFamily: "'Roboto', sans-serif" }}>All slides</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                        {imgs.map((img, i) => (
                          <div
                            key={i}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCarouselSlide(i) } }}
                            className="slide-card"
                            title="Set as preview"
                            style={{
                              cursor: 'pointer',
                              boxShadow: carouselSlide === i ? '0 0 0 2px var(--gold)' : undefined,
                            }}
                            onClick={() => setCarouselSlide(i)}
                          >
                            {img.data && img.data.length > 100
                              ? <img src={`data:image/png;base64,${img.data}`} alt={`Slide ${i + 1}`} className="img-cover" />
                              : <div className="skel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                                  <div style={{ width: '70%', height: 8, background: 'var(--taupe-d)', borderRadius: 4 }} />
                                  <div style={{ width: '55%', height: 6, background: 'var(--cream-d)', borderRadius: 4 }} />
                                </div>
                            }
                            {img.mock && <div style={{ position: 'absolute', top: 8, right: 8 }}><span className="mock-b">Generating…</span></div>}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(transparent,rgba(62,39,35,.7))', display: 'flex', alignItems: 'flex-end', padding: '0 10px 9px' }}>
                              <span style={{ fontSize: 9, color: 'rgba(254,254,248,.8)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, fontFamily: "'Roboto', sans-serif" }}>{labels[i]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="card" style={{ padding: '26px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,var(--copper),var(--gold))' }} />
                <div style={{ paddingTop: 4 }}>
                  <span className="label" style={{ display: 'block', marginBottom: 4 }}>Podcast Episode</span>
                  <p className="caption">AI-hosted · starts with your brand greeting · studio quality</p>
                </div>
                <div style={{ background: 'rgba(255,212,184,.18)', border: '1px solid rgba(232,156,127,.22)', borderRadius: 12, padding: '13px 16px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.7, fontStyle: 'italic', opacity: .85 }}>
                    "Good morning, {brandProfile?.name || 'Markentine'}. {pack.spec.tts_script?.slice(0, 90)}…"
                  </p>
                </div>
                {podcast
                  ? <audio controls src={`data:audio/wav;base64,${podcast}`} preload="auto"
                      onLoadedData={() => console.log('✓ Podcast loaded')}
                      onError={(e) => console.error('Podcast audio error:', e)}
                      style={{ width: '100%', accentColor: 'var(--terra)' }} />
                  : <button
                      className="btn btn-primary"
                      onClick={generatePodcast}
                      disabled={podcastLoading}
                      style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', borderRadius: 10, padding: '13px 20px', fontSize: 13 }}
                    >
                      <div className="btn-shine" />
                      {podcastLoading
                        ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} /> Recording…</>
                        : 'Generate Podcast'}
                    </button>
                }
              </div>
            </Reveal>
          </div>

          {/* Video */}
          <Reveal delay={80} style={{ marginBottom: 20 }}>
            <div className="card" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,var(--gold),var(--copper))' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 40, alignItems: 'center' }} className="grid-2col">
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: 4, paddingTop: 4 }}>Cinematic Video Clip</span>
                  <p className="caption" style={{ marginBottom: 20 }}>8 seconds · 9:16 vertical · native audio synchronized</p>
                  <div style={{ background: 'rgba(255,212,184,.18)', border: '1px solid rgba(232,156,127,.22)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    <span className="label" style={{ display: 'block', marginBottom: 6 }}>AI video direction</span>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, fontStyle: 'italic' }}>"{pack.spec.video_prompt}"</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Native audio', '9:16 vertical', '8 seconds', 'Cinematic grade'].map(t => <span key={t} className="chip">{t}</span>)}
                  </div>
                </div>
                <div>
                  {pack.video
                    ? <video controls src={`data:video/mp4;base64,${pack.video}`} style={{ width: '100%', borderRadius: 14, border: '1px solid var(--border)' }} />
                    : <div style={{ aspectRatio: '9/16', background: 'var(--bg2)', border: '1.5px dashed var(--taupe)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--terra),var(--coral))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#FEFEF8', fontSize: 18, marginLeft: 3 }}>▶</span></div>
                        <p className="caption" style={{ lineHeight: 1.6 }}>Renders with real API key</p>
                        <span className="mock-b">Generating…</span>
                      </div>}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Platform Posts */}
          {posts && (
            <Reveal delay={60}>
              <PlatformPosts posts={posts} />
            </Reveal>
          )}

          {/* Download */}
          <Reveal delay={60}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div className="card-terra" style={{ padding: '20px 26px' }}>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, fontStyle: 'italic', color: 'var(--terra)', marginBottom: 6 }}>Complete pack ready to download</p>
                <p className="caption" style={{ lineHeight: 1.6 }}>4× carousel PNGs · video_clip.mp4 · story_spec.json · caption.txt</p>
              </div>
              <button className="btn btn-primary" onClick={downloadZip} style={{ minWidth: 210, borderRadius: 12, padding: '14px 28px', fontSize: 14, whiteSpace: 'nowrap' }}>
                <div className="btn-shine" />
                Download ZIP →
              </button>
            </div>
          </Reveal>
          </>)}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MY PACKS — HISTORY SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      {isSignedIn && (
        <section ref={historyRef} className="history-panel">
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>

            {/* Header */}
            <Reveal style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--copper)', fontFamily: 'Roboto,sans-serif', display: 'block', marginBottom: 10 }}>Your workspace</span>
                  <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', color: '#FEFEF8', fontFamily: 'Roboto, sans-serif' }}>
                    My Packs
                    {history.length > 0 && <span style={{ fontFamily: 'Roboto,sans-serif', fontSize: 18, fontWeight: 400, color: 'var(--text-3)', marginLeft: 12 }}>({history.length})</span>}
                  </h2>
                  <p style={{ marginTop: 8, fontSize: 14, maxWidth: 480, color: 'var(--text-3)' }}>
                    Every media pack you've created, saved to your account. Click any card to view the full pack details.
                  </p>
                </div>
                {history.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setSelectedPackIds(new Set(history.map(h => h.id))); setSelectingPacks(true) }}
                      disabled={newsLoading}
                      className="btn btn-ghost"
                      style={{ fontSize: 14, padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 8, opacity: newsLoading ? .7 : 1 }}>
                      {newsLoading
                        ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(232,156,127,.3)', borderTopColor: 'var(--terra)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Generating…</>
                        : <>Generate news report</>}
                    </button>
                    <button
                      onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => inputRef.current?.focus(), 500) }}
                      className="btn btn-primary" style={{ fontSize: 14, padding: '14px 28px' }}>
                      <div className="btn-shine" />+ Create new pack
                    </button>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Empty state */}
            {history.length === 0 ? (
              <Reveal>
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg2)', border: '2px dashed var(--taupe-d)', borderRadius: 24 }}>
                  <h3 style={{ marginBottom: 12, fontWeight: 400, fontStyle: 'italic', color: '#FEFEF8', fontFamily: 'Roboto, sans-serif' }}>No packs created yet</h3>
                  <p style={{ color: 'var(--text-3)', marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
                    Your created media packs will appear here. Create your first one above!
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => inputRef.current?.focus(), 500) }}
                    style={{ fontSize: 14, padding: '14px 28px' }}>
                    <div className="btn-shine" />Create your first pack →
                  </button>
                </div>
              </Reveal>
            ) : (
              <div className="history-grid">
                {history.map((item, i) => (
                  <Reveal key={item.id} delay={i * 40}>
                    <HistoryCard
                      item={item}
                      onView={() => {
                        setViewingItem(item)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                        // Show a summary modal/toast — for hackathon scope we just scroll up and show headline
                      }}
                      onDelete={() => handleDeleteHistory(item.id)}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── History item viewer modal ───────────────────────────────────────── */}
      {viewingItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setViewingItem(null)}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, padding: '40px', maxWidth: 640, width: '100%', boxShadow: 'var(--shadow-lg)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewingItem(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

            {/* Thumb */}
            {viewingItem.slideThumb && (
              <div style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                <img src={`data:image/png;base64,${viewingItem.slideThumb}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--copper)', fontFamily: 'Roboto,sans-serif', display: 'block', marginBottom: 10 }}>
              {new Date(viewingItem.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <h3 style={{ marginBottom: 16, lineHeight: 1.3, color: '#FEFEF8', fontFamily: 'Roboto, sans-serif' }}>{viewingItem.headline}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 20, color: 'var(--text-2)' }}>{viewingItem.lede}</p>
            <div style={{ background: 'rgba(255,212,184,.18)', border: '1px solid rgba(232,156,127,.22)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--copper)', fontFamily: 'Roboto,sans-serif', display: 'block', marginBottom: 8 }}>Why it matters</span>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-2)' }}>{viewingItem.why_it_matters}</p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => { setHeadline(viewingItem.headline); setViewingItem(null); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => generate(), 300) }}
                style={{ flex: 1, fontSize: 14, padding: '14px', borderRadius: 12 }}>
                <div className="btn-shine" />Regenerate this pack →
              </button>
              <button
                onClick={() => { handleDeleteHistory(viewingItem.id); setViewingItem(null) }}
                style={{ padding: '14px 18px', background: 'var(--bg2)', border: '1px solid var(--taupe-d)', borderRadius: 12, color: 'var(--terra)', fontSize: 13, cursor: 'pointer', fontFamily: 'Roboto,sans-serif', fontWeight: 500, transition: 'all .2s' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PACK SELECTION MODAL ─────────────────────────────────────────────── */}
      {selectingPacks && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(20,14,12,.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSelectingPacks(false)}
        >
          <div
            style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, maxWidth: 680, width: '100%', boxShadow: 'var(--shadow-lg)', position: 'relative', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <button
                onClick={() => setSelectingPacks(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 22, marginBottom: 6, color: '#FEFEF8' }}>Select packs for your report</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Choose which packs to include. The AI will synthesize them into one news article.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  onClick={() => setSelectedPackIds(new Set(history.map(h => h.id)))}
                  style={{ fontSize: 12, padding: '5px 14px', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 7, cursor: 'pointer', fontFamily: 'Roboto,sans-serif', fontWeight: 500, color: 'var(--copper)' }}>
                  Select all
                </button>
                <button
                  onClick={() => setSelectedPackIds(new Set())}
                  style={{ fontSize: 12, padding: '5px 14px', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 7, cursor: 'pointer', fontFamily: 'Roboto,sans-serif', fontWeight: 500, color: 'var(--copper)' }}>
                  Clear all
                </button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>
                  {selectedPackIds.size} of {history.length} selected
                </span>
              </div>
            </div>

            {/* Pack list */}
            <div style={{ overflowY: 'auto', padding: '16px 32px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map(item => {
                  const checked = selectedPackIds.has(item.id)
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                        border: `1.5px solid ${checked ? 'var(--terra)' : 'var(--border)'}`,
                        background: checked ? 'rgba(255,212,184,.15)' : '#fff',
                        transition: 'all .18s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedPackIds(prev => {
                            const next = new Set(prev)
                            next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                            return next
                          })
                        }}
                        style={{ width: 17, height: 17, accentColor: 'var(--terra)', flexShrink: 0, cursor: 'pointer' }}
                      />
                      <img
                        src={getTopicImage(item.headline)}
                        alt=""
                        style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0, filter: 'brightness(.85)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#FEFEF8', lineHeight: 1.4, fontFamily: 'Roboto, sans-serif', marginBottom: 3 }}>
                          {item.headline.length > 80 ? item.headline.slice(0, 80) + '…' : item.headline}
                        </p>
                        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.35)' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '18px 32px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectingPacks(false)}
                className="btn btn-ghost"
                style={{ fontSize: 14, padding: '12px 22px' }}>
                Cancel
              </button>
              <button
                onClick={() => generateNewsArticle(history.filter(h => selectedPackIds.has(h.id)))}
                disabled={selectedPackIds.size === 0}
                className="btn btn-primary"
                style={{ fontSize: 14, padding: '12px 28px', opacity: selectedPackIds.size === 0 ? .45 : 1 }}>
                <div className="btn-shine" />Generate report from {selectedPackIds.size} pack{selectedPackIds.size !== 1 ? 's' : ''} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEWS ARTICLE MODAL ───────────────────────────────────────────────── */}
      {newsArticle && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(20,14,12,.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' }}
          onClick={() => setNewsArticle(null)}
        >
          <div
            style={{ background: '#FEFEF8', borderRadius: 28, maxWidth: 760, width: '100%', boxShadow: '0 32px 80px rgba(20,14,12,.35)', position: 'relative', overflow: 'hidden', marginBottom: 40 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setNewsArticle(null)}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(62,39,35,.55)', backdropFilter: 'blur(6px)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#FEFEF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

            {/* Hero image */}
            <div style={{ height: 320, position: 'relative', overflow: 'hidden' }}>
              <img
                src={`https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=85`}
                alt="News report"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.6)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(20,14,12,.8) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 36px' }}>
                <span style={{ display: 'inline-block', background: 'var(--terra)', color: '#FEFEF8', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 6, marginBottom: 12, fontFamily: 'Roboto,sans-serif' }}>
                  {newsArticle.category ?? 'Media Intelligence Report'}
                </span>
                <h2 style={{ color: '#FEFEF8', fontFamily: 'Roboto, sans-serif', fontSize: 'clamp(20px,3vw,30px)', lineHeight: 1.25, marginBottom: 10 }}>{newsArticle.title}</h2>
                <p style={{ color: 'rgba(254,254,248,.75)', fontSize: 14, lineHeight: 1.6 }}>{newsArticle.subtitle}</p>
              </div>
            </div>

            {/* Meta bar */}
            <div style={{ padding: '16px 36px', borderBottom: '1px solid var(--border-d)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#E89C7F,#FF9B85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MarkentineLogoIcon size={17} color="#FEFEF8" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'Roboto,sans-serif' }}>{newsArticle.byline ?? 'Markentine AI Newsroom'}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>📖 {newsArticle.readTime ?? `${Math.max(2, history.length)} min read`}</span>
              <button
                onClick={() => {
                  const text = `${newsArticle.title}\n\n${newsArticle.subtitle}\n\n${newsArticle.intro}\n\n${(newsArticle.sections ?? []).map((s: any) => `${s.heading}\n\n${s.body}`).join('\n\n')}\n\n${newsArticle.conclusion}`
                  navigator.clipboard.writeText(text)
                }}
                style={{ fontSize: 12, padding: '6px 14px', background: 'var(--bg2)', border: '1px solid var(--taupe-d)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Roboto,sans-serif', fontWeight: 500, color: 'var(--text-2)', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--terra)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.borderColor = 'var(--taupe-d)' }}
              >Copy text</button>
            </div>

            {/* Article body */}
            <div style={{ padding: '32px 36px 40px' }}>
              {/* Intro */}
              <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--text)', fontWeight: 500, marginBottom: 28, borderLeft: '3px solid var(--terra)', paddingLeft: 18 }}>
                {newsArticle.intro}
              </p>

              {/* Sections */}
              {(newsArticle.sections ?? []).map((section: any, i: number) => (
                <div key={i} style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 18, fontFamily: 'Roboto, sans-serif', color: 'var(--text)', marginBottom: 12, lineHeight: 1.35 }}>{section.heading}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.9, color: '#5a4a3a', whiteSpace: 'pre-line' }}>{section.body}</p>
                  {i < (newsArticle.sections?.length ?? 0) - 1 && (
                    <div style={{ height: 1, background: 'var(--border-d)', marginTop: 32 }} />
                  )}
                </div>
              ))}

              {/* Conclusion */}
              {newsArticle.conclusion && (
                <div style={{ background: 'linear-gradient(135deg,rgba(232,156,127,.12),rgba(200,213,185,.12))', border: '1px solid var(--taupe-d)', borderRadius: 16, padding: '20px 24px', marginTop: 8 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--text)', fontStyle: 'italic' }}>{newsArticle.conclusion}</p>
                </div>
              )}

              {/* Tags */}
              {newsArticle.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 28 }}>
                  {newsArticle.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', background: 'var(--bg2)', border: '1px solid var(--taupe-d)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-2)', fontFamily: 'Roboto,sans-serif' }}>{tag}</span>
                  ))}
                </div>
              )}

              {/* Source note */}
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 32, borderTop: '1px solid var(--border-d)', paddingTop: 16 }}>
                Generated by Markentine AI from {history.length} media pack{history.length !== 1 ? 's' : ''} in your workspace. For editorial use only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURES (for non-logged-in users) ──────────────────────────────── */}
      {!isSignedIn && !loading && mounted && (
        <>
          <section style={{ padding: '100px 32px', background: 'var(--bg2)', borderTop: '1px solid var(--border-d)' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="grid-2col">
              <Reveal>
                <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/3' }}>
                  <img src={IMG.fact} alt="AI research" className="img-cover img-hover-scale" style={{ height: '100%', width: '100%' }} />
                </div>
              </Reveal>
              <Reveal delay={100}>
                <span className="label" style={{ display: 'block', marginBottom: 12 }}>Story Intelligence</span>
                <div className="gold-bar" style={{ marginBottom: 24 }} />
                <h2 style={{ marginBottom: 20, color: '#FEFEF8', fontSize: 'clamp(24px,3vw,42px)' }}>Every fact verified before it publishes.</h2>
                <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>Most AI tools make things up. Markentine doesn&apos;t. Before generating a single image or caption, our engine cross-references your headline against live web sources and news databases in real time.</p>
                <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.8, marginBottom: 28 }}>You get a structured Story Spec — headline, five verified key facts, source citations, and a "why it matters" summary. If the story can't be verified, we flag it immediately. No hallucinations. No liability.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Live grounding', 'Source verified', 'Claim extraction', 'Zero hallucinations'].map(t => <span key={t} className="chip">{t}</span>)}
                </div>
              </Reveal>
            </div>
          </section>

          <section style={{ padding: '100px 32px', background: 'var(--bg2)' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="grid-2col">
              <Reveal>
                <span className="label" style={{ display: 'block', marginBottom: 12 }}>Carousel Generation</span>
                <div className="gold-bar" style={{ marginBottom: 24 }} />
                <h2 style={{ marginBottom: 20, color: '#FEFEF8', fontSize: 'clamp(24px,3vw,42px)' }}>Four slides. One story. Zero design skills.</h2>
                <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>Markentine builds a complete Instagram carousel from your verified story spec — headline, key facts, context, and CTA — each with bespoke AI-generated visuals that match the story's tone.</p>
                <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.8, marginBottom: 28 }}>Every slide is sized to the 3:4 feed-safe format recommended by Meta. Typography is bold and legible at thumb-scroll speeds. Export as print-quality PNGs, ready to drop into Instagram, LinkedIn, or your scheduler.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['3:4 Format', 'Ad-quality visuals', 'Brand aesthetic', 'PNG export'].map(t => <span key={t} className="chip">{t}</span>)}
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/3' }}>
                  <img src={IMG.carousel} alt="Instagram carousel" className="img-cover img-hover-scale" style={{ height: '100%', width: '100%' }} />
                </div>
              </Reveal>
            </div>
          </section>

          {/* CTA */}
          <section style={{ padding: '100px 32px', background: 'var(--brown-dk)', position: 'relative', overflow: 'hidden' }}>
            <Reveal style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <span className="label" style={{ color: 'var(--peach-d)', display: 'block', marginBottom: 20 }}>Start for free today</span>
              <h2 style={{ color: 'var(--cream)', marginBottom: 20, lineHeight: 1.15 }}>
                Your first media pack<br /><span style={{ color: 'var(--coral-d)', fontStyle: 'italic' }}>is on us.</span>
              </h2>
              <p style={{ color: 'rgba(245,239,230,.55)', fontSize: 15, lineHeight: 1.75, marginBottom: 40 }}>No credit card. No setup. Create your account and have your first full media pack ready in about four minutes.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ fontSize: 15 }} onClick={() => signIn('google', { callbackUrl: '/' })}><div className="btn-shine" />Create free account →</button>
                <button className="btn btn-ghost" style={{ fontSize: 14, color: 'var(--peach)', borderColor: 'rgba(255,212,184,.4)' }} onClick={() => signIn('google', { callbackUrl: '/' })}>Log in</button>
              </div>
            </Reveal>
          </section>
        </>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--brown-dk)', borderTop: '1px solid rgba(255,255,255,.06)', padding: '56px 32px 36px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div className="nav-logo-mark" title="Markentine"><MarkentineLogoIcon /></div>
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--cream)', letterSpacing: '-.03em' }}>Markentine</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(245,239,230,.4)', maxWidth: 280, lineHeight: 1.75 }}>The AI-powered content intelligence platform for modern news brands and independent creators.</p>
              
            </div>
            {[['Product', ['Features', 'How it works', 'API', 'Broadcast']], ['Company', ['About us', 'Blog', 'Careers', 'Press']], ['Legal', ['Privacy', 'Terms', 'Cookies']]].map(([sec, links]) => (
              <div key={sec as string}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--peach)', marginBottom: 18, fontFamily: 'Roboto,sans-serif' }}>{sec as string}</p>
                {(links as string[]).map(l => (
                  <p key={l} style={{ fontSize: 13, color: 'rgba(245,239,230,.35)', marginBottom: 10, cursor: 'pointer', transition: 'color .2s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--peach)'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(245,239,230,.35)'}>{l}</p>
                ))}
              </div>
            ))}
          </div>
          <div className="divider" style={{ marginBottom: 28 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'rgba(245,239,230,.22)' }}>© 2026 Markentine Inc. All rights reserved.</p>
            <p style={{ fontSize: 12, color: 'rgba(245,239,230,.22)' }}>Crafted for creators who tell stories that matter.</p>
          </div>
        </div>
      </footer>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────────── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10,7,5,.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn .18s ease',
          }}
        >
          <img
            src={`data:image/png;base64,${lightboxImg}`}
            alt="Slide full size"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 'min(680px, 90vw)',
              maxHeight: '90vh',
              borderRadius: 18,
              boxShadow: '0 32px 80px rgba(0,0,0,.7)',
              objectFit: 'contain',
              cursor: 'default',
            }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: 'fixed', top: 24, right: 28,
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.15)',
              color: '#FEFEF8', borderRadius: '50%',
              width: 42, height: 42, fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
          >✕</button>
        </div>
      )}
    </>
  )
}