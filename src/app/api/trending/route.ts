import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export async function GET() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a live news editor. Using your access to current web sources, return exactly 5 real breaking news headlines from the last 24 hours. Cover a mix of topics: technology, business, geopolitics, science, and one wildcard.

Return ONLY a valid JSON array of 5 strings, no other text:
["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"]`,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    },
  })

  const raw = response.text?.replace(/```json|```/g, '').trim() ?? '[]'
  const headlines: string[] = JSON.parse(raw)
  return NextResponse.json({ headlines })
}
