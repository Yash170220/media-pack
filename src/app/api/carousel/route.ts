import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

// 1×1 transparent PNG — used when a slide times out or errors
const PLACEHOLDER_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  return Promise.race([promise, timeout])
}

function placeholderSlide(i: number) {
  return { slide: i + 1, data: PLACEHOLDER_B64, mimeType: 'image/png', mock: true }
}

export async function POST(req: NextRequest) {
  const { image_prompts, headline, facts } = await req.json()

    const slidePrompts: string[] = [
      // Slide 1 — Brand hook / ad opener
      `Premium Instagram advertisement. 4:5 vertical format.
   Bold, luxurious brand visual for the topic: "${headline}".
   Deep rich background — matte black, deep navy, or dark forest — with a single dramatic hero image centre-frame: a product, a moment, or a symbol that represents this story.
   One large display headline in elegant serif or ultra-bold sans-serif, centred, in cream or gold tones.
   Subtle gold accent line or geometric frame element. Tiny brand watermark bottom right.
   Style: Louis Vuitton campaign, Apple product launch ad, LVMH Instagram creative.
   Cinematic lighting. Zero clutter. Aspirational, premium, scroll-stopping.
   No "BREAKING". No news labels. Pure brand advertising aesthetic.`,

      // Slide 2 — Key facts (creative, not editorial)
      `Sophisticated Instagram carousel data slide. 4:5 vertical format.
   Topic insights: "${facts?.[0]}" and "${facts?.[1]}".
   Dark premium background (charcoal or deep warm brown). Large typographic numbers — the key stat — rendered in bold display font, oversized, almost abstract.
   Accent: single thin gold or copper horizontal rule. Secondary stat in smaller contrasting type below.
   Small label top-left in all-caps tracking: "THE NUMBERS". Minimal icon or geometric shape as visual anchor.
   Style: Bloomberg creative, Monocle magazine data spread, Wired infographic meets high fashion editorial.
   No clutter. No boxes or tables. Type-led, gallery-quality design. Photorealistic render.`,

      // Slide 3 — Context visual (unchanged — keep as-is)
      `Photorealistic editorial photograph representing: "${headline}".
   Wide cinematic composition. Real-world setting relevant to the story topic.
   Professional photography style — shot on Canon R5, 24mm lens, golden hour lighting.
   No text overlays. No graphics. Pure photographic image.
   Style: Reuters photojournalism, Associated Press editorial photo.
   High resolution, sharp focus, authentic documentary feel.`,

      // Slide 4 — CTA / brand closer
      `High-end Instagram ad closing slide. 4:5 vertical format.
   Warm, confident brand call-to-action. Background: rich terracotta, warm sand, or deep gold gradient — premium and human.
   Centre: one bold display phrase — something like "Stay Ahead." or "This Changes Everything." or a punchy insight derived from: "${headline}".
   Below it: a clean pill-shaped CTA button outline — "Follow for more" — in cream or white type.
   Small brand icon or monogram bottom centre. Generous negative space.
   Style: Glossier campaign, Airbnb brand ad, high-end DTC brand Instagram closer.
   Warm luxury aesthetic. Typography-forward. No generic clipart. No stock photo feel.`,
    ]

  const CAROUSEL_FALLBACK = { images: slidePrompts.map((_, i) => placeholderSlide(i)) }

  const generate = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const images = await Promise.all(
      slidePrompts.map(async (prompt, i) => {
        const genSlide = async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseModalities: ['TEXT', 'IMAGE'] },
          })

          const parts: any[] = response.candidates?.[0]?.content?.parts ?? []
          const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))
          const b64 = imgPart?.inlineData?.data ?? null
          return {
            slide: i + 1,
            data: b64,
            mimeType: imgPart?.inlineData?.mimeType ?? 'image/png',
            mock: !b64,
          }
        }

        // 30-second timeout per individual slide — fall back to placeholder only for that slide
        return withTimeout(genSlide(), 30_000, placeholderSlide(i))
      })
    )

    return { images }
  }

  try {
    // 45-second outer timeout for the whole carousel
    const result = await withTimeout(generate(), 45_000, CAROUSEL_FALLBACK)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(CAROUSEL_FALLBACK)
  }
}
