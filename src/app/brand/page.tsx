'use client'
import { MarkentineLogoIcon } from '@/components/markentine-logo-mark'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'

const BRAND_KEY = 'mp_brand_profile'

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Authoritative, data-driven, corporate' },
  { id: 'bold',         label: 'Bold',          desc: 'Direct, punchy, confident'            },
  { id: 'friendly',     label: 'Friendly',       desc: 'Warm, conversational, approachable'  },
  { id: 'playful',      label: 'Playful',         desc: 'Fun, energetic, witty'               },
  { id: 'thoughtful',   label: 'Thoughtful',      desc: 'Nuanced, expert, measured'          },
]

const NICHES = [
  'Tech & Startups', 'Finance & Investing', 'Defense & Security',
  'Health & Science', 'Media & Entertainment', 'Sports', 'Marketing', 'Other',
]

const PALETTES = [
  { id: 'champagne', label: 'Champagne', primary: '#D4AF37', secondary: '#8B6914', preview: ['#D4AF37', '#B87333', '#06080F'] },
  { id: 'midnight',  label: 'Midnight',  primary: '#7B9FD4', secondary: '#4A6FA5', preview: ['#7B9FD4', '#4A6FA5', '#050B1A'] },
  { id: 'emerald',   label: 'Emerald',   primary: '#50C878', secondary: '#2D8653', preview: ['#50C878', '#2D8653', '#061209'] },
  { id: 'crimson',   label: 'Crimson',   primary: '#DC143C', secondary: '#A00E2B', preview: ['#DC143C', '#A00E2B', '#100306'] },
  { id: 'pearl',     label: 'Pearl',     primary: '#E89C7F', secondary: '#DD8B6F', preview: ['#E89C7F', '#D4C4B0', '#FEFEF8'] },
  { id: 'obsidian',  label: 'Obsidian',  primary: '#9D8FCC', secondary: '#6B5FA3', preview: ['#9D8FCC', '#6B5FA3', '#08070F'] },
]

type BrandProfile = {
  name: string; tone: string; audience: string; niche: string; handle: string
  logo: string; founderPhoto: string; palette: string; customColor: string
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 10,
  border: '1px solid rgba(212,175,55,.2)', fontFamily: "'Roboto',sans-serif",
  fontSize: 14, color: '#fff', outline: 'none', background: 'rgba(255,255,255,.05)',
  transition: 'border-color .2s, box-shadow .2s',
}

const ONBOARDING_CALLBACK = '/brand?onboarding=true'

function BrandWizardInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'
  const { status }   = useSession()

  const [step, setStep]   = useState(1)
  const [saved, setSaved] = useState(false)
  const logoRef    = useRef<HTMLInputElement>(null)
  const founderRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<BrandProfile>({
    name: '', tone: 'professional', audience: '', niche: '', handle: '',
    logo: '', founderPhoto: '', palette: 'champagne', customColor: '',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(BRAND_KEY)
    if (raw) { try { setForm(JSON.parse(raw)) } catch {} }
  }, [])

  // Onboarding is only for signed-in users (direct URL access must authenticate first)
  useEffect(() => {
    if (!isOnboarding) return
    if (status !== 'unauthenticated') return
    signIn('google', { callbackUrl: ONBOARDING_CALLBACK })
  }, [isOnboarding, status])

  function set<K extends keyof BrandProfile>(k: K, v: BrandProfile[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'founderPhoto') {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await readFileAsDataURL(file)
    set(field, data)
  }

  function save() {
    localStorage.setItem(BRAND_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => {
      if (isOnboarding) router.replace('/')
      else setSaved(false)
    }, 1400)
  }

  const STEPS = [
    { n: 1, label: 'Identity'  },
    { n: 2, label: 'Visual'    },
    { n: 3, label: 'Voice'     },
    { n: 4, label: 'Audience'  },
  ]

  const canNext1 = form.name.trim().length > 0
  const canNext2 = true  // visual is always optional
  const canNext3 = form.tone.length > 0
  const canSave  = form.audience.trim().length > 0

  const activePalette = PALETTES.find(p => p.id === form.palette) ?? PALETTES[0]
  const accentColor = form.customColor || activePalette.primary

  if (isOnboarding && status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#06080F', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Roboto',sans-serif", color: 'rgba(255,255,255,.5)', fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  if (isOnboarding && status === 'unauthenticated') {
    return (
      <div style={{
        minHeight: '100vh', background: '#06080F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        fontFamily: "'Roboto',sans-serif", color: 'rgba(255,255,255,.65)', fontSize: 14, padding: 24,
      }}>
        <p>Sign in to set up your brand.</p>
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: ONBOARDING_CALLBACK })}
          style={{
            padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'Roboto',sans-serif",
            background: 'linear-gradient(135deg,#D4AF37,#B87333)', color: '#06080F',
          }}
        >
          Continue with Google
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06080F',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
      fontFamily: "'Roboto',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gridPulse{0%,100%{opacity:.055}50%{opacity:.09}}
        .brand-input:focus{border-color:${accentColor}66 !important; box-shadow:0 0 0 3px ${accentColor}18 !important;}
        .pal-btn{transition:all .18s;cursor:pointer;}
        .pal-btn:hover{transform:translateY(-2px);}
        .upload-zone{transition:all .22s;cursor:pointer;}
        .upload-zone:hover{border-color:${accentColor}88 !important;background:rgba(255,255,255,.06) !important;}
      `}</style>

      {/* Background grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(212,175,55,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.055) 1px,transparent 1px)`,
        backgroundSize: '60px 60px', animation: 'gridPulse 6s ease-in-out infinite',
      }} />
      {/* Radial glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: `radial-gradient(ellipse,${accentColor}09 0%,transparent 68%)`, pointerEvents: 'none', transition: 'background 0.5s' }} />

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32, position: 'relative', zIndex: 1, animation: 'fadeUp .7s both' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${accentColor},${activePalette.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${accentColor}44`, transition: 'all .4s' }}>
          {form.logo
            ? <img src={form.logo} alt="logo" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 9 }} />
            : <MarkentineLogoIcon size={22} />
          }
        </div>
        <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '.04em' }}>Markentine</span>
      </Link>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(212,175,55,.12)', borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,.6)', width: '100%', maxWidth: 560,
        overflow: 'hidden', position: 'relative', zIndex: 1,
        animation: 'fadeUp .8s cubic-bezier(.22,1,.36,1) .1s both',
      }}>

        {/* ── Gold accent top bar ── */}
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${accentColor},transparent)`, transition: 'background .5s' }} />

        {/* ── Header ── */}
        <div style={{ padding: '28px 36px 22px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          {isOnboarding ? (
            <>
              <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: accentColor, marginBottom: 10, transition: 'color .4s' }}>Bienvenue · Welcome</p>
              <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: 6 }}>
                Set up your brand identity
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', fontWeight: 300 }}>Takes 3 minutes · Powers every campaign we build for you.</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: accentColor, marginBottom: 10, transition: 'color .4s' }}>Paramètres · Settings</p>
              <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 1.15 }}>Brand DNA</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', fontWeight: 300, marginTop: 6 }}>Your brand profile shapes every piece of content we generate.</p>
            </>
          )}

          {/* Step progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 22 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'initial' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step > s.n ? accentColor : step === s.n ? 'rgba(255,255,255,.08)' : 'transparent',
                    color: step > s.n ? '#06080F' : step === s.n ? accentColor : 'rgba(255,255,255,.25)',
                    border: `1.5px solid ${step === s.n ? accentColor : step > s.n ? accentColor : 'rgba(255,255,255,.12)'}`,
                    transition: 'all .35s',
                  }}>{step > s.n ? '✓' : s.n}</div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: step === s.n ? accentColor : 'rgba(255,255,255,.25)', letterSpacing: '.06em', transition: 'color .3s' }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: step > s.n ? accentColor : 'rgba(255,255,255,.08)', margin: '0 6px', marginBottom: 18, transition: 'background .35s' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step content ── */}
        <div style={{ padding: '28px 36px' }}>

          {/* ═══ STEP 1: Identity ══════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Brand name */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 8 }}>
                  Brand / Company name *
                </label>
                <input
                  autoFocus
                  className="brand-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Markentine, The Daily Brief, Acme Corp"
                  style={{ ...INPUT_STYLE }}
                  onFocus={e => { e.target.style.borderColor = accentColor + '88'; e.target.style.boxShadow = `0 0 0 3px ${accentColor}18` }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,.2)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Niche */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 10 }}>
                  Industry / Niche
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {NICHES.map(n => (
                    <button key={n} onClick={() => set('niche', n)} style={{
                      fontSize: 11.5, fontWeight: 500, padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
                      border: `1px solid ${form.niche === n ? accentColor : 'rgba(255,255,255,.12)'}`,
                      background: form.niche === n ? `${accentColor}18` : 'transparent',
                      color: form.niche === n ? accentColor : 'rgba(255,255,255,.4)',
                      transition: 'all .15s', fontFamily: 'Roboto,sans-serif',
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Social handle */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 8 }}>
                  Social handle <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>(optional)</span>
                </label>
                <input
                  className="brand-input"
                  value={form.handle}
                  onChange={e => set('handle', e.target.value)}
                  placeholder="@yourbrand"
                  style={{ ...INPUT_STYLE }}
                  onFocus={e => { e.target.style.borderColor = accentColor + '88'; e.target.style.boxShadow = `0 0 0 3px ${accentColor}18` }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,.2)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Visual identity ════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Logo + Founder photos side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Logo upload */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 8 }}>
                    Brand logo <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>(optional)</span>
                  </label>
                  <div
                    className="upload-zone"
                    onClick={() => logoRef.current?.click()}
                    style={{
                      border: `1px dashed ${form.logo ? accentColor + '60' : 'rgba(255,255,255,.14)'}`,
                      borderRadius: 12, background: form.logo ? `${accentColor}08` : 'rgba(255,255,255,.03)',
                      height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {form.logo ? (
                      <>
                        <img src={form.logo} alt="logo" style={{ maxHeight: 90, maxWidth: '90%', objectFit: 'contain', borderRadius: 8 }} />
                        <button
                          onClick={e => { e.stopPropagation(); set('logo', '') }}
                          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', borderRadius: 4, fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
                        >✕</button>
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', fontFamily: 'Roboto,sans-serif', textAlign: 'center' }}>Click to upload<br/>PNG, JPG, SVG</span>
                      </>
                    )}
                    <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImage(e, 'logo')} />
                  </div>
                </div>

                {/* Founder photo */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 8 }}>
                    Founder photo <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>(optional)</span>
                  </label>
                  <div
                    className="upload-zone"
                    onClick={() => founderRef.current?.click()}
                    style={{
                      border: `1px dashed ${form.founderPhoto ? accentColor + '60' : 'rgba(255,255,255,.14)'}`,
                      borderRadius: 12, background: form.founderPhoto ? `${accentColor}08` : 'rgba(255,255,255,.03)',
                      height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {form.founderPhoto ? (
                      <>
                        <img src={form.founderPhoto} alt="founder" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
                        <button
                          onClick={e => { e.stopPropagation(); set('founderPhoto', '') }}
                          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', borderRadius: 4, fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
                        >✕</button>
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', fontFamily: 'Roboto,sans-serif', textAlign: 'center' }}>Click to upload<br/>founder portrait</span>
                      </>
                    )}
                    <input ref={founderRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImage(e, 'founderPhoto')} />
                  </div>
                </div>
              </div>

              {/* Colour palette */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 12 }}>
                  Brand colour palette
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {PALETTES.map(p => (
                    <button
                      key={p.id}
                      className="pal-btn"
                      onClick={() => set('palette', p.id)}
                      style={{
                        border: `1.5px solid ${form.palette === p.id ? p.primary : 'rgba(255,255,255,.08)'}`,
                        borderRadius: 10, padding: '10px 12px', background: form.palette === p.id ? `${p.primary}10` : 'rgba(255,255,255,.03)',
                        fontFamily: 'Roboto,sans-serif',
                      }}
                    >
                      {/* Swatch row */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'center' }}>
                        {p.preview.map((c, i) => (
                          <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: form.palette === p.id ? p.primary : 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom hex */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 8 }}>
                  Custom accent colour <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>(overrides palette)</span>
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.customColor || activePalette.primary}
                    onChange={e => set('customColor', e.target.value)}
                    style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 0 }}
                  />
                  <input
                    className="brand-input"
                    value={form.customColor}
                    onChange={e => set('customColor', e.target.value)}
                    placeholder={`${activePalette.primary}  (leave blank to use palette)`}
                    style={{ ...INPUT_STYLE, fontFamily: "'Roboto', sans-serif", fontSize: 13 }}
                    onFocus={e => { e.target.style.borderColor = accentColor + '88'; e.target.style.boxShadow = `0 0 0 3px ${accentColor}18` }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,.2)'; e.target.style.boxShadow = 'none' }}
                  />
                  {form.customColor && (
                    <button onClick={() => set('customColor', '')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Voice / Tone ═══════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>This shapes how every post, caption and thread is written.</p>
              {TONES.map(t => (
                <button key={t.id} onClick={() => set('tone', t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${form.tone === t.id ? accentColor + '60' : 'rgba(255,255,255,.08)'}`,
                  background: form.tone === t.id ? `${accentColor}0F` : 'rgba(255,255,255,.02)',
                  transition: 'all .18s', fontFamily: 'Roboto,sans-serif',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${form.tone === t.id ? accentColor : 'rgba(255,255,255,.2)'}`,
                    background: form.tone === t.id ? accentColor : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s',
                  }}>
                    {form.tone === t.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06080F' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: form.tone === t.id ? '#fff' : 'rgba(255,255,255,.55)', margin: 0 }}>{t.label}</p>
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.28)', margin: 0, marginTop: 2 }}>{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ═══ STEP 4: Audience ════════════════════════════════════════════ */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 8 }}>
                  Who are you writing for? *
                </label>
                <textarea
                  autoFocus
                  value={form.audience}
                  onChange={e => set('audience', e.target.value)}
                  placeholder="e.g. Early-stage founders and startup operators in B2B SaaS"
                  rows={3}
                  style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.65 }}
                  onFocus={e => { e.target.style.borderColor = accentColor + '88'; e.target.style.boxShadow = `0 0 0 3px ${accentColor}18` }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,.2)'; e.target.style.boxShadow = 'none' }}
                />
                <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,.2)', marginTop: 6, fontFamily: 'Roboto,sans-serif' }}>The more specific, the better the hashtag targeting and tone calibration.</p>
              </div>

              {/* Summary card */}
              <div style={{ background: `${accentColor}0A`, border: `1px solid ${accentColor}22`, borderRadius: 14, padding: '16px 18px', transition: 'all .4s' }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: accentColor, marginBottom: 12, transition: 'color .4s' }}>Your brand profile</p>

                {/* Logo + name row */}
                {(form.logo || form.founderPhoto) && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                    {form.logo && <img src={form.logo} alt="logo" style={{ height: 32, maxWidth: 80, objectFit: 'contain', borderRadius: 6 }} />}
                    {form.founderPhoto && <img src={form.founderPhoto} alt="founder" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', border: `1.5px solid ${accentColor}55` }} />}
                  </div>
                )}

                {/* Palette preview */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                  {activePalette.preview.map((c, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i === 0 && form.customColor ? form.customColor : c, border: '1px solid rgba(255,255,255,.1)' }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginLeft: 4 }}>{activePalette.label}{form.customColor ? ' + custom' : ''}</span>
                </div>

                {[['Brand', form.name], ['Niche', form.niche || '—'], ['Tone', form.tone], ['Handle', form.handle || '—']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'rgba(255,255,255,.25)', width: 52, flexShrink: 0, fontFamily: 'Roboto,sans-serif' }}>{k}</span>
                    <span style={{ color: 'rgba(255,255,255,.7)', fontWeight: 500, fontFamily: 'Roboto,sans-serif' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
            <div>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  fontSize: 13, fontWeight: 500, padding: '10px 18px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,.1)', background: 'transparent',
                  color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'Roboto,sans-serif',
                  transition: 'all .18s',
                }}>
                  ← Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {!isOnboarding && step === 1 && (
                <Link href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', textDecoration: 'none' }}>Cancel</Link>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : !canNext3}
                  style={{
                    fontSize: 13, fontWeight: 700, padding: '11px 28px', borderRadius: 9,
                    background: `linear-gradient(135deg,${accentColor},${activePalette.secondary})`,
                    color: '#06080F', border: 'none',
                    cursor: (step === 1 ? canNext1 : step === 2 ? canNext2 : canNext3) ? 'pointer' : 'not-allowed',
                    opacity: (step === 1 ? canNext1 : step === 2 ? canNext2 : canNext3) ? 1 : .3,
                    fontFamily: 'Roboto,sans-serif',
                    boxShadow: `0 4px 16px ${accentColor}44`,
                    transition: 'all .25s',
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={save}
                  disabled={!canSave || saved}
                  style={{
                    fontSize: 13, fontWeight: 700, padding: '11px 28px', borderRadius: 9,
                    background: saved ? '#16a34a' : `linear-gradient(135deg,${accentColor},${activePalette.secondary})`,
                    color: '#06080F', border: 'none',
                    cursor: canSave && !saved ? 'pointer' : 'not-allowed',
                    opacity: canSave ? 1 : .35,
                    fontFamily: 'Roboto,sans-serif',
                    boxShadow: `0 4px 16px ${saved ? '#16a34a44' : accentColor + '44'}`,
                    transition: 'all .25s',
                  }}
                >
                  {saved ? (isOnboarding ? 'Saved! Entering…' : 'Saved ✓') : (isOnboarding ? 'Launch my brand →' : 'Save profile')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isOnboarding && (
        <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.2)', position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ color: accentColor, textDecoration: 'none', fontWeight: 500, transition: 'color .3s' }}>← Back to Markentine</Link>
        </p>
      )}
    </div>
  )
}

export default function BrandPage() {
  return (
    <Suspense>
      <BrandWizardInner />
    </Suspense>
  )
}
