import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  return Promise.race([promise, timeout])
}

const NICHE_CONTEXT: Record<string, { visual: string; music: string }> = {
  auto:          { visual: 'clean editorial',              music: 'neutral cinematic' },
  tech:          { visual: 'futuristic, minimalist, neon',  music: 'upbeat corporate electronic' },
  finance:       { visual: 'dark premium, charts, gold',    music: 'serious orchestral, measured' },
  defense:       { visual: 'dark tactical, military grey',  music: 'tense cinematic, percussion' },
  sports:        { visual: 'dynamic, bold colors, action',  music: 'driving drums, hype' },
  entertainment: { visual: 'vibrant, colorful, glossy',     music: 'upbeat pop, fun' },
  health:        { visual: 'clean white, calm blue-green',  music: 'gentle cinematic, hopeful' },
}

const TONE_CONTEXT: Record<string, { role: string; lede: string; facts: string; why: string; tts: string }> = {
  news: {
    role:  'You are a senior brand content strategist writing polished editorial copy for a leading media company. Be authoritative, factual, and precise. Third person. Think The Economist meets Bloomberg editorial — confident and clear.',
    lede:  'one authoritative sentence that captures the story with editorial polish — factual, compelling, no fluff',
    facts: 'verified, concrete facts presented with editorial weight — data-driven and credible',
    why:   '2 sentences on why this matters for brands, markets, or audiences — think strategic significance',
    tts:   'polished brand podcast host, warm and authoritative',
  },
  opinion: {
    role:  'You are a bold brand storyteller and thought-leadership writer. Take a clear, confident point of view. Be direct, provocative, and human. Use "we" and "you" to pull readers in.',
    lede:  'one punchy sentence with a clear point of view — makes the reader stop scrolling',
    facts: 'facts reframed through a brand lens — use them to support a clear argument',
    why:   '2 sentences arguing why this matters to brands and audiences — be bold, not diplomatic',
    tts:   'confident, engaging brand podcast host with energy and conviction',
  },
  explainer: {
    role:  'You are an educational content creator at a media company. Write for a general audience who is smart but not specialist. Use plain English, real-world analogies, and zero jargon.',
    lede:  'one simple sentence anyone can understand — no industry jargon, no assumptions about prior knowledge',
    facts: 'facts explained in plain language — use analogies and real-world comparisons',
    why:   '2 sentences on why everyday people and brands should care — make it tangible and relatable',
    tts:   'warm, clear podcast host explaining to a curious friend — approachable and engaging',
  },
}

function parseJSON(raw: string): any {
  // Strip markdown fences
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim()
  // If there's still surrounding text, extract the outermost JSON object
  const start = cleaned.indexOf('{')
  const end   = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1)
  return JSON.parse(cleaned)
}

export async function POST(req: NextRequest) {
  const { headline, niche = 'auto', tone = 'news' } = await req.json()

  const ctx   = NICHE_CONTEXT[niche]  ?? NICHE_CONTEXT.auto
  const style = TONE_CONTEXT[tone]    ?? TONE_CONTEXT.news

  const FALLBACK = {
    headline,
    lede: 'Processing…',
    facts: [] as string[],
    why_it_matters: '',
    cta: '',
    image_prompts: [] as string[],
    video_prompt: '',
    music_mood: 'neutral',
    tts_script: headline,
    relatedArticles: [] as any[],
    niche,
    tone,
  }

  const generate = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${style.role}
You are also specializing in the "${niche}" vertical.
Visual style: ${ctx.visual}
Music mood: ${ctx.music}

Given this headline, produce a structured story spec that matches the tone and vertical above exactly.

Headline: "${headline}"

Return ONLY valid JSON in this exact format:
{
  "headline": "cleaned up headline",
  "lede": "${style.lede}",
  "facts": ["${style.facts} — fact 1", "fact 2", "fact 3", "fact 4", "fact 5"],
  "why_it_matters": "${style.why}",
  "cta": "follow us for more updates",
  "image_prompts": [
    "cinematic visual prompt for slide 1 — style: ${ctx.visual}",
    "visual prompt for slide 2 — style: ${ctx.visual}",
    "visual prompt for slide 3 — style: ${ctx.visual}",
    "visual prompt for slide 4 — style: ${ctx.visual}"
  ],
  "video_prompt": "8-second cinematic video scene — visual style: ${ctx.visual}",
  "music_mood": "${ctx.music}",
  "tts_script": "${style.tts} reading: [headline]. [lede]. [why it matters]",
  "relatedArticles": [
    {
      "title": "headline of a real or plausible related article a reader would want next",
      "source": "publication name e.g. Reuters, Bloomberg, Wired, The Verge",
      "summary": "one sentence teaser of what it covers",
      "readTime": "X min read",
      "topic": "primary topic tag e.g. AI, Defense, Finance"
    },
    {
      "title": "second related article headline",
      "source": "publication name",
      "summary": "one sentence teaser",
      "readTime": "X min read",
      "topic": "topic tag"
    },
    {
      "title": "third related article headline",
      "source": "publication name",
      "summary": "one sentence teaser",
      "readTime": "X min read",
      "topic": "topic tag"
    }
  ]
}`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: tone === 'opinion' ? 0.7 : 0.3,
      },
    })

    const raw = response.text ?? '{}'
    const spec = parseJSON(raw)
    return { ...spec, niche, tone }
  }

  try {
    const result = await withTimeout(generate(), 45_000, FALLBACK)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
