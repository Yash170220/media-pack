import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  const { packs } = await req.json()

  const packSummaries = packs
    .map((p: any, i: number) => `Story ${i + 1}: "${p.headline}" — ${p.lede}. Key insight: ${p.why_it_matters}`)
    .join('\n')

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a senior journalist writing a comprehensive media intelligence report. 
Based on the following ${packs.length} news stories that a media team has been tracking, write a cohesive, professional news article that synthesizes all of them into one narrative about current events and trends.

Stories:
${packSummaries}

Return ONLY valid JSON in this exact format:
{
  "title": "compelling main headline for the consolidated report (max 12 words)",
  "subtitle": "one sentence deck that teases what the article covers",
  "category": "MEDIA INTELLIGENCE REPORT",
  "byline": "Markentine AI Newsroom",
  "readTime": "X min read",
  "intro": "2-3 sentence opening paragraph that hooks the reader and sets up why all these stories matter together",
  "sections": [
    {
      "heading": "section heading",
      "body": "2-3 paragraph section body that covers one or more of the stories in depth. Use full paragraphs, journalistic style."
    }
  ],
  "conclusion": "2-3 sentence closing paragraph with forward-looking perspective",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "relatedArticles": [
    {
      "title": "compelling headline for a related article that a reader of this report would want to read next",
      "source": "publication name e.g. Reuters, Bloomberg, Wired, The Economist",
      "summary": "one sentence teaser of what the article covers",
      "readTime": "X min read",
      "topic": "the primary topic tag e.g. AI, Finance, Defense"
    },
    {
      "title": "second related article headline",
      "source": "publication name",
      "summary": "one sentence teaser",
      "readTime": "X min read",
      "topic": "primary topic tag"
    },
    {
      "title": "third related article headline",
      "source": "publication name",
      "summary": "one sentence teaser",
      "readTime": "X min read",
      "topic": "primary topic tag"
    }
  ]
}`,
    config: { temperature: 0.5 },
  })

  const raw = response.text?.replace(/```json|```/g, '').trim() ?? '{}'
  const article = JSON.parse(raw)
  return NextResponse.json(article)
}
