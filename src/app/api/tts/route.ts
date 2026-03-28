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

export async function POST(req: NextRequest) {
  const { tts_script, brandName = 'Markentine' } = await req.json()

  const greeting = `Good morning, ${brandName}.`

  const styledScript = `You are a warm, polished female podcast host — think NPR's Rachel Martin or a top-tier brand podcast presenter.
Your delivery is engaging, clear, and confident. You sound like you own the room but are talking directly to one listener.
Tone: professional yet conversational. Measured pace. A brief natural pause after the opening greeting.
Emphasise key names, numbers, and insights with light vocal weight — not dramatic, just intentional.
No filler words. No upspeak. Every sentence lands.

Read this podcast episode now: ${greeting} ${tts_script}`

  const generate = async (): Promise<typeof FALLBACK | { audio: string; mimeType: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: styledScript }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
    })

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!audioData) return FALLBACK

    const pcmData = Buffer.from(audioData, 'base64')
    const wavBuffer = buildWav(pcmData)
    const wavBase64 = wavBuffer.toString('base64')
    return { audio: wavBase64, mimeType: 'audio/wav' }
  }

  try {
    const result = await withTimeout(generate(), 30_000, FALLBACK)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
