import { jsonrepair } from 'jsonrepair'

/**
 * Parse JSON from Gemini (often wrapped in ```json fences, with minor syntax errors).
 */
export function parseGeminiJSON(raw: string): unknown {
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1)
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    const repaired = jsonrepair(cleaned)
    return JSON.parse(repaired)
  }
}
