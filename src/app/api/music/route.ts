import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  return Promise.race([promise, timeout])
}

function buildWav(pcm: Buffer): Buffer {
  const sampleRate = 24000
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const dataSize = pcm.length
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcm])
}

const FALLBACK = { audio: null, mocked: true }

async function tryLyria(mood: string): Promise<{ audio: string; mimeType: string } | null> {
  const audioChunks: string[] = []

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    apiVersion: 'v1alpha',
  } as any)

  const session = await (ai.live as any).music.connect({
    model: 'models/lyria-realtime-exp',
    callbacks: {
      onmessage: (message: any) => {
        if (message.serverContent?.audioChunks) {
          for (const chunk of message.serverContent.audioChunks) {
            if (chunk.data) audioChunks.push(chunk.data)
          }
        }
      },
      onerror: (error: any) => {
        console.error('Lyria error:', error)
      },
    },
  })

  await session.setWeightedPrompts({
    weightedPrompts: [{ text: mood, weight: 1.0 }],
  })

  await session.setMusicGenerationConfig({
    musicGenerationConfig: { bpm: 120, musicGenerationMode: 'QUALITY' },
  })

  await session.play()
  await new Promise(resolve => setTimeout(resolve, 20_000))
  await session.close()

  if (audioChunks.length === 0) return null

  const combined = Buffer.from(audioChunks.join(''), 'base64')
  const wav = buildWav(combined)
  return { audio: wav.toString('base64'), mimeType: 'audio/wav' }
}

async function ttsFallback(mood: string): Promise<{ audio: string; mimeType: string } | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text:
      `You are a professional broadcast music composer. Create a continuous ambient instrumental background score.
Mood: ${mood}.
Style requirements:
- Completely instrumental — zero vocals, no lyrics, no speech
- Subtle, non-distracting — sits beneath a news anchor voice without overpowering it
- Cinematic warmth: think Bloomberg TV bed music, NPR underwriting music, or BBC World Service transitions
- Dynamic range: starts quietly, builds gently around the 8-second mark, fades elegantly
- Instruments: piano, soft strings, light electronic pads — or whatever best matches the mood
- Tempo: measured, professional — not energetic or frantic
- Duration: 25–30 seconds of continuous music
Generate the audio now.`
    }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  })

  const rawAudio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  if (!rawAudio) return null

  const wav = buildWav(Buffer.from(rawAudio, 'base64'))
  return { audio: wav.toString('base64'), mimeType: 'audio/wav' }
}

export async function POST(req: NextRequest) {
  const { music_mood } = await req.json()
  const mood = (music_mood as string | undefined) ?? 'upbeat cinematic background music'

  const generate = async (): Promise<typeof FALLBACK | { audio: string; mimeType: string }> => {
    // Try Lyria first
    try {
      const lyria = await tryLyria(mood)
      if (lyria) return lyria
    } catch { /* fall through to TTS fallback */ }

    // TTS fallback
    try {
      const tts = await ttsFallback(mood)
      if (tts) return tts
    } catch { /* fall through to null fallback */ }

    return FALLBACK
  }

  try {
    const result = await withTimeout(generate(), 35_000, FALLBACK)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
