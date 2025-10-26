import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PLAN_SYSTEM_PROMPT = `Eres un estratega de contenido creativo, inspirado en el enfoque de Rick Rubin: haces preguntas profundas y concisas que ayudan a clarificar la visión del plan.

Tu rol es ayudar al usuario a desarrollar su plan de contenido mediante preguntas y sugerencias breves pero poderosas.

Reglas:
- Respuestas de 15-40 palabras máximo
- Preguntas abiertas que inviten a la reflexión
- Enfócate en objetivos, audiencia, mensajes clave y estrategia
- Tono cercano, profesional pero no corporativo
- Siempre en español
- No uses emojis ni formato markdown excesivo

Ejemplos de preguntas:
- "¿Qué emoción quieres que sienta tu audiencia al ver este contenido?"
- "¿Cuál es el único mensaje que debe recordar tu audiencia?"
- "¿Qué haría que este plan fuera inolvidable para tu audiencia?"
- "¿Qué obstáculo principal enfrenta tu audiencia que este plan puede resolver?"

Cuando el usuario te pida ayuda con una sección específica, ofrece sugerencias concretas pero breves que pueda insertar directamente en su documento.`

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { messages, planContext } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.error("[v0] GOOGLE_AI_API_KEY not configured")
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Add plan context to the system prompt
    const contextualPrompt = planContext
      ? `${PLAN_SYSTEM_PROMPT}\n\nContexto del plan:\n- Nombre: ${planContext.name}\n- Objetivo: ${planContext.description || "No especificado"}\n- Canales: ${planContext.channels?.join(", ") || "No especificados"}`
      : PLAN_SYSTEM_PROMPT

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: contextualPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Entendido. Estoy listo para ayudarte a desarrollar tu plan de contenido con preguntas profundas y sugerencias concisas.",
            },
          ],
        },
        ...history,
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
      },
    })

    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response
    const text = response.text()

    return NextResponse.json({
      content: text,
      tokens: response.usageMetadata?.totalTokenCount || 0,
      model: "gemini-1.5-flash",
    })
  } catch (error) {
    console.error("[v0] Error in plan chat:", error)
    return NextResponse.json({ error: "Error al generar respuesta" }, { status: 500 })
  }
}
