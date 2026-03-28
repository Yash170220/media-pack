/**
 * Gemini often returns camelCase or slightly different shapes than our UI expects.
 * Normalizes discover API payloads so Keywords, Meta, Blog, GBP, Video SEO, etc. always render.
 */

function toStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

function toStrArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean)
  if (typeof v === 'string') return v.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
  return []
}

function normalizeH2(raw: unknown): { heading: string; description: string }[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const heading = toStr(o.heading ?? o.title ?? o.name ?? o.h2)
      const description = toStr(o.description ?? o.desc ?? o.summary ?? o.body ?? '')
      return { heading, description }
    }
    return { heading: toStr(item), description: '' }
  }).filter(s => s.heading)
}

export function normalizeDiscoverPayload(payload: any, spec: { headline?: string; lede?: string; cta?: string; facts?: string[] }) {
  const p = payload && typeof payload === 'object' ? { ...payload } : {}

  const headline = spec?.headline || 'Story'
  const lede = spec?.lede || ''

  // ── keywords ─────────────────────────────────────────────────────────────
  let kwIn: any = p.keywords || p.keyword_clusters || p.KeywordClusters || {}
  if (typeof kwIn === 'string') {
    try {
      kwIn = JSON.parse(kwIn)
    } catch {
      kwIn = {}
    }
  }
  let primary = toStrArr(kwIn.primary ?? kwIn.Primary ?? kwIn.primary_keywords)
  let secondary = toStrArr(kwIn.secondary ?? kwIn.Secondary ?? kwIn.secondary_keywords)
  let longTail = toStrArr(kwIn.long_tail ?? kwIn.longTail ?? kwIn.long_tail_keywords)
  let questions = toStrArr(kwIn.questions ?? kwIn.question_keywords ?? kwIn.Questions)

  if (primary.length === 0 && headline) {
    primary = headline.split(/\s+/).filter(w => w.length > 3).slice(0, 5)
    if (primary.length < 5) primary = [headline.slice(0, 48), ...primary].slice(0, 5)
  }
  if (secondary.length === 0) secondary = ['industry news', 'brand story', 'market update', 'audience insights', 'content strategy']
  if (longTail.length === 0) longTail = [`${headline} explained`, `what to know about ${headline.slice(0, 40)}`, `guide to related trends`]
  if (questions.length === 0) questions = [`What is ${headline.slice(0, 40)}?`, `Why does ${headline.slice(0, 35)} matter?`]

  p.keywords = {
    primary: primary.slice(0, 10),
    secondary: secondary.slice(0, 10),
    long_tail: longTail.slice(0, 10),
    questions: questions.slice(0, 10),
  }

  // ── meta tags ────────────────────────────────────────────────────────────
  const mt = p.meta_tags || p.metaTags || p.meta || {}
  const title = toStr(mt.title ?? mt.pageTitle ?? headline).slice(0, 60) || headline.slice(0, 60)
  const description = toStr(mt.description ?? mt.metaDescription ?? lede).slice(0, 155) || lede.slice(0, 155)
  const ogTitle = toStr(mt.og_title ?? mt.ogTitle ?? title).slice(0, 60)
  const ogDesc = toStr(mt.og_description ?? mt.ogDescription ?? description).slice(0, 155)
  const twitterCard = toStr(mt.twitter_card ?? mt.twitterCard ?? 'summary_large_image')
  p.meta_tags = { title, description, og_title: ogTitle, og_description: ogDesc, twitter_card: twitterCard }

  // ── blog outline ───────────────────────────────────────────────────────────
  const bo = p.blog_outline || p.blogOutline || {}
  let h2 = normalizeH2(bo.h2_sections ?? bo.h2Sections ?? bo.sections)
  if (h2.length === 0) {
    h2 = [
      { heading: 'Context and background', description: 'Set the scene for readers.' },
      { heading: 'Key takeaways', description: 'What matters most from the story.' },
      { heading: 'What happens next', description: 'Outlook and implications.' },
    ]
  }
  const slugRaw = toStr(bo.slug ?? bo.urlSlug).replace(/[^a-z0-9-]/gi, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  p.blog_outline = {
    title: toStr(bo.title ?? headline) || `Blog: ${headline.slice(0, 50)}`,
    slug: slugRaw || headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 48) || 'story-article',
    target_word_count: typeof bo.target_word_count === 'number' ? bo.target_word_count : (typeof bo.targetWordCount === 'number' ? bo.targetWordCount : 1500),
    h2_sections: h2,
    primary_keyword_for_post: toStr(bo.primary_keyword_for_post ?? bo.primaryKeyword ?? primary[0] ?? headline),
    internal_link_suggestions: toStrArr(bo.internal_link_suggestions ?? bo.internalLinkSuggestions).slice(0, 6),
  }

  // ── google business ───────────────────────────────────────────────────────
  const gbp = p.google_business_post || p.googleBusinessPost || {}
  p.google_business_post = {
    text: toStr(gbp.text ?? gbp.body ?? gbp.content).slice(0, 300) || `${headline.slice(0, 200)} — ${lede.slice(0, 90)}`.slice(0, 300),
    cta_type: toStr(gbp.cta_type ?? gbp.ctaType ?? 'LEARN_MORE') || 'LEARN_MORE',
    cta_url: toStr(gbp.cta_url ?? gbp.ctaUrl) || 'https://example.com',
  }

  // ── video seo ────────────────────────────────────────────────────────────
  const vs = p.video_seo || p.videoSeo || {}
  let ytTags = toStrArr(vs.youtube_tags ?? vs.youtubeTags)
  if (ytTags.length === 0) ytTags = primary.slice(0, 12)
  p.video_seo = {
    youtube_title: toStr(vs.youtube_title ?? vs.youtubeTitle ?? headline).slice(0, 70) || headline.slice(0, 70),
    youtube_description: toStr(vs.youtube_description ?? vs.youtubeDescription ?? lede) || `${lede}\n\n${headline}\n\nLearn more in the full article.`,
    youtube_tags: ytTags,
    tiktok_caption: toStr(vs.tiktok_caption ?? vs.tiktokCaption ?? `${headline.slice(0, 100)} #story #brand`).slice(0, 150),
  }

  // ── email subjects ───────────────────────────────────────────────────────
  let subs = toStrArr(p.email_subject_lines ?? p.emailSubjectLines)
  if (subs.length === 0) {
    subs = [
      `${headline.slice(0, 55)}`,
      `Quick read: ${headline.slice(0, 40)}`,
      `You should see this: ${headline.slice(0, 35)}`,
    ]
  }
  p.email_subject_lines = subs.slice(0, 5)

  // ── image alts ──────────────────────────────────────────────────────────
  const alts = p.image_alt_texts || p.imageAltTexts || {}
  p.image_alt_texts = {
    slide_1: toStr(alts.slide_1 ?? alts.slide1) || `${headline} — slide 1`,
    slide_2: toStr(alts.slide_2 ?? alts.slide2) || `${headline} — key insight`,
    slide_3: toStr(alts.slide_3 ?? alts.slide3) || `${headline} — visual`,
    slide_4: toStr(alts.slide_4 ?? alts.slide4) || `${headline} — call to action`,
  }

  return p
}
