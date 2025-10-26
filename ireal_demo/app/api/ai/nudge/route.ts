import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const lastNudgeTime = new Map<string, number>()
const COOLDOWN_MS = 20000 // 20 segundos

export async function POST(request: NextRequest) {
  try {
    const { fragment, userId } = await request.json()

    if (!fragment || typeof fragment !== "string") {
      return NextResponse.json({ error: "Fragment is required" }, { status: 400 })
    }

    const now = Date.now()
    const lastTime = lastNudgeTime.get(userId || "anonymous") || 0

    if (now - lastTime < COOLDOWN_MS) {
      // Retornar 204 sin contenido si está en cooldown
      return new NextResponse(null, { status: 204 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.error("[v0] GOOGLE_AI_API_KEY not configured")
      return new NextResponse(null, { status: 204 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const systemPrompt = `Eres un guía creativo inspirado en Rick Rubin. Tu rol es hacer preguntas breves y profundas que ayuden al creador a explorar su idea desde ángulos inesperados.

Reglas estrictas:
- Haz UNA pregunta concisa (8-25 palabras)
- Usa lenguaje directo y poético
- Enfócate en la esencia, no en lo técnico
- Provoca reflexión sin dar respuestas
- Siempre termina con "?"

Ejemplos de tu estilo:
"¿Qué pasaría si lo volteas al revés?"
"¿A quién le importa esto y por qué?"
"¿Qué estás evitando decir?"
"¿Cómo sonaría esto en silencio?"`

    const prompt = `${systemPrompt}\n\nEl creador está escribiendo:\n\n"${fragment}"\n\nHaz una pregunta breve (8-25 palabras) que lo ayude a profundizar.`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 50,
      },
    })

    const response = result.response
    const text = response.text().trim()

    lastNudgeTime.set(userId || "anonymous", now)

    return NextResponse.json({
      question: text,
      tokens: response.usageMetadata?.totalTokenCount || 0,
      model: "gemini-1.5-flash",
    })
  } catch (error) {
    console.error("[v0] AI nudge error:", error)
    return new NextResponse(null, { status: 204 })
  }
}
