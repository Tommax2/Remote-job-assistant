import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

export async function extractResumeText(file) {
  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: file.buffer })
    try { return (await parser.getText()).text.trim() } finally { await parser.destroy() }
  }
  const result = await mammoth.extractRawText({ buffer: file.buffer })
  return result.value.trim()
}

function fallbackParse(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const skillHeading = lines.findIndex((line) => /^((technical|core) )?skills:?$/i.test(line))
  const skills = skillHeading < 0 ? [] : (lines[skillHeading + 1] || '').split(/[,|•]/).map((item) => item.trim()).filter(Boolean).slice(0, 30)
  return { professionalTitle: '', professionalSummary: '', skills, experience: [], education: [], projects: [] }
}

export async function parseResumeText(text) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.AI_API
  if (!apiKey) return { ...fallbackParse(text), parsingMode: 'basic' }
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'Extract only facts explicitly present in the CV. Never invent or infer qualifications. Return JSON with professionalTitle, professionalSummary, skills (strings), experience, education, and projects (arrays of objects). Use empty values when absent.' }] },
      contents: [{ role: 'user', parts: [{ text: text.slice(0, 60000) }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Gemini parsing is temporarily unavailable')
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  if (!content) throw new Error('Gemini returned no resume data')
  return { ...fallbackParse(text), ...JSON.parse(content), parsingMode: 'ai' }
}
