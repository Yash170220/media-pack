import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  return Promise.race([promise, timeout])
}

const FALLBACK = {
  linkedin:  { post: 'Generating…', hashtags: [] as string[] },
  twitter_x: { main_tweet: 'Generating…', thread: [] as string[] },
  instagram: { caption: 'Generating…', hashtags: [] as string[] },
}

export async function POST(req: NextRequest) {
  const { spec, brandProfile } = await req.json()

  const generate = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    // ── Fetch currently trending hashtags via Search grounding ──────────────
    let trendingHashtags: string[] = []
    try {
      const trendingRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `What are the top 10 trending hashtags right now for this topic: "${spec.headline}". Return ONLY a JSON array of strings with no # symbol, no other text.`,
        config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
      })
      const raw = trendingRes.text?.replace(/```json|```/g, '').trim() ?? '[]'
      trendingHashtags = JSON.parse(raw)
    } catch { /* non-fatal */ }

    const trendingNote = trendingHashtags.length > 0
      ? `\nCurrently trending hashtags for this topic (use these where relevant, they are real-time): ${trendingHashtags.join(', ')}`
      : ''

    // ── Main posts generation ───────────────────────────────────────────────
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a world-class social media copywriter. Using the story spec below, write platform-native posts for LinkedIn, Twitter/X, and Instagram.

Story spec: ${JSON.stringify(spec)}

Brand tone: ${brandProfile?.tone || 'professional'}
Target audience: ${brandProfile?.audience || 'general business audience'}
Brand name: ${brandProfile?.name || 'Markentine'}${trendingNote}

Rules per platform:

LINKEDIN:
- 150-200 words. Hook first line that stops the scroll (no "I'm excited to share").
- 3-4 short paragraphs with line breaks between each.
- End with a genuine question to drive comments.
- 5 relevant trending hashtags at the bottom.
- Professional but human tone. First person if brand is personal, third person if corporate.

TWITTER_X:
- Max 280 characters for the main tweet.
- Then write a 4-tweet thread expanding the story — each tweet max 280 chars.
- Thread tweets numbered 1/ 2/ 3/ 4/.
- Punchy, no fluff. Use line breaks for rhythm.
- 2-3 hashtags woven naturally into the thread, not dumped at end.

INSTAGRAM:
- 2-3 sentence caption that works WITH the carousel visual (reference "swipe for more").
- Conversational, warm. Emojis used sparingly and purposefully.
- CTA: save this, share with someone who needs it, comment your take.
- 20-25 hashtags in a separate block below a line of dots (...).
- Mix of niche hashtags (low competition) and broad ones (high reach).
- Prioritise the trending hashtags provided above for maximum reach.

Return ONLY valid JSON in this exact format:
{
  "linkedin": { "post": "full post text", "hashtags": ["tag1", "tag2"] },
  "twitter_x": { "main_tweet": "text", "thread": ["tweet1", "tweet2", "tweet3", "tweet4"] },
  "instagram": { "caption": "text", "hashtags": ["tag1"] }
}`,
      config: { temperature: 0.7 },
    })

    let raw = response.text ?? '{}'
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1)
    const posts = JSON.parse(raw)
    return { ...posts, _trendingHashtags: trendingHashtags }
  }

  try {
    const result = await withTimeout(generate(), 25_000, FALLBACK)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
