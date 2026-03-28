import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  return Promise.race([promise, timeout])
}

const FALLBACK = { video: null, mocked: true }

export async function POST(req: NextRequest) {
  const { video_prompt, music_mood, headline } = await req.json()

  const generate = async (): Promise<typeof FALLBACK | { video: string; mimeType: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    // Sanitise headline — remove any special chars that could confuse the model
    const safeHeadline = (headline ?? video_prompt ?? '').replace(/["""]/g, '"').replace(/[''']/g, "'").trim()

    const videoPrompt = `Create an 8-second cinematic vertical video (9:16) strictly about this exact topic:

"${safeHeadline}"

STRICT CONTENT RULES — follow exactly, do not invent or hallucinate:
- Every visual element must directly represent the topic above — no generic b-roll, no unrelated imagery
- Do NOT invent company logos, product names, or brand visuals that are not clearly implied by the topic
- Do NOT add any on-screen text — no headlines, no lower thirds, no captions, no watermarks
- Stay 100% faithful to the topic; if unsure about a visual, default to the most literal interpretation

VISUAL DIRECTION (${video_prompt}):
- Setting: a real-world environment that logically matches this topic — offices, labs, streets, factories, or markets
- Subject: people, products, or places directly relevant to "${safeHeadline}"
- Camera: slow cinematic push-in or subtle pan — deliberate and composed, not handheld
- Lighting: professional cinematic lighting — rich contrast, warm colour grade
- Mood: ${music_mood ?? 'focused, premium, confident'}
- Style: high-end brand documentary — think Apple keynote b-roll or Bloomberg TV opening sequence
- NO AI glitch artefacts, NO stock footage aesthetic, NO hallucinated brand assets`

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: { aspectRatio: '9:16', durationSeconds: 8 },
    })

    // Poll every 10s, max 3 minutes (enforced by outer withTimeout)
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10_000))
      operation = await ai.operations.getVideosOperation({ operation })
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri
    if (!videoUri) return FALLBACK

    const videoRes = await fetch(`${videoUri}&key=${process.env.GEMINI_API_KEY}`)
    if (!videoRes.ok) return FALLBACK

    const videoB64 = Buffer.from(await videoRes.arrayBuffer()).toString('base64')
    return { video: videoB64, mimeType: 'video/mp4' }
  }

  try {
    // 180-second hard timeout — returns null video instead of hanging
    const result = await withTimeout(generate(), 180_000, FALLBACK)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
