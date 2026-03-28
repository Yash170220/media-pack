import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { parseGeminiJSON } from '@/lib/parse-gemini-json'

export async function POST(req: NextRequest) {
  const { spec } = await req.json()

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `You are a world-class performance marketing strategist. Based on the content brief below, generate a complete ad campaign strategy.

Content Brief:
Headline: "${spec.headline}"
Lede: "${spec.lede}"
Key Facts: ${JSON.stringify(spec.facts)}
Why It Matters: "${spec.why_it_matters}"
Niche/Vertical: "${spec.niche || 'auto'}"
CTA: "${spec.cta}"

Return ONLY valid JSON in this exact format:
{
  "campaign_objective": "AWARENESS",
  "platform_recommendations": [
    {
      "platform": "Instagram",
      "budget_percentage": 35,
      "one_line_reason": "Visual-first content performs best on Instagram for this topic",
      "recommended_format": "carousel_ad"
    }
  ],
  "ad_variants": [
    {
      "platform": "Instagram",
      "variants": [
        {
          "variant_label": "Stat Lead",
          "primary_text": "Under 150 chars ad copy here",
          "headline": "Under 40 chars headline",
          "cta": "Learn More"
        },
        {
          "variant_label": "Question Lead",
          "primary_text": "Under 150 chars ad copy here",
          "headline": "Under 40 chars headline",
          "cta": "Learn More"
        },
        {
          "variant_label": "Story Lead",
          "primary_text": "Under 150 chars ad copy here",
          "headline": "Under 40 chars headline",
          "cta": "Learn More"
        }
      ]
    }
  ],
  "targeting": {
    "age_range": [25, 45],
    "locations": ["United States", "United Kingdom"],
    "radius_miles": 25,
    "top_5_interests": ["Business", "Marketing", "Technology", "Entrepreneurship", "Finance"],
    "exclude": ["Competitors", "Existing customers"]
  },
  "budget_suggestion": {
    "daily_budget": 50,
    "duration_days": 14,
    "estimated_reach": "15,000 - 35,000",
    "estimated_clicks": "300 - 700"
  },
  "retargeting_note": "Stage 1 (Days 1-5): Awareness — reach cold audiences with the hero content. Stage 2 (Days 6-10): Consideration — retarget video viewers with the key facts variant. Stage 3 (Days 11-14): Conversion — retarget engaged users with the strongest CTA variant and a special offer or urgency hook."
}

Rules:
- campaign_objective must be one of: AWARENESS, CONSIDERATION, CONVERSION, ENGAGEMENT
- platform_recommendations: rank 5-7 platforms by fit, budget_percentage must sum to 100
- ad_variants: generate for the top 3 platforms from platform_recommendations
- each platform gets exactly 3 variants with labels: "Stat Lead", "Question Lead", "Story Lead"
- primary_text must be under 150 characters
- headline must be under 40 characters
- cta must be one of: "Order Now", "Learn More", "Sign Up", "Get Directions", "Book Now", "Shop Now"
- retargeting_note: one paragraph, 3 stages, concrete and actionable`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.4 },
    })
    const raw = response.text ?? '{}'
    return NextResponse.json(parseGeminiJSON(raw))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
