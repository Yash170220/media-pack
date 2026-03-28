import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeDiscoverPayload } from '@/lib/discover-normalize'
import { parseGeminiJSON } from '@/lib/parse-gemini-json'

/** Gemini often returns schema_markup as an object; UI expects a string. Always emit valid JSON-LD text. */
function normalizeSchemaMarkup(payload: any, spec: { headline?: string; lede?: string; cta?: string }) {
  let sm = payload.schema_markup
  if (sm != null && typeof sm === 'object') {
    try {
      payload.schema_markup = JSON.stringify(sm)
    } catch {
      payload.schema_markup = ''
    }
  } else if (typeof sm === 'string') {
    payload.schema_markup = sm.trim()
  } else {
    payload.schema_markup = ''
  }

  const empty = !payload.schema_markup
  if (empty) {
    const fallback = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: spec.headline || 'Article',
      description: spec.lede || '',
      datePublished: new Date().toISOString().slice(0, 10),
      author: { '@type': 'Organization', name: 'Markentine' },
      publisher: { '@type': 'Organization', name: 'Markentine' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://example.com/article' },
    }
    payload.schema_markup = JSON.stringify(fallback)
  }
}

export async function POST(req: NextRequest) {
  const { spec } = await req.json()

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `You are a world-class SEO strategist and digital marketing expert. Based on the content brief below, generate complete SEO and web presence assets.

Content Brief:
Headline: "${spec.headline}"
Lede: "${spec.lede}"
Key Facts: ${JSON.stringify(spec.facts)}
Why It Matters: "${spec.why_it_matters}"
CTA: "${spec.cta}"
Niche: "${spec.niche || 'auto'}"

Return ONLY valid JSON in this exact format:
{
  "keywords": {
    "primary": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "secondary": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "long_tail": ["long tail phrase 1", "long tail phrase 2", "long tail phrase 3", "long tail phrase 4", "long tail phrase 5"],
    "questions": ["How to...", "Where to...", "What is...", "Why does...", "When will..."]
  },
  "meta_tags": {
    "title": "SEO title under 60 chars",
    "description": "Meta description under 155 chars that entices clicks",
    "og_title": "Open Graph title for social sharing",
    "og_description": "Open Graph description for social sharing",
    "twitter_card": "summary_large_image"
  },
  "blog_outline": {
    "title": "SEO-optimized blog post title",
    "slug": "url-friendly-slug-here",
    "target_word_count": 1500,
    "h2_sections": [
      { "heading": "Section 1 Heading", "description": "What this section covers in one sentence" },
      { "heading": "Section 2 Heading", "description": "What this section covers in one sentence" },
      { "heading": "Section 3 Heading", "description": "What this section covers in one sentence" },
      { "heading": "Section 4 Heading", "description": "What this section covers in one sentence" },
      { "heading": "Section 5 Heading", "description": "What this section covers in one sentence" }
    ],
    "primary_keyword_for_post": "main keyword",
    "internal_link_suggestions": ["anchor text 1", "anchor text 2", "anchor text 3"]
  },
  "schema_markup": "{\"@context\":\"https://schema.org\",\"@type\":\"NewsArticle\",\"headline\":\"Article headline\",\"description\":\"Article description\",\"datePublished\":\"2026-03-25\",\"publisher\":{\"@type\":\"Organization\",\"name\":\"Markentine\"}}",
  "google_business_post": {
    "text": "Engaging GBP post under 300 chars with emoji ✨",
    "cta_type": "LEARN_MORE",
    "cta_url": "https://yourwebsite.com/blog/your-post"
  },
  "video_seo": {
    "youtube_title": "YouTube title under 70 chars",
    "youtube_description": "200-word optimized YouTube description with keywords naturally woven in. Describe the video content, what viewers will learn, and include a call to action. Add relevant keywords throughout.",
    "youtube_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
    "tiktok_caption": "TikTok caption under 150 chars with hashtags #relevant #tags"
  },
  "email_subject_lines": [
    "Subject line option 1 — curiosity hook",
    "Subject line option 2 — benefit-led",
    "Subject line option 3 — question format"
  ],
  "image_alt_texts": {
    "slide_1": "Descriptive, keyword-rich alt text for slide 1",
    "slide_2": "Descriptive, keyword-rich alt text for slide 2",
    "slide_3": "Descriptive, keyword-rich alt text for slide 3",
    "slide_4": "Descriptive, keyword-rich alt text for slide 4"
  }
}

Rules:
- All fields must be complete and immediately usable — no placeholders except the cta_url
- schema_markup must be a valid JSON-LD string (the entire thing as a string within the outer JSON)
- meta description must be under 155 characters
- title tag must be under 60 characters
- youtube_description must be at least 150 words
- tiktok_caption must be under 150 characters including hashtags
- slug must be URL-safe (lowercase, hyphens only, no special chars)
- Use Google Search grounding to ensure keywords reflect actual current search trends
- CRITICAL: Return strictly valid JSON. Escape every double quote inside string values as \\". No trailing commas in arrays or objects. No raw newlines inside strings — use \\n instead.`

  async function generateOnce(extraRules: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: extraRules ? `${prompt}\n\n${extraRules}` : prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    })
    const raw = response.text ?? '{}'
    return parseGeminiJSON(raw) as Record<string, unknown>
  }

  try {
    let payload: Record<string, unknown>
    try {
      payload = await generateOnce('')
    } catch {
      payload = await generateOnce(
        'Your previous output was not valid JSON. Reply with ONE JSON object only: escape all quotes in strings, no trailing commas, no markdown.'
      )
    }
    normalizeDiscoverPayload(payload, spec)
    normalizeSchemaMarkup(payload, spec)
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
